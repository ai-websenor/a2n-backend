import { pgTable, text, timestamp, boolean, integer, json, unique, index } from "drizzle-orm/pg-core";
import { triggerTypeEnum, workflowVisibilityEnum } from "./types";
import { user } from "./auth";
import { project } from "./projects";

export const workflow = pgTable("workflow", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	definition: json("definition").notNull(), // JSON schema for workflow graph
	isActive: boolean("is_active").notNull().default(true),
	isTemplate: boolean("is_template").notNull().default(false),
	visibility: workflowVisibilityEnum("visibility").notNull().default("PRIVATE"),
	version: integer("version").notNull().default(1),
	publishedVersion: integer("published_version"),
	tags: json("tags").$type<string[]>(), // Array of tags for categorization
	category: text("category"),
	variables: json("variables").$type<Record<string, any>>(), // Global workflow variables
	settings: json("settings").$type<{
		timeout?: number;
		retryPolicy?: {
			enabled: boolean;
			maxRetries: number;
			retryDelay: number;
		};
		notifications?: {
			onSuccess: boolean;
			onFailure: boolean;
			channels: string[];
		};
		concurrency?: {
			maxInstances: number;
			policy: "ALLOW" | "QUEUE" | "REJECT";
		};
	}>(),
	executionCount: integer("execution_count").notNull().default(0),
	successCount: integer("success_count").notNull().default(0),
	failureCount: integer("failure_count").notNull().default(0),
	lastExecutedAt: timestamp("last_executed_at"),
	avgExecutionTime: integer("avg_execution_time"), // in milliseconds
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	publishedAt: timestamp("published_at"),
	archivedAt: timestamp("archived_at"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	projectId: text("project_id")
		.references(() => project.id, { onDelete: "set null" }), // Allow workflows without projects
}, (table) => ({
	// Unique constraint for workflow name per user
	uniqueNamePerUser: unique("unique_workflow_name_per_user").on(table.userId, table.name),
	// Indexes for better query performance
	projectIdx: index("idx_workflow_project").on(table.projectId),
	userProjectIdx: index("idx_workflow_user_project").on(table.userId, table.projectId),
}));

export const workflowTrigger = pgTable("workflow_trigger", {
	id: text("id").primaryKey(),
	type: triggerTypeEnum("type").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	isActive: boolean("is_active").notNull().default(true),
	configuration: json("configuration").notNull().$type<{
		// Manual trigger config
		manual?: {
			requireConfirmation: boolean;
			parameters?: Record<string, any>;
		};
		// Webhook trigger config
		webhook?: {
			path: string;
			method: "GET" | "POST" | "PUT" | "DELETE";
			authentication?: {
				type: "NONE" | "API_KEY" | "BASIC" | "BEARER";
				credentials?: string; // credential ID reference
			};
			responseFormat?: "JSON" | "XML" | "TEXT";
		};
		// Schedule trigger config
		schedule?: {
			cron: string;
			timezone: string;
			startDate?: string;
			endDate?: string;
		};
		// Event trigger config
		event?: {
			source: string;
			eventType: string;
			filters?: Record<string, any>;
		};
	}>(),
	metadata: json("metadata").$type<Record<string, any>>(), // Additional trigger metadata
	triggerCount: integer("trigger_count").notNull().default(0),
	lastTriggeredAt: timestamp("last_triggered_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	workflowId: text("workflow_id")
		.notNull()
		.references(() => workflow.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const workflowVersion = pgTable("workflow_version", {
	id: text("id").primaryKey(),
	version: integer("version").notNull(),
	definition: json("definition").notNull(), // Snapshot of workflow at this version
	changeLog: text("change_log"),
	isPublished: boolean("is_published").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	workflowId: text("workflow_id")
		.notNull()
		.references(() => workflow.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
	// Unique constraint for version per workflow
	uniqueVersionPerWorkflow: unique("unique_version_per_workflow").on(table.workflowId, table.version),
}));

export const workflowShare = pgTable("workflow_share", {
	id: text("id").primaryKey(),
	permission: text("permission").notNull().default("VIEW"), // VIEW, EDIT, EXECUTE, ADMIN
	isActive: boolean("is_active").notNull().default(true),
	expiresAt: timestamp("expires_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	workflowId: text("workflow_id")
		.notNull()
		.references(() => workflow.id, { onDelete: "cascade" }),
	ownerId: text("owner_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	sharedWithUserId: text("shared_with_user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
	// Unique constraint for sharing workflow with specific user
	uniqueSharePerUser: unique("unique_share_per_user").on(table.workflowId, table.sharedWithUserId),
}));

export const workflowComment: any = pgTable("workflow_comment", {
	id: text("id").primaryKey(),
	content: text("content").notNull(),
	nodeId: text("node_id"), // Optional reference to specific node
	isResolved: boolean("is_resolved").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	workflowId: text("workflow_id")
		.notNull()
		.references(() => workflow.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	parentCommentId: text("parent_comment_id")
		.references((): any => workflowComment.id, { onDelete: "cascade" }),
});