-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateEnum
CREATE TYPE "public"."InviteStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- CreateEnum
CREATE TYPE "public"."WorkflowExecutionStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "public"."NodeExecutionStatus" AS ENUM ('pending', 'running', 'succeeded', 'failed', 'skipped', 'canceled', 'retrying');

-- CreateEnum
CREATE TYPE "public"."WorkspaceRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" VARCHAR(255),
    "roleId" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "phone" VARCHAR(20),
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified_at" TIMESTAMP(3),
    "reset_token" VARCHAR(255),
    "reset_token_expires" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "auth"."sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "expiresAt" TIMESTAMP(3),
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."api_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100),
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."account_onboarding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "company_name" VARCHAR(255),
    "company_email" VARCHAR(255),
    "company_email_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "account_name" VARCHAR(100),
    "wildcard_domain" VARCHAR(255),
    "company_size" VARCHAR(50),
    "role_in_company" VARCHAR(100),
    "company_description" TEXT,
    "comfort_level" TEXT,
    "referral_source" TEXT,
    "planned_apps" TEXT[],
    "current_step" VARCHAR(50) NOT NULL DEFAULT 'registration',
    "completed_steps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account_invites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "onboardingId" UUID,
    "invitee_email" VARCHAR(255) NOT NULL,
    "status" "public"."InviteStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."execution_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workflowExecutionId" UUID,
    "nodeExecutionId" UUID,
    "log_level" VARCHAR NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."node_connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workflowId" UUID,
    "sourceNodeId" UUID,
    "targetNodeId" UUID,
    "source_output" VARCHAR NOT NULL DEFAULT 'main',
    "target_input" VARCHAR NOT NULL DEFAULT 'main',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "node_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."node_executions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workflowExecutionId" UUID,
    "workflowNodeId" UUID,
    "status" "public"."NodeExecutionStatus" NOT NULL DEFAULT 'pending',
    "input_data" JSONB NOT NULL DEFAULT '{}',
    "output_data" JSONB NOT NULL DEFAULT '{}',
    "error_data" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "execution_time" INTEGER,
    "retry_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "node_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."node_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "category" VARCHAR NOT NULL,
    "display_name" VARCHAR NOT NULL,
    "description" TEXT,
    "icon" VARCHAR,
    "input_schema" JSONB NOT NULL DEFAULT '{}',
    "output_schema" JSONB NOT NULL DEFAULT '{}',
    "config_schema" JSONB NOT NULL DEFAULT '{}',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "node_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_secrets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "secret_key" VARCHAR NOT NULL,
    "secret_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_executions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workflowId" UUID,
    "trigger_data" JSONB NOT NULL DEFAULT '{}',
    "status" "public"."WorkflowExecutionStatus" NOT NULL DEFAULT 'running',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "error_message" TEXT,
    "execution_time" INTEGER,
    "created_by" UUID,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflow_nodes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workflowId" UUID,
    "nodeTypeId" UUID,
    "name" VARCHAR NOT NULL,
    "position_x" INTEGER NOT NULL,
    "position_y" INTEGER NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "input_config" JSONB NOT NULL DEFAULT '{}',
    "output_config" JSONB NOT NULL DEFAULT '{}',
    "is_disabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workflows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "userId" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspace_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspaceId" UUID,
    "userId" UUID,
    "role" "public"."WorkspaceRole" NOT NULL DEFAULT 'member',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workspaces" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "ownerId" UUID,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "auth"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "auth"."users"("phone");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "auth"."users"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "auth"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "auth"."permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "auth"."sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "auth"."sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "auth"."sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "sessions_last_activity_idx" ON "auth"."sessions"("last_activity");

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_token_key" ON "auth"."api_tokens"("token");

-- CreateIndex
CREATE INDEX "api_tokens_userId_idx" ON "auth"."api_tokens"("userId");

-- CreateIndex
CREATE INDEX "api_tokens_expiresAt_idx" ON "auth"."api_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "api_tokens_last_used_at_idx" ON "auth"."api_tokens"("last_used_at");

-- CreateIndex
CREATE UNIQUE INDEX "account_onboarding_userId_key" ON "auth"."account_onboarding"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_onboarding_account_name_key" ON "auth"."account_onboarding"("account_name");

-- CreateIndex
CREATE INDEX "account_invites_onboardingId_idx" ON "public"."account_invites"("onboardingId");

-- CreateIndex
CREATE INDEX "account_invites_invitee_email_idx" ON "public"."account_invites"("invitee_email");

-- CreateIndex
CREATE INDEX "account_invites_status_idx" ON "public"."account_invites"("status");

