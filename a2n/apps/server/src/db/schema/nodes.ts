import { pgTable, text, timestamp, boolean, integer, json, unique, index } from "drizzle-orm/pg-core";
import { nodeTypeEnum } from "./types";
import { user } from "./auth";

export const nodeDefinition = pgTable("node_definition", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	displayName: text("display_name").notNull(),
	description: text("description"),
	type: nodeTypeEnum("type").notNull(),
	category: text("category").notNull(), // HTTP, DATABASE, EMAIL, FILE, etc.
	version: text("version").notNull().default("1.0.0"),
	isActive: boolean("is_active").notNull().default(true),
	isBuiltIn: boolean("is_built_in").notNull().default(false),
	isPublic: boolean("is_public").notNull().default(false),
	icon: text("icon"), // Icon identifier or URL
	color: text("color").notNull().default("#3B82F6"), // Hex color for UI
	documentation: text("documentation"), // Markdown documentation
	inputSchema: json("input_schema").notNull().$type<{
		type: "object";
		properties: Record<string, {
			type: string;
			description?: string;
			required?: boolean;
			default?: any;
			enum?: any[];
			format?: string;
			minimum?: number;
			maximum?: number;
			pattern?: string;
		}>;
		required?: string[];
		additionalProperties?: boolean;
	}>(), // JSON Schema for input validation
	outputSchema: json("output_schema").notNull().$type<{
		type: "object";
		properties: Record<string, {
			type: string;
			description?: string;
		}>;
		additionalProperties?: boolean;
	}>(), // JSON Schema for output specification
	settingsSchema: json("settings_schema").$type<{
		type: "object";
		properties: Record<string, {
			type: string;
			description?: string;
			required?: boolean;
			default?: any;
			enum?: any[];
			format?: string;
		}>;
		required?: string[];
		additionalProperties?: boolean;
	}>(), // JSON Schema for node settings
	credentials: json("credentials").$type<{
		required?: boolean;
		types?: string[]; // Supported credential types
		description?: string;
	}>(), // Credential requirements
	rateLimit: json("rate_limit").$type<{
		requests: number;
		window: number; // in seconds
		burst?: number;
	}>(), // Rate limiting configuration
	retryPolicy: json("retry_policy").$type<{
		enabled: boolean;
		maxRetries: number;
		backoffType: "FIXED" | "EXPONENTIAL" | "LINEAR";
		initialDelay: number;
		maxDelay?: number;
		multiplier?: number;
	}>(), // Default retry policy
	timeout: integer("timeout").notNull().default(30000), // Default timeout in milliseconds
	executionMode: text("execution_mode").notNull().default("SYNC"), // SYNC, ASYNC, STREAM
	implementation: json("implementation").$type<{
		runtime: "NODE" | "PYTHON" | "DOCKER" | "WEBHOOK";
		code?: string; // For custom nodes
		dockerfile?: string; // For Docker nodes
		webhookUrl?: string; // For webhook nodes
		environment?: Record<string, string>; // Environment variables
		dependencies?: string[]; // Package dependencies
	}>(), // Implementation details
	tags: json("tags").$type<string[]>(), // Tags for categorization
	metadata: json("metadata").$type<{
		author?: string;
		homepage?: string;
		repository?: string;
		license?: string;
		keywords?: string[];
	}>(), // Additional metadata
	usageCount: integer("usage_count").notNull().default(0),
	successRate: integer("success_rate").notNull().default(100), // Percentage
	avgExecutionTime: integer("avg_execution_time"), // in milliseconds
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	publishedAt: timestamp("published_at"),
	deprecatedAt: timestamp("deprecated_at"),
	createdBy: text("created_by")
		.references(() => user.id, { onDelete: "set null" }),
}, (table) => ({
	// Unique constraint for node name and version
	uniqueNameVersion: unique("unique_node_name_version").on(table.name, table.version),
	// Indexes for better query performance
	typeIdx: index("idx_node_def_type").on(table.type),
	categoryIdx: index("idx_node_def_category").on(table.category),
	activeIdx: index("idx_node_def_active").on(table.isActive),
	publicIdx: index("idx_node_def_public").on(table.isPublic),
	builtInIdx: index("idx_node_def_builtin").on(table.isBuiltIn),
	nameIdx: index("idx_node_def_name").on(table.name),
}));

