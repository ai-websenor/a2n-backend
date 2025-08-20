# A2N Backend Database Schema

## Overview

This document defines the complete database schema for the A2N workflow automation platform. The schema is designed to support visual workflow creation, execution tracking, node management, credential storage, and user authentication using NestJS with Prisma ORM and PostgreSQL (NeonDB).

## Technology Stack

- **Database**: PostgreSQL (NeonDB Serverless)
- **ORM**: Prisma ORM
- **Framework**: NestJS with TypeScript
- **Authentication**: JWT with refresh tokens

## Database Design Principles

1. **Security First**: All sensitive data is encrypted at rest
2. **Scalability**: Designed for horizontal scaling with proper indexing
3. **Data Integrity**: Foreign key constraints and cascading deletes
4. **Audit Trail**: Comprehensive logging and execution tracking
5. **Performance**: Optimized queries with proper indexes

## Core Schema

### User Management

#### Users Table
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String   // bcrypt hashed
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  refreshTokens RefreshToken[]
  workflows     Workflow[]
  credentials   Credential[]
  executions    Execution[]

  @@map("users")
  @@index([email])
  @@index([isActive])
}
```

**Purpose**: Stores user account information with secure password hashing.

**Security Features**:
- Email uniqueness constraint
- bcrypt password hashing
- Soft delete via `isActive` flag
- Created/updated timestamps for audit

#### Refresh Tokens Table
```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  isRevoked Boolean  @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
  @@index([token])
  @@index([userId])
  @@index([expiresAt])
}
```

**Purpose**: Manages JWT refresh tokens for secure authentication.

### Workflow Management

#### Workflows Table
```prisma
model Workflow {
  id          String   @id @default(cuid())
  name        String
  description String?
  definition  Json     // Complete workflow graph as JSON
  isActive    Boolean  @default(false)
  isTemplate  Boolean  @default(false)
  version     Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userId     String
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  executions Execution[]
  triggers   WorkflowTrigger[]

  @@map("workflows")
  @@index([userId])
  @@index([isActive])
  @@index([isTemplate])
}
```

**Purpose**: Stores workflow definitions with complete node graph structure.

**Key Features**:
- JSON storage for flexible workflow definition
- Version control support
- Template system support
- User ownership with cascade delete

#### Workflow Definition JSON Structure
```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "http_request",
      "position": { "x": 100, "y": 100 },
      "config": {
        "url": "https://api.example.com",
        "method": "GET",
        "headers": {}
      },
      "inputs": {},
      "outputs": {}
    }
  ],
  "connections": [
    {
      "source": "node_1",
      "target": "node_2",
      "sourceHandle": "output",
      "targetHandle": "input"
    }
  ],
  "variables": {
    "global": {},
    "workflow": {}
  }
}
```

#### Workflow Triggers Table
```prisma
model WorkflowTrigger {
  id         String      @id @default(cuid())
  type       TriggerType
  config     Json        // Trigger-specific configuration
  isActive   Boolean     @default(true)
  createdAt  DateTime    @default(now())

  workflowId String
  workflow   Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  @@map("workflow_triggers")
  @@index([workflowId])
  @@index([type])
}

enum TriggerType {
  MANUAL
  WEBHOOK
  SCHEDULE
  EVENT
}
```

**Purpose**: Defines how workflows can be triggered.

### Execution Tracking

#### Executions Table
```prisma
model Execution {
  id        String          @id @default(cuid())
  status    ExecutionStatus @default(PENDING)
  startTime DateTime        @default(now())
  endTime   DateTime?
  duration  Int?            // Execution duration in milliseconds
  data      Json?           // Execution context and results
  error     String?         // Error message if failed
  
  workflowId String
  workflow   Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  logs       ExecutionLog[]
  nodeStates ExecutionNodeState[]

  @@map("executions")
  @@index([workflowId])
  @@index([userId])
  @@index([status])
  @@index([startTime])
}

enum ExecutionStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  CANCELLED
  PAUSED
}
```

**Purpose**: Tracks workflow execution instances with comprehensive metadata.

#### Execution Logs Table
```prisma
model ExecutionLog {
  id          String   @id @default(cuid())
  nodeId      String?  // Null for workflow-level logs
  level       LogLevel
  message     String
  metadata    Json?    // Additional log context
  timestamp   DateTime @default(now())

  executionId String
  execution   Execution @relation(fields: [executionId], references: [id], onDelete: Cascade)

  @@map("execution_logs")
  @@index([executionId])
  @@index([level])
  @@index([timestamp])
}

