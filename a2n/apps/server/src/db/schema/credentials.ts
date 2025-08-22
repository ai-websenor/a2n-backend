import { pgTable, text, timestamp, boolean, integer, json, unique, index } from "drizzle-orm/pg-core";
import { credentialTypeEnum } from "./types";
import { user } from "./auth";

export const credential = pgTable("credential", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	type: credentialTypeEnum("type").notNull(),
	provider: text("provider"), // e.g., "google", "slack", "github", "custom"
	encryptedData: text("encrypted_data").notNull(), // AES-256 encrypted credential data
	encryptionVersion: text("encryption_version").notNull().default("v1"), // For key rotation
	isActive: boolean("is_active").notNull().default(true),
	isShared: boolean("is_shared").notNull().default(false), // Whether credential can be shared
	expiresAt: timestamp("expires_at"), // For tokens with expiration
	lastUsedAt: timestamp("last_used_at"),
	usageCount: integer("usage_count").notNull().default(0),
	metadata: json("metadata").$type<{
		scopes?: string[]; // OAuth scopes
		audience?: string; // JWT audience
		issuer?: string; // JWT issuer
		tokenUrl?: string; // OAuth token URL
		authUrl?: string; // OAuth authorization URL
		refreshable?: boolean; // Whether token can be refreshed
		environment?: string; // production, staging, development
		region?: string; // AWS region, etc.
	}>(),
	configuration: json("configuration").$type<{
		// OAuth specific
		clientId?: string;
		clientSecret?: string; // This would be encrypted in encryptedData
		redirectUri?: string;
		// API Key specific
		keyName?: string; // Header name or query parameter name
		keyLocation?: "header" | "query" | "body";
		// Basic Auth specific
		username?: string;
		password?: string; // This would be encrypted in encryptedData
		// Certificate specific
		certType?: "PEM" | "PKCS12" | "JKS";
		// Custom fields
		[key: string]: any;
	}>(),
	validationRules: json("validation_rules").$type<{
		testEndpoint?: string; // URL to test credential validity
		testMethod?: "GET" | "POST" | "PUT" | "DELETE";
		testHeaders?: Record<string, string>;
		testBody?: Record<string, any>;
		expectedStatus?: number[];
		expectedResponse?: Record<string, any>;
	}>(), // Rules for validating credential
	tags: json("tags").$type<string[]>(), // Tags for organization
	notes: text("notes"), // User notes about the credential
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	lastValidatedAt: timestamp("last_validated_at"),
	validationStatus: text("validation_status").default("UNKNOWN"), // VALID, INVALID, EXPIRED, UNKNOWN
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
	// Unique constraint for credential name per user
	uniqueNamePerUser: unique("unique_credential_name_per_user").on(table.userId, table.name),
	// Indexes for better query performance
	userIdx: index("idx_credential_user").on(table.userId),
	typeIdx: index("idx_credential_type").on(table.type),
	providerIdx: index("idx_credential_provider").on(table.provider),
	activeIdx: index("idx_credential_active").on(table.isActive),
	sharedIdx: index("idx_credential_shared").on(table.isShared),
	expiresIdx: index("idx_credential_expires").on(table.expiresAt),
	validationStatusIdx: index("idx_credential_status").on(table.validationStatus),
}));

