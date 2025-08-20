# Extended BDD Template for Execution Tracking Database Schema with Tags

## Overview

**Purpose**: Structured template for documenting Execution Tracking database schemas using Behavior-Driven Development (BDD) principles, including tables, constraints, indexes, triggers, validation rules, performance, and security.

---

## Table: executions

**Description**: Workflow execution tracking and status management

```sql
CREATE TABLE executions (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  status execution_status DEFAULT 'PENDING',
  start_time TIMESTAMP DEFAULT now(),
  end_time TIMESTAMP,
  duration INTEGER, -- Execution duration in milliseconds
  data JSON, -- Execution context and results
  error TEXT, -- Error message if failed
  workflow_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TYPE execution_status AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED', 'PAUSED');
CREATE INDEX idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX idx_executions_user_id ON executions(user_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_start_time ON executions(start_time);
```

### Tags:
`@DB @table:executions @status:critical`

---

### Data Behaviors

```gherkin
Feature: Execution Data Validations and Operations

  @DB @table:executions @type:validation @action:create @status:critical
  Scenario: Insert valid execution record
    Given I have valid data for executions table
      | field       | value                      |
      | status      | PENDING                    |
      | start_time  | 2025-08-12T10:00:00Z      |
      | data        | {"input": "test_data"}     |
      | workflow_id | workflow123                |
      | user_id     | user123                    |
    When I insert the record into the executions table
    Then the record should be created successfully
    And the execution should be linked to correct workflow and user
    And status should default to PENDING

  @DB @table:executions @type:validation @action:update @status:critical
  Scenario: Update execution status progression
    Given an execution with status PENDING
    When I update the status to RUNNING
    Then the status should change successfully
    And start_time should be set if not already set
    And appropriate audit trail should be maintained

  @DB @table:executions @type:validation @action:update @status:critical
  Scenario: Complete execution with duration calculation
    Given a RUNNING execution with start_time set
    When I update the status to SUCCESS
    Then end_time should be set to current timestamp
    And duration should be calculated as (end_time - start_time) in milliseconds
    And final data should be stored in data field

  @DB @table:executions @type:validation @action:update @status:critical
  Scenario: Handle execution failure
    Given a RUNNING execution
    When an error occurs during execution
    Then status should be updated to FAILED
    And error message should be stored in error field
    And end_time and duration should be calculated
```

---

## Table: execution_logs

**Description**: Detailed logging for execution monitoring and debugging

```sql
CREATE TABLE execution_logs (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  node_id VARCHAR, -- Null for workflow-level logs
  level log_level NOT NULL,
  message TEXT NOT NULL,
  metadata JSON, -- Additional log context
  timestamp TIMESTAMP DEFAULT now(),
  execution_id VARCHAR NOT NULL,
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE TYPE log_level AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');
CREATE INDEX idx_execution_logs_execution_id ON execution_logs(execution_id);
CREATE INDEX idx_execution_logs_level ON execution_logs(level);
CREATE INDEX idx_execution_logs_timestamp ON execution_logs(timestamp);
```

### Tags:
`@DB @table:execution_logs @status:critical`

```gherkin
Feature: Execution Log Data Operations

  @DB @table:execution_logs @type:validation @action:create @status:critical
  Scenario: Create execution log entry
    Given an execution is running with id "exec123"
    When I create a log entry for the execution
      | field       | value                           |
      | node_id     | node_456                       |
      | level       | INFO                           |
      | message     | Processing data batch 1        |
      | metadata    | {"batch_size": 100}            |
    Then the log entry should be created successfully
    And it should be linked to the correct execution
    And timestamp should be set automatically

  @DB @table:execution_logs @type:constraint @action:delete @status:critical
  Scenario: Cascade delete logs on execution removal
    Given an execution has associated log entries
    When the execution is deleted
    Then all associated logs should be automatically deleted
    And no orphaned log entries should remain

  @DB @table:execution_logs @type:validation @action:create @status:critical
  Scenario: Workflow-level logging
    Given an execution requires workflow-level logging
    When I create a log entry without node_id
    Then the log should be created with null node_id
    And it should represent a workflow-level event
```

---

## Table: execution_node_states

**Description**: Individual node execution status and data tracking

```sql
CREATE TABLE execution_node_states (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  node_id VARCHAR NOT NULL,
  status node_execution_status DEFAULT 'PENDING',
  input JSON, -- Node input data
  output JSON, -- Node output data
  error TEXT, -- Node error message
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  execution_id VARCHAR NOT NULL,
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE TYPE node_execution_status AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED');
CREATE INDEX idx_execution_node_states_execution_id ON execution_node_states(execution_id);
CREATE INDEX idx_execution_node_states_node_id ON execution_node_states(node_id);
CREATE INDEX idx_execution_node_states_status ON execution_node_states(status);
```

### Tags:
`@DB @table:execution_node_states @status:critical`

```gherkin
Feature: Node State Data Operations

  @DB @table:execution_node_states @type:validation @action:create @status:critical
  Scenario: Create node execution state
    Given an execution is starting with multiple nodes
    When I create node states for each node
    Then each node should have a PENDING state initially
    And all nodes should be linked to the correct execution
    And retry_count should default to 0

  @DB @table:execution_node_states @type:validation @action:update @status:critical
  Scenario: Update node execution progress
    Given a node in PENDING status
    When the node starts executing
    Then status should update to RUNNING
    And start_time should be set
    And input data should be stored

  @DB @table:execution_node_states @type:validation @action:update @status:critical
  Scenario: Complete node execution successfully
    Given a node in RUNNING status
    When the node completes successfully
    Then status should update to SUCCESS
    And end_time should be set
    And output data should be stored in output field

  @DB @table:execution_node_states @type:validation @action:update @status:critical
  Scenario: Handle node execution retry
    Given a node that failed with retry_count 0
    When a retry is attempted
    Then retry_count should increment to 1
    And status should reset to RUNNING
    And previous error should be preserved
```