enum LogLevel {
  DEBUG
  INFO
  WARN
  ERROR
}
```

**Purpose**: Detailed logging for execution debugging and monitoring.

#### Execution Node States Table
```prisma
model ExecutionNodeState {
  id        String    @id @default(cuid())
  nodeId    String
  status    NodeExecutionStatus @default(PENDING)
  input     Json?     // Node input data
  output    Json?     // Node output data
  error     String?   // Node error message
  startTime DateTime?
  endTime   DateTime?
  retryCount Int      @default(0)

  executionId String
  execution   Execution @relation(fields: [executionId], references: [id], onDelete: Cascade)

  @@map("execution_node_states")
  @@index([executionId])
  @@index([nodeId])
  @@index([status])
}

enum NodeExecutionStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  SKIPPED
}
```

**Purpose**: Tracks individual node execution within workflows.

### Node Management

#### Node Registry Table
```prisma
model NodeDefinition {
  id          String   @id @default(cuid())
  type        String   @unique
  name        String
  description String
  category    String
  version     String   @default("1.0.0")
  config      Json     // Node configuration schema
  isActive    Boolean  @default(true)
  isCustom    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userId     String?  // Null for built-in nodes
  user       User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("node_definitions")
  @@index([type])
  @@index([category])
  @@index([isActive])
  @@index([isCustom])
}
```

**Purpose**: Registry of available node types with their configurations.

#### Node Configuration Schema Example
```json
{
  "inputs": [
    {
      "name": "url",
      "type": "string",
      "required": true,
      "description": "API endpoint URL"
    },
    {
      "name": "method",
      "type": "select",
      "options": ["GET", "POST", "PUT", "DELETE"],
      "default": "GET"
    }
  ],
  "outputs": [
    {
      "name": "response",
      "type": "object",
      "description": "API response data"
    },
    {
      "name": "status_code",
      "type": "number",
      "description": "HTTP status code"
    }
  ],
  "settings": {
    "timeout": 30000,
    "retries": 3
  }
}
```

### Credential Management

#### Credentials Table
```prisma
model Credential {
  id            String   @id @default(cuid())
  name          String
  type          String   // oauth, api_key, basic_auth, etc.
  encryptedData String   // AES-256 encrypted credential data
  isActive      Boolean  @default(true)
  expiresAt     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("credentials")
  @@index([userId])
  @@index([type])
  @@index([isActive])
}
```

**Purpose**: Secure storage of API credentials and authentication data.

**Security Features**:
- AES-256 encryption for sensitive data
- Expiration date support
- Type-based categorization
- User isolation

#### Encrypted Data Structure
```json
{
  "oauth": {
    "access_token": "encrypted_access_token",
    "refresh_token": "encrypted_refresh_token",
    "expires_in": 3600,
    "scope": "read write"
  },
  "api_key": {
    "key": "encrypted_api_key",
    "secret": "encrypted_secret"
  },
  "basic_auth": {
    "username": "encrypted_username",
    "password": "encrypted_password"
  }
}
```

### System Tables

#### App Settings Table
```prisma
model AppSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  category  String   @default("general")
  isPublic  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("app_settings")
  @@index([key])
  @@index([category])
}
```

**Purpose**: Store application-wide configuration settings.

#### Health Check Table
```prisma
model HealthCheck {
  id          String            @id @default(cuid())
  service     String
  status      HealthStatus
  response_time Int?            // Response time in milliseconds
  error_message String?
  checked_at    DateTime      @default(now())

  @@map("health_checks")
  @@index([service])
  @@index([checked_at])
}

enum HealthStatus {
  HEALTHY
  UNHEALTHY
  DEGRADED
}
```

**Purpose**: Monitor system health and service availability.

## Database Indexes

### Performance Optimization Indexes

```sql
-- User queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Workflow queries
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_active ON workflows(is_active);
CREATE INDEX idx_workflows_template ON workflows(is_template);

