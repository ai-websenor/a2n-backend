import { pgEnum } from "drizzle-orm/pg-core";

// Execution status for workflow runs
export const executionStatusEnum = pgEnum("execution_status", [
	"PENDING",
	"RUNNING", 
	"SUCCESS",
	"FAILED",
	"CANCELLED",
	"PAUSED"
]);

// Node execution status for individual workflow nodes
export const nodeExecutionStatusEnum = pgEnum("node_execution_status", [
	"PENDING",
	"RUNNING",
	"SUCCESS", 
	"FAILED",
	"SKIPPED",
	"CANCELLED"
]);

// Trigger types for workflow execution
export const triggerTypeEnum = pgEnum("trigger_type", [
	"MANUAL",
	"WEBHOOK", 
	"SCHEDULE",
	"EVENT"
]);

// Log levels for system and execution logging
export const logLevelEnum = pgEnum("log_level", [
	"DEBUG",
	"INFO",
	"WARN",
	"ERROR",
	"FATAL"
]);

// Health status for system monitoring
export const healthStatusEnum = pgEnum("health_status", [
	"HEALTHY",
	"DEGRADED",
	"UNHEALTHY",
	"UNKNOWN"
]);

// Credential types for secure storage
export const credentialTypeEnum = pgEnum("credential_type", [
	"OAUTH",
	"API_KEY", 
	"BASIC_AUTH",
	"TOKEN",
	"CERTIFICATE",
	"SSH_KEY"
]);

// Node types for workflow nodes
export const nodeTypeEnum = pgEnum("node_type", [
	"TRIGGER",
	"ACTION",
	"CONDITION",
	"LOOP",
	"DELAY",
	"WEBHOOK",
	"HTTP_REQUEST",
	"EMAIL",
	"DATABASE",
	"FILE",
	"CUSTOM"
]);

// Workflow visibility/access levels
export const workflowVisibilityEnum = pgEnum("workflow_visibility", [
	"PRIVATE",
	"SHARED",
	"PUBLIC",
	"TEMPLATE"
]);

// User roles for access control
export const userRoleEnum = pgEnum("user_role", [
	"USER",
	"ADMIN",
	"OWNER"
]);

// Account statuses
export const accountStatusEnum = pgEnum("account_status", [
	"ACTIVE",
	"INACTIVE",
	"SUSPENDED",
	"DELETED"
]);

// Notification types
export const notificationTypeEnum = pgEnum("notification_type", [
	"EMAIL",
	"WEBHOOK",
	"SLACK",
	"DISCORD",
	"SMS"
]);

// Project visibility levels
export const projectVisibilityEnum = pgEnum("project_visibility", [
	"PRIVATE",    // Only project members can access
	"INTERNAL",   // All organization users can view
	"PUBLIC"      // Anyone with link can view
]);

// Project member roles
export const projectRoleEnum = pgEnum("project_role", [
	"OWNER",      // Full project control
	"ADMIN",      // Manage project and members
	"EDITOR",     // Create and edit workflows
	"VIEWER"      // Read-only access
]);

// Invitation status
export const invitationStatusEnum = pgEnum("invitation_status", [
	"PENDING",    // Invitation sent, not yet accepted
	"ACCEPTED",   // Invitation accepted
	"EXPIRED",    // Invitation expired
	"REVOKED"     // Invitation revoked by sender
]);

// Export TypeScript types from the enums for type safety
export type ExecutionStatus = typeof executionStatusEnum.enumValues[number];
export type NodeExecutionStatus = typeof nodeExecutionStatusEnum.enumValues[number];
export type TriggerType = typeof triggerTypeEnum.enumValues[number];
export type LogLevel = typeof logLevelEnum.enumValues[number];
export type HealthStatus = typeof healthStatusEnum.enumValues[number];
export type CredentialType = typeof credentialTypeEnum.enumValues[number];
export type NodeType = typeof nodeTypeEnum.enumValues[number];
export type WorkflowVisibility = typeof workflowVisibilityEnum.enumValues[number];
export type UserRole = typeof userRoleEnum.enumValues[number];
export type AccountStatus = typeof accountStatusEnum.enumValues[number];
export type NotificationType = typeof notificationTypeEnum.enumValues[number];
export type ProjectVisibility = typeof projectVisibilityEnum.enumValues[number];
export type ProjectRole = typeof projectRoleEnum.enumValues[number];
export type InvitationStatus = typeof invitationStatusEnum.enumValues[number];