export const credentialShare = pgTable("credential_share", {
	id: text("id").primaryKey(),
	permission: text("permission").notNull().default("READ"), // READ, USE, ADMIN
	isActive: boolean("is_active").notNull().default(true),
	expiresAt: timestamp("expires_at"),
	usageLimit: integer("usage_limit"), // Max number of times shared credential can be used
	usageCount: integer("usage_count").notNull().default(0),
	notes: text("notes"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	credentialId: text("credential_id")
		.notNull()
		.references(() => credential.id, { onDelete: "cascade" }),
	ownerId: text("owner_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	sharedWithUserId: text("shared_with_user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
	// Unique constraint for sharing credential with specific user
	uniqueSharePerUser: unique("unique_credential_share_per_user").on(table.credentialId, table.sharedWithUserId),
	// Indexes for better query performance
	credentialIdx: index("idx_credential_share_credential").on(table.credentialId),
	ownerIdx: index("idx_credential_share_owner").on(table.ownerId),
	sharedWithIdx: index("idx_credential_share_shared_with").on(table.sharedWithUserId),
	activeIdx: index("idx_credential_share_active").on(table.isActive),
}));

export const credentialUsageLog = pgTable("credential_usage_log", {
	id: text("id").primaryKey(),
	action: text("action").notNull(), // CREATED, USED, VALIDATED, UPDATED, DELETED, SHARED
	status: text("status").notNull(), // SUCCESS, FAILURE, ERROR
	context: text("context"), // Where credential was used (workflow ID, node ID, etc.)
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	errorMessage: text("error_message"),
	metadata: json("metadata").$type<Record<string, any>>(),
	timestamp: timestamp("timestamp").notNull().defaultNow(),
	credentialId: text("credential_id")
		.notNull()
		.references(() => credential.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
	// Indexes for better query performance
	credentialIdx: index("idx_credential_usage_credential").on(table.credentialId),
	userIdx: index("idx_credential_usage_user").on(table.userId),
	timestampIdx: index("idx_credential_usage_timestamp").on(table.timestamp),
	actionIdx: index("idx_credential_usage_action").on(table.action),
	statusIdx: index("idx_credential_usage_status").on(table.status),
	credentialTimestampIdx: index("idx_credential_usage_credential_timestamp").on(table.credentialId, table.timestamp),
}));

export const credentialTemplate = pgTable("credential_template", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	type: credentialTypeEnum("type").notNull(),
	provider: text("provider").notNull(),
	isPublic: boolean("is_public").notNull().default(false),
	template: json("template").notNull().$type<{
		fields: Array<{
			name: string;
			label: string;
			type: "text" | "password" | "email" | "url" | "textarea" | "select";
			required: boolean;
			description?: string;
			placeholder?: string;
			options?: string[]; // For select type
			validation?: {
				pattern?: string;
				minLength?: number;
				maxLength?: number;
			};
		}>;
		instructions?: string;
		documentation?: string;
		testEndpoint?: {
			url: string;
			method: string;
			headers?: Record<string, string>;
		};
	}>(), // Template for creating credentials of this type
	usageCount: integer("usage_count").notNull().default(0),
	rating: integer("rating").notNull().default(0), // Average rating out of 5
	ratingCount: integer("rating_count").notNull().default(0),
	tags: json("tags").$type<string[]>(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	createdBy: text("created_by")
		.references(() => user.id, { onDelete: "set null" }),
}, (table) => ({
	// Unique constraint for template name and provider
	uniqueNameProvider: unique("unique_credential_template_name_provider").on(table.name, table.provider),
	// Indexes for better query performance
	typeIdx: index("idx_credential_template_type").on(table.type),
	providerIdx: index("idx_credential_template_provider").on(table.provider),
	publicIdx: index("idx_credential_template_public").on(table.isPublic),
	nameIdx: index("idx_credential_template_name").on(table.name),
	createdByIdx: index("idx_credential_template_created_by").on(table.createdBy),
}));

export const credentialValidation = pgTable("credential_validation", {
	id: text("id").primaryKey(),
	status: text("status").notNull(), // VALID, INVALID, EXPIRED, ERROR
	message: text("message"),
	details: json("details").$type<{
		httpStatus?: number;
		responseTime?: number;
		errorCode?: string;
		errorDetails?: Record<string, any>;
	}>(),
	validatedAt: timestamp("validated_at").notNull().defaultNow(),
	nextValidationAt: timestamp("next_validation_at"),
	validationMethod: text("validation_method").notNull().default("AUTO"), // AUTO, MANUAL
	credentialId: text("credential_id")
		.notNull()
		.references(() => credential.id, { onDelete: "cascade" }),
}, (table) => ({
	// Indexes for better query performance
	credentialIdx: index("idx_credential_validation_credential").on(table.credentialId),
	statusIdx: index("idx_credential_validation_status").on(table.status),
	validatedAtIdx: index("idx_credential_validation_validated_at").on(table.validatedAt),
	nextValidationIdx: index("idx_credential_validation_next").on(table.nextValidationAt),
}));