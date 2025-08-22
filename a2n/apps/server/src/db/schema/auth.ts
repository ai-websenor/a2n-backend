import { pgTable, text, timestamp, boolean, serial, integer } from "drizzle-orm/pg-core";
import { userRoleEnum, accountStatusEnum } from "./types";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	password: text("password"), // For local authentication
	role: userRoleEnum("role").notNull().default("USER"),
	status: accountStatusEnum("status").notNull().default("ACTIVE"),
	isActive: boolean("is_active").notNull().default(true),
	lastLoginAt: timestamp("last_login_at"),
	twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
	twoFactorSecret: text("two_factor_secret"),
	workflowsCreated: integer("workflows_created").notNull().default(0),
	workflowsExecuted: integer("workflows_executed").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	isActive: boolean("is_active").notNull().default(true),
	lastAccessedAt: timestamp("last_accessed_at"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const refreshToken = pgTable("refresh_token", {
	id: text("id").primaryKey(),
	token: text("token").notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	isRevoked: boolean("is_revoked").notNull().default(false),
	revokedAt: timestamp("revoked_at"),
	revokedReason: text("revoked_reason"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	sessionId: text("session_id")
		.references(() => session.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	isActive: boolean("is_active").notNull().default(true),
	lastUsedAt: timestamp("last_used_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	type: text("type").notNull().default("EMAIL_VERIFICATION"), // EMAIL_VERIFICATION, PASSWORD_RESET, TWO_FACTOR
	isUsed: boolean("is_used").notNull().default(false),
	usedAt: timestamp("used_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
