import { pgTable, text, timestamp, boolean, integer, json, unique, index } from "drizzle-orm/pg-core";
import { healthStatusEnum, logLevelEnum, notificationTypeEnum } from "./types";
import { user } from "./auth";

export const appSetting = pgTable("app_setting", {
	id: text("id").primaryKey(),
	key: text("key").notNull().unique(),
	value: json("value").notNull().$type<any>(), // Can store any JSON value
	dataType: text("data_type").notNull().default("STRING"), // STRING, NUMBER, BOOLEAN, JSON, ARRAY
	description: text("description"),
	category: text("category").notNull().default("GENERAL"), // GENERAL, SECURITY, PERFORMANCE, FEATURE, etc.
	isPublic: boolean("is_public").notNull().default(false), // Whether setting can be read by non-admin users
	isEditable: boolean("is_editable").notNull().default(true), // Whether setting can be modified
	validationRule: json("validation_rule").$type<{
		required?: boolean;
		min?: number;
		max?: number;
		pattern?: string;
		enum?: any[];
		type?: string;
	}>(), // Validation rules for the value
	defaultValue: json("default_value").$type<any>(),
	environment: text("environment").default("ALL"), // ALL, PRODUCTION, STAGING, DEVELOPMENT
	tags: json("tags").$type<string[]>(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	updatedBy: text("updated_by")
		.references(() => user.id, { onDelete: "set null" }),
}, (table) => ({
	// Indexes for better query performance
	keyIdx: index("idx_app_setting_key").on(table.key),
	categoryIdx: index("idx_app_setting_category").on(table.category),
	publicIdx: index("idx_app_setting_public").on(table.isPublic),
	environmentIdx: index("idx_app_setting_environment").on(table.environment),
}));

export const healthCheck = pgTable("health_check", {
	id: text("id").primaryKey(),
	serviceName: text("service_name").notNull(),
	serviceType: text("service_type").notNull(), // DATABASE, REDIS, API, WEBHOOK, etc.
	endpoint: text("endpoint"), // URL or connection string to check
	status: healthStatusEnum("status").notNull().default("UNKNOWN"),
	responseTime: integer("response_time"), // in milliseconds
	message: text("message"),
	details: json("details").$type<{
		version?: string;
		uptime?: number;
		connections?: number;
		memory?: {
			used: number;
			total: number;
		};
		disk?: {
			used: number;
			total: number;
		};
		errorCount?: number;
		lastError?: string;
	}>(),
	checkInterval: integer("check_interval").notNull().default(60), // in seconds
	timeout: integer("timeout").notNull().default(30), // in seconds
	retryCount: integer("retry_count").notNull().default(3),
	alertThreshold: integer("alert_threshold").notNull().default(3), // Failed checks before alerting
	consecutiveFailures: integer("consecutive_failures").notNull().default(0),
	lastCheckAt: timestamp("last_check_at"),
	nextCheckAt: timestamp("next_check_at"),
	lastHealthyAt: timestamp("last_healthy_at"),
	lastUnhealthyAt: timestamp("last_unhealthy_at"),
	isEnabled: boolean("is_enabled").notNull().default(true),
	alertsEnabled: boolean("alerts_enabled").notNull().default(true),
	configuration: json("configuration").$type<{
		headers?: Record<string, string>;
		expectedStatus?: number[];
		expectedResponse?: any;
		authentication?: {
			type: "NONE" | "BASIC" | "BEARER" | "API_KEY";
			credentials?: string;
		};
	}>(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	// Indexes for better query performance
	serviceNameIdx: index("idx_health_check_service_name").on(table.serviceName),
	statusIdx: index("idx_health_check_status").on(table.status),
	enabledIdx: index("idx_health_check_enabled").on(table.isEnabled),
	nextCheckIdx: index("idx_health_check_next_check").on(table.nextCheckAt),
	serviceTypeIdx: index("idx_health_check_service_type").on(table.serviceType),
}));

export const schemaMigration = pgTable("schema_migration", {
	id: text("id").primaryKey(),
	version: text("version").notNull().unique(),
	name: text("name").notNull(),
	description: text("description"),
	filename: text("filename").notNull(),
	checksum: text("checksum").notNull(), // MD5 or SHA256 hash of migration file
	executionTime: integer("execution_time"), // in milliseconds
	status: text("status").notNull().default("PENDING"), // PENDING, RUNNING, SUCCESS, FAILED, ROLLED_BACK
	errorMessage: text("error_message"),
	rollbackScript: text("rollback_script"),
	dependencies: json("dependencies").$type<string[]>(), // Array of migration versions this depends on
	tags: json("tags").$type<string[]>(),
	environment: text("environment").default("ALL"), // ALL, PRODUCTION, STAGING, DEVELOPMENT
	appliedAt: timestamp("applied_at"),
	rolledBackAt: timestamp("rolled_back_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	appliedBy: text("applied_by")
		.references(() => user.id, { onDelete: "set null" }),
}, (table) => ({
	// Indexes for better query performance
	versionIdx: index("idx_schema_migration_version").on(table.version),
	statusIdx: index("idx_schema_migration_status").on(table.status),
	appliedAtIdx: index("idx_schema_migration_applied_at").on(table.appliedAt),
	environmentIdx: index("idx_schema_migration_environment").on(table.environment),
}));

export const systemLog = pgTable("system_log", {
	id: text("id").primaryKey(),
	level: logLevelEnum("level").notNull().default("INFO"),
	message: text("message").notNull(),
	source: text("source").notNull(), // SERVICE, MIGRATION, HEALTH_CHECK, SCHEDULER, etc.
	category: text("category"), // STARTUP, SHUTDOWN, ERROR, PERFORMANCE, SECURITY, etc.
	details: json("details").$type<Record<string, any>>(),
	correlationId: text("correlation_id"), // For tracing related log entries
	userId: text("user_id")
		.references(() => user.id, { onDelete: "set null" }),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	requestId: text("request_id"),
	duration: integer("duration"), // in milliseconds
	timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => ({
	// Indexes for better query performance
	levelIdx: index("idx_system_log_level").on(table.level),
	sourceIdx: index("idx_system_log_source").on(table.source),
	timestampIdx: index("idx_system_log_timestamp").on(table.timestamp),
	userIdx: index("idx_system_log_user").on(table.userId),
	correlationIdx: index("idx_system_log_correlation").on(table.correlationId),
	categoryIdx: index("idx_system_log_category").on(table.category),
}));

export const systemNotification = pgTable("system_notification", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	message: text("message").notNull(),
	type: notificationTypeEnum("type").notNull(),
	priority: text("priority").notNull().default("NORMAL"), // LOW, NORMAL, HIGH, CRITICAL
	category: text("category").notNull(), // SYSTEM, SECURITY, WORKFLOW, HEALTH, etc.
	isRead: boolean("is_read").notNull().default(false),
	isGlobal: boolean("is_global").notNull().default(false), // Whether notification is for all users
	expiresAt: timestamp("expires_at"),
	actionUrl: text("action_url"), // URL for notification action
	actionLabel: text("action_label"), // Label for notification action
	metadata: json("metadata").$type<{
		sourceId?: string;
		sourceType?: string;
		relatedUsers?: string[];
		channels?: string[];
	}>(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	readAt: timestamp("read_at"),
	userId: text("user_id")
		.references(() => user.id, { onDelete: "cascade" }),
	createdBy: text("created_by")
		.references(() => user.id, { onDelete: "set null" }),
}, (table) => ({
	// Indexes for better query performance
	userIdx: index("idx_system_notification_user").on(table.userId),
	typeIdx: index("idx_system_notification_type").on(table.type),
	priorityIdx: index("idx_system_notification_priority").on(table.priority),
	categoryIdx: index("idx_system_notification_category").on(table.category),
	readIdx: index("idx_system_notification_read").on(table.isRead),
	globalIdx: index("idx_system_notification_global").on(table.isGlobal),
	createdAtIdx: index("idx_system_notification_created_at").on(table.createdAt),
	expiresAtIdx: index("idx_system_notification_expires_at").on(table.expiresAt),
}));

export const apiKey = pgTable("api_key", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	keyHash: text("key_hash").notNull().unique(), // SHA256 hash of the API key
	prefix: text("prefix").notNull(), // First few characters for identification
	isActive: boolean("is_active").notNull().default(true),
	scopes: json("scopes").$type<string[]>().notNull().default([]), // API permissions
	rateLimit: json("rate_limit").$type<{
		requests: number;
		window: number; // in seconds
		burst?: number;
	}>(),
	allowedIps: json("allowed_ips").$type<string[]>(), // IP whitelist
	expiresAt: timestamp("expires_at"),
	lastUsedAt: timestamp("last_used_at"),
	usageCount: integer("usage_count").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
	// Unique constraint for API key name per user
	uniqueNamePerUser: unique("unique_api_key_name_per_user").on(table.userId, table.name),
	// Indexes for better query performance
	userIdx: index("idx_api_key_user").on(table.userId),
	keyHashIdx: index("idx_api_key_hash").on(table.keyHash),
	activeIdx: index("idx_api_key_active").on(table.isActive),
	expiresAtIdx: index("idx_api_key_expires_at").on(table.expiresAt),
}));

export const auditLog = pgTable("audit_log", {
	id: text("id").primaryKey(),
	action: text("action").notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
	resource: text("resource").notNull(), // WORKFLOW, CREDENTIAL, USER, etc.
	resourceId: text("resource_id"), // ID of the affected resource
	oldValues: json("old_values").$type<Record<string, any>>(), // Previous values (for updates)
	newValues: json("new_values").$type<Record<string, any>>(), // New values
	metadata: json("metadata").$type<{
		userAgent?: string;
		ipAddress?: string;
		requestId?: string;
		source?: string;
	}>(),
	timestamp: timestamp("timestamp").notNull().defaultNow(),
	userId: text("user_id")
		.references(() => user.id, { onDelete: "set null" }),
}, (table) => ({
	// Indexes for better query performance
	actionIdx: index("idx_audit_log_action").on(table.action),
	resourceIdx: index("idx_audit_log_resource").on(table.resource),
	resourceIdIdx: index("idx_audit_log_resource_id").on(table.resourceId),
	userIdx: index("idx_audit_log_user").on(table.userId),
	timestampIdx: index("idx_audit_log_timestamp").on(table.timestamp),
	userActionIdx: index("idx_audit_log_user_action").on(table.userId, table.action),
}));