-- Execution queries
CREATE INDEX idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX idx_executions_user_id ON executions(user_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_start_time ON executions(start_time);

-- Execution logs
CREATE INDEX idx_execution_logs_execution_id ON execution_logs(execution_id);
CREATE INDEX idx_execution_logs_timestamp ON execution_logs(timestamp);
CREATE INDEX idx_execution_logs_level ON execution_logs(level);

-- Credentials
CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_credentials_type ON credentials(type);
CREATE INDEX idx_credentials_active ON credentials(is_active);

-- Composite indexes for common queries
CREATE INDEX idx_workflows_user_active ON workflows(user_id, is_active);
CREATE INDEX idx_executions_workflow_status ON executions(workflow_id, status);
```

## Data Migration Strategy

### Schema Versioning
```prisma
model SchemaMigration {
  id          String   @id @default(cuid())
  version     String   @unique
  description String
  applied_at  DateTime @default(now())
  checksum    String

  @@map("schema_migrations")
}
```

### Migration Scripts Structure
```typescript
// migrations/001_initial_schema.ts
export async function up(prisma: PrismaClient) {
  // Create tables, indexes, constraints
}

export async function down(prisma: PrismaClient) {
  // Rollback changes
}
```

## Data Backup Strategy

### Automated Backups
- **Full Backup**: Daily at 2 AM UTC
- **Incremental Backup**: Every 6 hours
- **Point-in-time Recovery**: Available for 30 days
- **Cross-region Replication**: Enabled for disaster recovery

### Backup Contents
1. User accounts and authentication data
2. Workflow definitions and configurations
3. Execution history and logs (last 90 days)
4. Node definitions and custom nodes
5. Encrypted credentials

### Backup Verification
```sql
-- Verify backup integrity
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
FROM users;

SELECT 
  COUNT(*) as total_workflows,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_workflows
FROM workflows;
```

## Security Considerations

### Data Encryption
- **At Rest**: Database-level encryption via NeonDB
- **In Transit**: TLS 1.3 for all connections
- **Application Level**: AES-256 for credentials
- **Backup Encryption**: Encrypted backup storage

### Access Control
```typescript
// Row Level Security (RLS) Examples
// Users can only access their own data
CREATE POLICY user_isolation ON workflows 
  FOR ALL USING (user_id = current_user_id());

CREATE POLICY user_executions ON executions 
  FOR ALL USING (user_id = current_user_id());
```

### Audit Logging
```typescript
// Audit trigger for sensitive operations
CREATE OR REPLACE FUNCTION audit_trigger() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    table_name, operation, user_id, old_data, new_data, timestamp
  ) VALUES (
    TG_TABLE_NAME, TG_OP, current_user_id(), 
    row_to_json(OLD), row_to_json(NEW), NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

## Performance Monitoring

### Key Metrics
- Query execution time per table
- Index usage statistics
- Connection pool utilization
- Cache hit ratios
- Slow query identification

### Monitoring Queries
```sql
-- Identify slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Index usage statistics
SELECT 
  t.tablename,
  indexname,
  c.reltuples AS num_rows,
  pg_size_pretty(pg_relation_size(quote_ident(t.tablename)::text)) AS table_size,
  pg_size_pretty(pg_relation_size(quote_ident(indexrelname)::text)) AS index_size,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname=t.tablename
LEFT JOIN pg_indexes i ON t.tablename=i.tablename
LEFT JOIN pg_stat_user_indexes psui ON i.indexname=psui.indexname;
```

## Data Retention Policies

### Execution Data
- **Success Executions**: Retain for 90 days
- **Failed Executions**: Retain for 180 days  
- **Execution Logs**: Retain for 30 days
- **Node States**: Retain with parent execution

### User Data
- **Active Users**: No automatic deletion
- **Inactive Users**: Archive after 2 years of inactivity
- **Deleted Workflows**: Soft delete for 30 days, then permanent deletion

### Cleanup Jobs
```typescript
// Automated cleanup service
@Injectable()
export class DataCleanupService {
  @Cron('0 2 * * *') // Daily at 2 AM
  async cleanupOldExecutions() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    await this.prisma.execution.deleteMany({
      where: {
        endTime: { lt: cutoffDate },
        status: 'SUCCESS'
      }
    });
  }
}
```

## Conclusion

This schema provides a robust foundation for the A2N workflow automation platform with:

1. **Scalable Design**: Optimized for growth with proper indexing
2. **Security First**: Comprehensive data protection measures  
3. **Audit Trail**: Complete execution and change tracking
4. **Performance**: Optimized queries and caching strategies
5. **Maintainability**: Clear structure with comprehensive documentation

The schema will evolve as new features are added, following strict migration procedures to ensure data integrity and zero-downtime deployments.