-- CreateIndex
CREATE INDEX "execution_logs_workflowExecutionId_idx" ON "public"."execution_logs"("workflowExecutionId");

-- CreateIndex
CREATE INDEX "execution_logs_nodeExecutionId_idx" ON "public"."execution_logs"("nodeExecutionId");

-- CreateIndex
CREATE INDEX "execution_logs_timestamp_idx" ON "public"."execution_logs"("timestamp");

-- CreateIndex
CREATE INDEX "node_connections_workflowId_idx" ON "public"."node_connections"("workflowId");

-- CreateIndex
CREATE INDEX "node_connections_sourceNodeId_idx" ON "public"."node_connections"("sourceNodeId");

-- CreateIndex
CREATE INDEX "node_connections_targetNodeId_idx" ON "public"."node_connections"("targetNodeId");

-- CreateIndex
CREATE INDEX "node_executions_workflowExecutionId_idx" ON "public"."node_executions"("workflowExecutionId");

-- CreateIndex
CREATE INDEX "node_executions_workflowNodeId_idx" ON "public"."node_executions"("workflowNodeId");

-- CreateIndex
CREATE INDEX "node_executions_status_idx" ON "public"."node_executions"("status");

-- CreateIndex
CREATE INDEX "node_executions_started_at_idx" ON "public"."node_executions"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "node_types_name_key" ON "public"."node_types"("name");

-- CreateIndex
CREATE INDEX "node_types_category_idx" ON "public"."node_types"("category");

-- CreateIndex
CREATE INDEX "node_types_is_active_idx" ON "public"."node_types"("is_active");

-- CreateIndex
CREATE INDEX "user_secrets_userId_idx" ON "public"."user_secrets"("userId");

-- CreateIndex
CREATE INDEX "workflow_executions_workflowId_idx" ON "public"."workflow_executions"("workflowId");

-- CreateIndex
CREATE INDEX "workflow_executions_status_idx" ON "public"."workflow_executions"("status");

-- CreateIndex
CREATE INDEX "workflow_executions_created_by_idx" ON "public"."workflow_executions"("created_by");

-- CreateIndex
CREATE INDEX "workflow_nodes_workflowId_idx" ON "public"."workflow_nodes"("workflowId");

-- CreateIndex
CREATE INDEX "workflow_nodes_nodeTypeId_idx" ON "public"."workflow_nodes"("nodeTypeId");

-- CreateIndex
CREATE INDEX "workflow_nodes_is_disabled_idx" ON "public"."workflow_nodes"("is_disabled");

-- CreateIndex
CREATE INDEX "workflows_is_active_idx" ON "public"."workflows"("is_active");

-- CreateIndex
CREATE INDEX "workflows_updated_at_idx" ON "public"."workflows"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "workflows_user_name_unique" ON "public"."workflows"("userId", "name");

-- CreateIndex
CREATE INDEX "workspace_members_workspaceId_idx" ON "public"."workspace_members"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_members_userId_idx" ON "public"."workspace_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_unique" ON "public"."workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "workspaces_ownerId_idx" ON "public"."workspaces"("ownerId");

-- AddForeignKey
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth"."roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "auth"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."api_tokens" ADD CONSTRAINT "api_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."account_onboarding" ADD CONSTRAINT "account_onboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account_invites" ADD CONSTRAINT "account_invites_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "auth"."account_onboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."execution_logs" ADD CONSTRAINT "execution_logs_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "public"."workflow_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."execution_logs" ADD CONSTRAINT "execution_logs_nodeExecutionId_fkey" FOREIGN KEY ("nodeExecutionId") REFERENCES "public"."node_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_connections" ADD CONSTRAINT "node_connections_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_connections" ADD CONSTRAINT "node_connections_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "public"."workflow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_connections" ADD CONSTRAINT "node_connections_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "public"."workflow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_executions" ADD CONSTRAINT "node_executions_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "public"."workflow_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."node_executions" ADD CONSTRAINT "node_executions_workflowNodeId_fkey" FOREIGN KEY ("workflowNodeId") REFERENCES "public"."workflow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_secrets" ADD CONSTRAINT "user_secrets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_executions" ADD CONSTRAINT "workflow_executions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_executions" ADD CONSTRAINT "workflow_executions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_nodes" ADD CONSTRAINT "workflow_nodes_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."workflows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflow_nodes" ADD CONSTRAINT "workflow_nodes_nodeTypeId_fkey" FOREIGN KEY ("nodeTypeId") REFERENCES "public"."node_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workflows" ADD CONSTRAINT "workflows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workspaces" ADD CONSTRAINT "workspaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