---

## Table Constraints and Indexes

### Tags:
`@DB @table:executions @table:execution_logs @table:execution_node_states @type:constraint @type:index @status:critical`

```gherkin
Feature: Execution Tracking Indexes and Constraints

  @DB @table:executions @type:index @action:read @status:critical
  Scenario: Query performance with workflow_id index
    Given there is an index on executions.workflow_id
    When I query executions by workflow
    Then the query should be optimized by the index
    And execution history should be retrieved efficiently

  @DB @table:execution_logs @type:index @action:read @status:critical
  Scenario: Efficient log retrieval by execution
    Given there is an index on execution_logs.execution_id
    When I query logs for a specific execution
    Then logs should be retrieved efficiently
    And ordered by timestamp for proper sequence

  @DB @table:executions @type:index @action:read @status:critical
  Scenario: Status-based execution filtering
    Given there is an index on executions.status
    When I query executions by status (RUNNING, FAILED)
    Then the query should use the status index
    And filtering should be performed efficiently

  @DB @table:execution_logs @type:index @action:read @status:critical
  Scenario: Log level filtering performance
    Given there is an index on execution_logs.level
    When I query only ERROR level logs
    Then the query should use the level index
    And error logs should be retrieved quickly
```

---

## Security and Access Control

### Tags:
`@DB @type:security @status:critical`

```gherkin
Feature: Execution Tracking Security

  @DB @type:security @status:critical
  Scenario: Execution data isolation
    Given multiple users with their own executions
    When user "A" queries executions
    Then they should only see their own execution data
    And no other user's execution data should be accessible

  @DB @type:security @action:grant @status:critical
  Scenario: Execution log privacy
    Given execution logs contain sensitive information
    When logs are accessed
    Then only execution owners should access full log details
    And proper access control should be enforced

  @DB @type:security @action:read @status:critical
  Scenario: Node state data protection
    Given node states contain input/output data
    When node states are queried
    Then sensitive data should be properly protected
    And access should be limited to execution owners
```

---

## Performance Metrics

### Tags:
`@DB @type:performance @status:optional`

```gherkin
Feature: Execution Tracking Performance

  @DB @type:performance @action:read @status:optional
  Scenario: Large execution log handling
    Given an execution with 10,000+ log entries
    When I query execution logs
    Then retrieval should be paginated efficiently
    And memory usage should remain reasonable

  @DB @type:performance @action:read @status:optional
  Scenario: Concurrent execution monitoring
    Given 100 executions running simultaneously
    When monitoring real-time execution status
    Then database performance should remain stable
    And status updates should be processed efficiently

  @DB @type:performance @action:read @status:optional
  Scenario: Historical execution analysis
    Given 6 months of execution history
    When performing analytics queries
    Then aggregation queries should complete within 2 seconds
    And appropriate indexes should be utilized
```

---

## Data Quality and Integrity

### Tags:
`@DB @type:quality @type:validation @status:critical`

```gherkin
Feature: Execution Data Integrity

  @DB @type:quality @status:critical
  Scenario: Valid execution relationships
    Given executions exist in the system
    When I query all executions
    Then every execution should have valid workflow_id and user_id references
    And no orphaned executions should exist

  @DB @type:quality @status:critical
  Scenario: Execution duration consistency
    When I query completed executions
    Then executions with end_time should have calculated duration
    And duration should match (end_time - start_time)
    And running executions should have null end_time and duration

  @DB @type:quality @status:critical
  Scenario: Node state consistency
    Given execution node states exist
    When I query node states
    Then all node states should reference valid executions
    And node_id should correspond to nodes in workflow definition
    And status transitions should be logical (PENDING → RUNNING → SUCCESS/FAILED)

  @DB @type:quality @status:critical
  Scenario: Log entry consistency
    Given execution logs exist
    When I query logs
    Then all logs should reference valid executions
    And timestamp ordering should be maintained
    And log levels should be valid enum values
```

---

## Migration Strategy

### Tags:
`@DB @type:migration @status:critical`

```gherkin
Feature: Execution Tracking Migration

  @DB @type:migration @action:create @status:critical
  Scenario: Apply execution tracking migration
    Given a database with workflows and users tables
    When I run migration "004_create_execution_tracking"
    Then executions table should be created with all enum types
    And execution_logs table should be created with proper indexes
    And execution_node_states table should be created with foreign keys
    And all enum types should be properly defined

  @DB @type:migration @action:rollback @status:optional
  Scenario: Rollback execution tracking migration safely
    Given execution tracking tables exist with data
    When I rollback execution tracking migration
    Then tables should be removed in correct dependency order
    And enum types should be cleaned up properly
```

---

## Real-time Processing

### Tags:
`@DB @type:realtime @status:critical`

```gherkin
Feature: Real-time Execution Processing

  @DB @type:realtime @action:update @status:critical
  Scenario: Real-time status updates
    Given an execution is running
    When status changes occur
    Then updates should be processed immediately
    And dependent systems should be notified
    And status transitions should be atomic

  @DB @type:realtime @action:create @status:critical
  Scenario: Live log streaming
    Given an execution is generating logs
    When new log entries are created
    Then they should be immediately available for queries
    And real-time monitoring should receive updates
    And log ordering should be preserved

  @DB @type:realtime @action:update @status:critical
  Scenario: Node state real-time updates
    Given nodes are executing in parallel
    When node states change
    Then updates should be reflected immediately
    And execution progress should be accurately tracked
    And UI should receive real-time node status updates
```