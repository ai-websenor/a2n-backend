import { pgTable, text, timestamp, boolean, integer, json, unique, index } from "drizzle-orm/pg-core";
import { projectVisibilityEnum, projectRoleEnum, invitationStatusEnum } from "./types";
import { user } from "./auth";

// Project core table
export const project = pgTable("project", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	color: text("color").notNull().default("#3B82F6"),
	icon: text("icon").default("folder"),
	visibility: projectVisibilityEnum("visibility").notNull().default("PRIVATE"),
	isArchived: boolean("is_archived").notNull().default(false),
	settings: json("settings").$type<{
		defaultWorkflowSettings?: {
			timeout?: number;
			retryPolicy?: {
				enabled: boolean;
				maxRetries: number;
				retryDelay: number;
			};
		};
		notifications?: {
			onWorkflowSuccess: boolean;
			onWorkflowFailure: boolean;
			channels: string[];
		};
		access?: {
			allowMemberInvitations: boolean;
			defaultMemberRole: "VIEWER" | "EDITOR" | "ADMIN";
		};
	}>(),
	metadata: json("metadata").$type<{
		tags?: string[];
		category?: string;
		priority?: "LOW" | "NORMAL" | "HIGH";
		dueDate?: string;
		client?: string;
		budget?: number;
		status?: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
	}>(),
	workflowCount: integer("workflow_count").notNull().default(0),
	memberCount: integer("member_count").notNull().default(1),
	lastActivityAt: timestamp("last_activity_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	archivedAt: timestamp("archived_at"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
	uniqueNamePerUser: unique("unique_project_name_per_user").on(table.userId, table.name),
	userIdx: index("idx_project_user").on(table.userId),
	visibilityIdx: index("idx_project_visibility").on(table.visibility),
	archivedIdx: index("idx_project_archived").on(table.isArchived),
	activityIdx: index("idx_project_activity").on(table.lastActivityAt),
}));

// Project member table
export const projectMember = pgTable("project_member", {
	id: text("id").primaryKey(),
	role: projectRoleEnum("role").notNull().default("VIEWER"),
	isActive: boolean("is_active").notNull().default(true),
	permissions: json("permissions").$type<{
		workflows?: {
			create: boolean;
			edit: boolean;
			delete: boolean;
			execute: boolean;
		};
		members?: {
			invite: boolean;
			remove: boolean;
			changeRole: boolean;
		};
		project?: {
			edit: boolean;
			delete: boolean;
			archive: boolean;
		};
	}>(),
	joinedAt: timestamp("joined_at").notNull().defaultNow(),
	lastActiveAt: timestamp("last_active_at"),
	invitedBy: text("invited_by")
		.references(() => user.id, { onDelete: "set null" }),
	projectId: text("project_id")
		.notNull()
		.references(() => project.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
	uniqueUserProject: unique("unique_user_project").on(table.userId, table.projectId),
	projectIdx: index("idx_project_member_project").on(table.projectId),
	userIdx: index("idx_project_member_user").on(table.userId),
	roleIdx: index("idx_project_member_role").on(table.role),
	activeIdx: index("idx_project_member_active").on(table.isActive),
}));

// Project invitation table
export const projectInvitation = pgTable("project_invitation", {
	id: text("id").primaryKey(),
	email: text("email").notNull(),
	role: projectRoleEnum("role").notNull().default("VIEWER"),
	status: invitationStatusEnum("status").notNull().default("PENDING"),
	permissions: json("permissions").$type<{
		workflows?: {
			create: boolean;
			edit: boolean;
			delete: boolean;
			execute: boolean;
		};
		members?: {
			invite: boolean;
			remove: boolean;
			changeRole: boolean;
		};
		project?: {
			edit: boolean;
			delete: boolean;
			archive: boolean;
		};
	}>(),
	invitationToken: text("invitation_token").notNull().unique(),
	message: text("message"),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	acceptedAt: timestamp("accepted_at"),
	revokedAt: timestamp("revoked_at"),
	projectId: text("project_id")
		.notNull()
		.references(() => project.id, { onDelete: "cascade" }),
	invitedBy: text("invited_by")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	acceptedBy: text("accepted_by")
		.references(() => user.id, { onDelete: "set null" }),
}, (table) => ({
	uniqueEmailProject: unique("unique_invitation_email_project").on(table.email, table.projectId),
	projectIdx: index("idx_project_invitation_project").on(table.projectId),
	emailIdx: index("idx_project_invitation_email").on(table.email),
	statusIdx: index("idx_project_invitation_status").on(table.status),
	tokenIdx: index("idx_project_invitation_token").on(table.invitationToken),
	expiresIdx: index("idx_project_invitation_expires").on(table.expiresAt),
}));