export const nodeTemplate = pgTable("node_template", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	configuration: json("configuration").notNull().$type<Record<string, any>>(), // Pre-configured node settings
	isPublic: boolean("is_public").notNull().default(false),
	tags: json("tags").$type<string[]>(),
	usageCount: integer("usage_count").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	nodeDefinitionId: text("node_definition_id")
		.notNull()
		.references(() => nodeDefinition.id, { onDelete: "cascade" }),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
	// Indexes for better query performance
	nodeDefIdx: index("idx_template_node_def").on(table.nodeDefinitionId),
	publicIdx: index("idx_template_public").on(table.isPublic),
	createdByIdx: index("idx_template_created_by").on(table.createdBy),
}));

export const nodeRating = pgTable("node_rating", {
	id: text("id").primaryKey(),
	rating: integer("rating").notNull(), // 1-5 stars
	comment: text("comment"),
	isPublic: boolean("is_public").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	nodeDefinitionId: text("node_definition_id")
		.notNull()
		.references(() => nodeDefinition.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
	// Unique constraint - one rating per user per node
	uniqueUserNode: unique("unique_rating_user_node").on(table.userId, table.nodeDefinitionId),
	// Indexes for better query performance
	nodeDefIdx: index("idx_rating_node_def").on(table.nodeDefinitionId),
	userIdx: index("idx_rating_user").on(table.userId),
	ratingIdx: index("idx_rating_value").on(table.rating),
}));

export const nodeUsageStats = pgTable("node_usage_stats", {
	id: text("id").primaryKey(),
	date: timestamp("date").notNull(), // Date of the stats (daily aggregation)
	executionCount: integer("execution_count").notNull().default(0),
	successCount: integer("success_count").notNull().default(0),
	failureCount: integer("failure_count").notNull().default(0),
	avgExecutionTime: integer("avg_execution_time"), // in milliseconds
	totalExecutionTime: integer("total_execution_time"), // in milliseconds
	uniqueUsers: integer("unique_users").notNull().default(0),
	uniqueWorkflows: integer("unique_workflows").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	nodeDefinitionId: text("node_definition_id")
		.notNull()
		.references(() => nodeDefinition.id, { onDelete: "cascade" }),
}, (table) => ({
	// Unique constraint for daily stats per node
	uniqueNodeDate: unique("unique_stats_node_date").on(table.nodeDefinitionId, table.date),
	// Indexes for better query performance
	nodeDefIdx: index("idx_stats_node_def").on(table.nodeDefinitionId),
	dateIdx: index("idx_stats_date").on(table.date),
	nodeDefDateIdx: index("idx_stats_node_def_date").on(table.nodeDefinitionId, table.date),
}));

export const nodeCollection = pgTable("node_collection", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	isPublic: boolean("is_public").notNull().default(false),
	tags: json("tags").$type<string[]>(),
	nodeCount: integer("node_count").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	createdBy: text("created_by")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
	// Indexes for better query performance
	publicIdx: index("idx_collection_public").on(table.isPublic),
	createdByIdx: index("idx_collection_created_by").on(table.createdBy),
	nameIdx: index("idx_collection_name").on(table.name),
}));

export const nodeCollectionItem = pgTable("node_collection_item", {
	id: text("id").primaryKey(),
	order: integer("order").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	collectionId: text("collection_id")
		.notNull()
		.references(() => nodeCollection.id, { onDelete: "cascade" }),
	nodeDefinitionId: text("node_definition_id")
		.notNull()
		.references(() => nodeDefinition.id, { onDelete: "cascade" }),
}, (table) => ({
	// Unique constraint - one node per collection
	uniqueCollectionNode: unique("unique_collection_node").on(table.collectionId, table.nodeDefinitionId),
	// Indexes for better query performance
	collectionIdx: index("idx_collection_item_collection").on(table.collectionId),
	nodeDefIdx: index("idx_collection_item_node_def").on(table.nodeDefinitionId),
	orderIdx: index("idx_collection_item_order").on(table.order),
}));