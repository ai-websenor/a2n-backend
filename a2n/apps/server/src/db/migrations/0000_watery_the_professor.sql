CREATE TYPE "public"."account_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."credential_type" AS ENUM('OAUTH', 'API_KEY', 'BASIC_AUTH', 'TOKEN', 'CERTIFICATE', 'SSH_KEY');--> statement-breakpoint
CREATE TYPE "public"."execution_status" AS ENUM('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED', 'PAUSED');--> statement-breakpoint
CREATE TYPE "public"."health_status" AS ENUM('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."log_level" AS ENUM('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL');--> statement-breakpoint
CREATE TYPE "public"."node_execution_status" AS ENUM('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."node_type" AS ENUM('TRIGGER', 'ACTION', 'CONDITION', 'LOOP', 'DELAY', 'WEBHOOK', 'HTTP_REQUEST', 'EMAIL', 'DATABASE', 'FILE', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('EMAIL', 'WEBHOOK', 'SLACK', 'DISCORD', 'SMS');--> statement-breakpoint
CREATE TYPE "public"."project_role" AS ENUM('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."project_visibility" AS ENUM('PRIVATE', 'INTERNAL', 'PUBLIC');--> statement-breakpoint
CREATE TYPE "public"."trigger_type" AS ENUM('MANUAL', 'WEBHOOK', 'SCHEDULE', 'EVENT');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN', 'OWNER');--> statement-breakpoint
CREATE TYPE "public"."workflow_visibility" AS ENUM('PRIVATE', 'SHARED', 'PUBLIC', 'TEMPLATE');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_token" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text,
	CONSTRAINT "refresh_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_accessed_at" timestamp,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"password" text,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"status" "account_status" DEFAULT 'ACTIVE' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" text,
	"workflows_created" integer DEFAULT 0 NOT NULL,
	"workflows_executed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"type" text DEFAULT 'EMAIL_VERIFICATION' NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credential" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "credential_type" NOT NULL,
	"provider" text,
	"encrypted_data" text NOT NULL,
	"encryption_version" text DEFAULT 'v1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"metadata" json,
	"configuration" json,
	"validation_rules" json,
	"tags" json,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_validated_at" timestamp,
	"validation_status" text DEFAULT 'UNKNOWN',
	"user_id" text NOT NULL,
	CONSTRAINT "unique_credential_name_per_user" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "credential_share" (
	"id" text PRIMARY KEY NOT NULL,
	"permission" text DEFAULT 'READ' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"credential_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"shared_with_user_id" text NOT NULL,
	CONSTRAINT "unique_credential_share_per_user" UNIQUE("credential_id","shared_with_user_id")
);
--> statement-breakpoint
CREATE TABLE "credential_template" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "credential_type" NOT NULL,
	"provider" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"template" json NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"tags" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "unique_credential_template_name_provider" UNIQUE("name","provider")
);
--> statement-breakpoint
CREATE TABLE "credential_usage_log" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"status" text NOT NULL,
	"context" text,
	"ip_address" text,
	"user_agent" text,
	"error_message" text,
	"metadata" json,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"credential_id" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credential_validation" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"details" json,
	"validated_at" timestamp DEFAULT now() NOT NULL,
	"next_validation_at" timestamp,
	"validation_method" text DEFAULT 'AUTO' NOT NULL,
	"credential_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "execution_status" DEFAULT 'PENDING' NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"trigger_data" json,
	"input_data" json,
	"output_data" json,
	"error_message" text,
	"error_details" json,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"parent_execution_id" text,
	"context_data" json,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"workflow_id" text NOT NULL,
	"workflow_version" integer NOT NULL,
	"user_id" text NOT NULL,
	"trigger_id" text
);
--> statement-breakpoint
CREATE TABLE "execution_log" (
	"id" text PRIMARY KEY NOT NULL,
	"level" "log_level" DEFAULT 'INFO' NOT NULL,
	"message" text NOT NULL,
	"details" json,
	"node_id" text,
	"node_name" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"source" text DEFAULT 'SYSTEM' NOT NULL,
	"category" text,
	"correlation_id" text,
	"duration" integer,
	"metadata" json,
	"execution_id" text NOT NULL,
	"node_state_id" text
);
--> statement-breakpoint
CREATE TABLE "execution_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" text NOT NULL,
	"metric_type" text DEFAULT 'COUNTER' NOT NULL,
	"unit" text,
	"tags" json,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"node_id" text,
	"execution_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_node_state" (
	"id" text PRIMARY KEY NOT NULL,
	"node_id" text NOT NULL,
	"node_name" text NOT NULL,
	"node_type" text NOT NULL,
	"status" "node_execution_status" DEFAULT 'PENDING' NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"duration" integer,
	"input_data" json,
	"output_data" json,
	"error_message" text,
	"error_details" json,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"position" json,
	"configuration" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"execution_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"scheduled_time" timestamp NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_attempt_at" timestamp,
	"next_attempt_at" timestamp,
	"execution_data" json,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"workflow_id" text NOT NULL,
	"trigger_id" text NOT NULL,
	"user_id" text NOT NULL,
	"execution_id" text
);
--> statement-breakpoint
CREATE TABLE "workflow" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"definition" json NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"visibility" "workflow_visibility" DEFAULT 'PRIVATE' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"published_version" integer,
	"tags" json,
	"category" text,
	"variables" json,
	"settings" json,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_executed_at" timestamp,
	"avg_execution_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"archived_at" timestamp,
	"user_id" text NOT NULL,
	"project_id" text,
	CONSTRAINT "unique_workflow_name_per_user" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "workflow_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"node_id" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"workflow_id" text NOT NULL,
	"user_id" text NOT NULL,
	"parent_comment_id" text
);
--> statement-breakpoint
CREATE TABLE "workflow_share" (
	"id" text PRIMARY KEY NOT NULL,
	"permission" text DEFAULT 'VIEW' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"workflow_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"shared_with_user_id" text NOT NULL,
	CONSTRAINT "unique_share_per_user" UNIQUE("workflow_id","shared_with_user_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_trigger" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "trigger_type" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"configuration" json NOT NULL,
	"metadata" json,
	"trigger_count" integer DEFAULT 0 NOT NULL,
	"last_triggered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"workflow_id" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_version" (
	"id" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"definition" json NOT NULL,
	"change_log" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"workflow_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "unique_version_per_workflow" UNIQUE("workflow_id","version")
);
--> statement-breakpoint
CREATE TABLE "node_collection" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"tags" json,
	"node_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_collection_item" (
	"id" text PRIMARY KEY NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"collection_id" text NOT NULL,
	"node_definition_id" text NOT NULL,
	CONSTRAINT "unique_collection_node" UNIQUE("collection_id","node_definition_id")
);
--> statement-breakpoint
CREATE TABLE "node_definition" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"type" "node_type" NOT NULL,
	"category" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_built_in" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"icon" text,
	"color" text DEFAULT '#3B82F6' NOT NULL,
	"documentation" text,
	"input_schema" json NOT NULL,
	"output_schema" json NOT NULL,
	"settings_schema" json,
	"credentials" json,
	"rate_limit" json,
	"retry_policy" json,
	"timeout" integer DEFAULT 30000 NOT NULL,
	"execution_mode" text DEFAULT 'SYNC' NOT NULL,
	"implementation" json,
	"tags" json,
	"metadata" json,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"success_rate" integer DEFAULT 100 NOT NULL,
	"avg_execution_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"deprecated_at" timestamp,
	"created_by" text,
	CONSTRAINT "unique_node_name_version" UNIQUE("name","version")
);
--> statement-breakpoint
CREATE TABLE "node_rating" (
	"id" text PRIMARY KEY NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"node_definition_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "unique_rating_user_node" UNIQUE("user_id","node_definition_id")
);
--> statement-breakpoint
CREATE TABLE "node_template" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"configuration" json NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"tags" json,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"node_definition_id" text NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_usage_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"avg_execution_time" integer,
	"total_execution_time" integer,
	"unique_users" integer DEFAULT 0 NOT NULL,
	"unique_workflows" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"node_definition_id" text NOT NULL,
	CONSTRAINT "unique_stats_node_date" UNIQUE("node_definition_id","date")
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"prefix" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"scopes" json DEFAULT '[]'::json NOT NULL,
	"rate_limit" json,
	"allowed_ips" json,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "api_key_key_hash_unique" UNIQUE("key_hash"),
	CONSTRAINT "unique_api_key_name_per_user" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "app_setting" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" json NOT NULL,
	"data_type" text DEFAULT 'STRING' NOT NULL,
	"description" text,
	"category" text DEFAULT 'GENERAL' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_editable" boolean DEFAULT true NOT NULL,
	"validation_rule" json,
	"default_value" json,
	"environment" text DEFAULT 'ALL',
	"tags" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "app_setting_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"old_values" json,
	"new_values" json,
	"metadata" json,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "health_check" (
	"id" text PRIMARY KEY NOT NULL,
	"service_name" text NOT NULL,
	"service_type" text NOT NULL,
	"endpoint" text,
	"status" "health_status" DEFAULT 'UNKNOWN' NOT NULL,
	"response_time" integer,
	"message" text,
	"details" json,
	"check_interval" integer DEFAULT 60 NOT NULL,
	"timeout" integer DEFAULT 30 NOT NULL,
	"retry_count" integer DEFAULT 3 NOT NULL,
	"alert_threshold" integer DEFAULT 3 NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_check_at" timestamp,
	"next_check_at" timestamp,
	"last_healthy_at" timestamp,
	"last_unhealthy_at" timestamp,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"alerts_enabled" boolean DEFAULT true NOT NULL,
	"configuration" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schema_migration" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"filename" text NOT NULL,
	"checksum" text NOT NULL,
	"execution_time" integer,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"error_message" text,
	"rollback_script" text,
	"dependencies" json,
	"tags" json,
	"environment" text DEFAULT 'ALL',
	"applied_at" timestamp,
	"rolled_back_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"applied_by" text,
	CONSTRAINT "schema_migration_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "system_log" (
	"id" text PRIMARY KEY NOT NULL,
	"level" "log_level" DEFAULT 'INFO' NOT NULL,
	"message" text NOT NULL,
	"source" text NOT NULL,
	"category" text,
	"details" json,
	"correlation_id" text,
	"user_id" text,
	"ip_address" text,
	"user_agent" text,
	"request_id" text,
	"duration" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"priority" text DEFAULT 'NORMAL' NOT NULL,
	"category" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_global" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"action_url" text,
	"action_label" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp,
	"user_id" text,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3B82F6' NOT NULL,
	"icon" text DEFAULT 'folder',
	"visibility" "project_visibility" DEFAULT 'PRIVATE' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"settings" json,
	"metadata" json,
	"workflow_count" integer DEFAULT 0 NOT NULL,
	"member_count" integer DEFAULT 1 NOT NULL,
	"last_activity_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	"user_id" text NOT NULL,
	CONSTRAINT "unique_project_name_per_user" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "project_invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" "project_role" DEFAULT 'VIEWER' NOT NULL,
	"status" "invitation_status" DEFAULT 'PENDING' NOT NULL,
	"permissions" json,
	"invitation_token" text NOT NULL,
	"message" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"revoked_at" timestamp,
	"project_id" text NOT NULL,
	"invited_by" text NOT NULL,
	"accepted_by" text,
	CONSTRAINT "project_invitation_invitation_token_unique" UNIQUE("invitation_token"),
	CONSTRAINT "unique_invitation_email_project" UNIQUE("email","project_id")
);
--> statement-breakpoint
CREATE TABLE "project_member" (
	"id" text PRIMARY KEY NOT NULL,
	"role" "project_role" DEFAULT 'VIEWER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"permissions" json,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" timestamp,
	"invited_by" text,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "unique_user_project" UNIQUE("user_id","project_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential" ADD CONSTRAINT "credential_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_share" ADD CONSTRAINT "credential_share_credential_id_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."credential"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_share" ADD CONSTRAINT "credential_share_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_share" ADD CONSTRAINT "credential_share_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_template" ADD CONSTRAINT "credential_template_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_usage_log" ADD CONSTRAINT "credential_usage_log_credential_id_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."credential"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_usage_log" ADD CONSTRAINT "credential_usage_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_validation" ADD CONSTRAINT "credential_validation_credential_id_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."credential"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution" ADD CONSTRAINT "execution_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution" ADD CONSTRAINT "execution_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution" ADD CONSTRAINT "execution_trigger_id_workflow_trigger_id_fk" FOREIGN KEY ("trigger_id") REFERENCES "public"."workflow_trigger"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_log" ADD CONSTRAINT "execution_log_execution_id_execution_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."execution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_log" ADD CONSTRAINT "execution_log_node_state_id_execution_node_state_id_fk" FOREIGN KEY ("node_state_id") REFERENCES "public"."execution_node_state"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_metrics" ADD CONSTRAINT "execution_metrics_execution_id_execution_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."execution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_node_state" ADD CONSTRAINT "execution_node_state_execution_id_execution_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."execution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_schedule" ADD CONSTRAINT "execution_schedule_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_schedule" ADD CONSTRAINT "execution_schedule_trigger_id_workflow_trigger_id_fk" FOREIGN KEY ("trigger_id") REFERENCES "public"."workflow_trigger"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_schedule" ADD CONSTRAINT "execution_schedule_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_schedule" ADD CONSTRAINT "execution_schedule_execution_id_execution_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."execution"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow" ADD CONSTRAINT "workflow_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_comment" ADD CONSTRAINT "workflow_comment_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_comment" ADD CONSTRAINT "workflow_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_comment" ADD CONSTRAINT "workflow_comment_parent_comment_id_workflow_comment_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."workflow_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_share" ADD CONSTRAINT "workflow_share_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_share" ADD CONSTRAINT "workflow_share_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_share" ADD CONSTRAINT "workflow_share_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_trigger" ADD CONSTRAINT "workflow_trigger_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_trigger" ADD CONSTRAINT "workflow_trigger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_version" ADD CONSTRAINT "workflow_version_workflow_id_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_version" ADD CONSTRAINT "workflow_version_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_collection" ADD CONSTRAINT "node_collection_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_collection_item" ADD CONSTRAINT "node_collection_item_collection_id_node_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."node_collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_collection_item" ADD CONSTRAINT "node_collection_item_node_definition_id_node_definition_id_fk" FOREIGN KEY ("node_definition_id") REFERENCES "public"."node_definition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_definition" ADD CONSTRAINT "node_definition_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_rating" ADD CONSTRAINT "node_rating_node_definition_id_node_definition_id_fk" FOREIGN KEY ("node_definition_id") REFERENCES "public"."node_definition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_rating" ADD CONSTRAINT "node_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_template" ADD CONSTRAINT "node_template_node_definition_id_node_definition_id_fk" FOREIGN KEY ("node_definition_id") REFERENCES "public"."node_definition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_template" ADD CONSTRAINT "node_template_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_usage_stats" ADD CONSTRAINT "node_usage_stats_node_definition_id_node_definition_id_fk" FOREIGN KEY ("node_definition_id") REFERENCES "public"."node_definition"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_setting" ADD CONSTRAINT "app_setting_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schema_migration" ADD CONSTRAINT "schema_migration_applied_by_user_id_fk" FOREIGN KEY ("applied_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_log" ADD CONSTRAINT "system_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_notification" ADD CONSTRAINT "system_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_notification" ADD CONSTRAINT "system_notification_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invitation" ADD CONSTRAINT "project_invitation_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invitation" ADD CONSTRAINT "project_invitation_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invitation" ADD CONSTRAINT "project_invitation_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_credential_user" ON "credential" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_credential_type" ON "credential" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_credential_provider" ON "credential" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_credential_active" ON "credential" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_credential_shared" ON "credential" USING btree ("is_shared");--> statement-breakpoint
CREATE INDEX "idx_credential_expires" ON "credential" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_credential_status" ON "credential" USING btree ("validation_status");--> statement-breakpoint
CREATE INDEX "idx_credential_share_credential" ON "credential_share" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "idx_credential_share_owner" ON "credential_share" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_credential_share_shared_with" ON "credential_share" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE INDEX "idx_credential_share_active" ON "credential_share" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_credential_template_type" ON "credential_template" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_credential_template_provider" ON "credential_template" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_credential_template_public" ON "credential_template" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_credential_template_name" ON "credential_template" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_credential_template_created_by" ON "credential_template" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_credential_usage_credential" ON "credential_usage_log" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "idx_credential_usage_user" ON "credential_usage_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_credential_usage_timestamp" ON "credential_usage_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_credential_usage_action" ON "credential_usage_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_credential_usage_status" ON "credential_usage_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_credential_usage_credential_timestamp" ON "credential_usage_log" USING btree ("credential_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_credential_validation_credential" ON "credential_validation" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "idx_credential_validation_status" ON "credential_validation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_credential_validation_validated_at" ON "credential_validation" USING btree ("validated_at");--> statement-breakpoint
CREATE INDEX "idx_credential_validation_next" ON "credential_validation" USING btree ("next_validation_at");--> statement-breakpoint
CREATE INDEX "idx_execution_status" ON "execution" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_execution_workflow" ON "execution" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_execution_user" ON "execution" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_execution_start_time" ON "execution" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_execution_workflow_status" ON "execution" USING btree ("workflow_id","status");--> statement-breakpoint
CREATE INDEX "idx_log_execution" ON "execution_log" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "idx_log_timestamp" ON "execution_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_log_level" ON "execution_log" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_log_node" ON "execution_log" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "idx_log_execution_timestamp" ON "execution_log" USING btree ("execution_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_metrics_execution" ON "execution_metrics" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "idx_metrics_timestamp" ON "execution_metrics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_metrics_name" ON "execution_metrics" USING btree ("metric_name");--> statement-breakpoint
CREATE INDEX "idx_metrics_node" ON "execution_metrics" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "idx_node_state_execution" ON "execution_node_state" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "idx_node_state_status" ON "execution_node_state" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_node_state_node" ON "execution_node_state" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "idx_node_state_execution_node" ON "execution_node_state" USING btree ("execution_id","node_id");--> statement-breakpoint
CREATE INDEX "idx_schedule_time" ON "execution_schedule" USING btree ("scheduled_time");--> statement-breakpoint
CREATE INDEX "idx_schedule_status" ON "execution_schedule" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_schedule_workflow" ON "execution_schedule" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_schedule_next_attempt" ON "execution_schedule" USING btree ("next_attempt_at");--> statement-breakpoint
CREATE INDEX "idx_workflow_project" ON "workflow" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_user_project" ON "workflow" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "idx_collection_public" ON "node_collection" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_collection_created_by" ON "node_collection" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_collection_name" ON "node_collection" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_collection_item_collection" ON "node_collection_item" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "idx_collection_item_node_def" ON "node_collection_item" USING btree ("node_definition_id");--> statement-breakpoint
CREATE INDEX "idx_collection_item_order" ON "node_collection_item" USING btree ("order");--> statement-breakpoint
CREATE INDEX "idx_node_def_type" ON "node_definition" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_node_def_category" ON "node_definition" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_node_def_active" ON "node_definition" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_node_def_public" ON "node_definition" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_node_def_builtin" ON "node_definition" USING btree ("is_built_in");--> statement-breakpoint
CREATE INDEX "idx_node_def_name" ON "node_definition" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_rating_node_def" ON "node_rating" USING btree ("node_definition_id");--> statement-breakpoint
CREATE INDEX "idx_rating_user" ON "node_rating" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_rating_value" ON "node_rating" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_template_node_def" ON "node_template" USING btree ("node_definition_id");--> statement-breakpoint
CREATE INDEX "idx_template_public" ON "node_template" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_template_created_by" ON "node_template" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_stats_node_def" ON "node_usage_stats" USING btree ("node_definition_id");--> statement-breakpoint
CREATE INDEX "idx_stats_date" ON "node_usage_stats" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_stats_node_def_date" ON "node_usage_stats" USING btree ("node_definition_id","date");--> statement-breakpoint
CREATE INDEX "idx_api_key_user" ON "api_key" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_api_key_hash" ON "api_key" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "idx_api_key_active" ON "api_key" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_api_key_expires_at" ON "api_key" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_app_setting_key" ON "app_setting" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_app_setting_category" ON "app_setting" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_app_setting_public" ON "app_setting" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_app_setting_environment" ON "app_setting" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "idx_audit_log_action" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_log_resource" ON "audit_log" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "idx_audit_log_resource_id" ON "audit_log" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_user" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_timestamp" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_log_user_action" ON "audit_log" USING btree ("user_id","action");--> statement-breakpoint
CREATE INDEX "idx_health_check_service_name" ON "health_check" USING btree ("service_name");--> statement-breakpoint
CREATE INDEX "idx_health_check_status" ON "health_check" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_health_check_enabled" ON "health_check" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "idx_health_check_next_check" ON "health_check" USING btree ("next_check_at");--> statement-breakpoint
CREATE INDEX "idx_health_check_service_type" ON "health_check" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "idx_schema_migration_version" ON "schema_migration" USING btree ("version");--> statement-breakpoint
CREATE INDEX "idx_schema_migration_status" ON "schema_migration" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_schema_migration_applied_at" ON "schema_migration" USING btree ("applied_at");--> statement-breakpoint
CREATE INDEX "idx_schema_migration_environment" ON "schema_migration" USING btree ("environment");--> statement-breakpoint
CREATE INDEX "idx_system_log_level" ON "system_log" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_system_log_source" ON "system_log" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_system_log_timestamp" ON "system_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_system_log_user" ON "system_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_system_log_correlation" ON "system_log" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "idx_system_log_category" ON "system_log" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_system_notification_user" ON "system_notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_system_notification_type" ON "system_notification" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_system_notification_priority" ON "system_notification" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_system_notification_category" ON "system_notification" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_system_notification_read" ON "system_notification" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_system_notification_global" ON "system_notification" USING btree ("is_global");--> statement-breakpoint
CREATE INDEX "idx_system_notification_created_at" ON "system_notification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_system_notification_expires_at" ON "system_notification" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_project_user" ON "project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_project_visibility" ON "project" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_project_archived" ON "project" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "idx_project_activity" ON "project" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "idx_project_invitation_project" ON "project_invitation" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_invitation_email" ON "project_invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_project_invitation_status" ON "project_invitation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_project_invitation_token" ON "project_invitation" USING btree ("invitation_token");--> statement-breakpoint
CREATE INDEX "idx_project_invitation_expires" ON "project_invitation" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_project_member_project" ON "project_member" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_member_user" ON "project_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_project_member_role" ON "project_member" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_project_member_active" ON "project_member" USING btree ("is_active");