# Extended BDD Template for Workflow Management Database Schema with Tags

## Overview

**Purpose**: Structured template for documenting Workflow Management database schemas using Behavior-Driven Development (BDD) principles, including tables, constraints, indexes, triggers, validation rules, performance, and security.

---

## Table: workflows

**Description**: Core workflow definition and metadata management

```sql
CREATE TABLE workflows (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  definition JSON NOT NULL, -- Complete workflow graph as JSON
  is_active BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  user_id VARCHAR NOT NULL,
  project_id VARCHAR,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_project_id ON workflows(project_id);
CREATE INDEX idx_workflows_is_active ON workflows(is_active);
CREATE INDEX idx_workflows_is_template ON workflows(is_template);
```

### Tags:
`@DB @table:workflows @status:critical`

---

### Data Behaviors

```gherkin
Feature: Workflow Data Validations and Operations

  @DB @table:workflows @type:validation @action:create @status:critical
  Scenario: Insert valid workflow record
    Given I have valid data for workflows table
      | field       | value                           |
      | name        | Data Processing Pipeline        |
      | description | Automated ETL workflow          |
      | definition  | {"nodes": [], "connections": []} |
      | is_active   | false                          |
      | is_template | false                          |
      | version     | 1                              |
      | user_id     | user123                        |
      | project_id  | project456                     |
    When I insert the record into the workflows table
    Then the record should be created successfully
    And the JSON definition should be properly stored
    And workflow should be linked to correct user and project

  @DB @table:workflows @type:validation @action:create @status:critical
  Scenario: Require workflow name and definition
    When I insert a workflow record without name or definition
    Then the system should throw a validation error
    And the workflow should not be created

  @DB @table:workflows @type:validation @action:update @status:critical
  Scenario: Version increment on definition update
    Given a workflow exists with version 1
    When I update the workflow definition
    Then the version should increment to 2
    And the updated_at should reflect the new timestamp

  @DB @table:workflows @type:validation @action:update @status:critical
  Scenario: Activate workflow validation
    Given a workflow with valid definition
    When I set is_active to true
    Then the workflow should be marked as active
    And it should be available for execution
```

---

## Table: workflow_triggers

**Description**: Trigger configuration for workflow automation

```sql
CREATE TABLE workflow_triggers (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  type trigger_type NOT NULL,
  config JSON NOT NULL, -- Trigger-specific configuration
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  workflow_id VARCHAR NOT NULL,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE TYPE trigger_type AS ENUM ('MANUAL', 'WEBHOOK', 'SCHEDULE', 'EVENT');
CREATE INDEX idx_workflow_triggers_workflow_id ON workflow_triggers(workflow_id);
CREATE INDEX idx_workflow_triggers_type ON workflow_triggers(type);
```

### Tags:
`@DB @table:workflow_triggers @status:critical`

```gherkin
Feature: Workflow Trigger Data Operations

  @DB @table:workflow_triggers @type:validation @action:create @status:critical
  Scenario: Create valid workflow trigger
    Given a workflow exists with id "workflow123"
    When I create a webhook trigger for the workflow
    Then the trigger should be linked to the correct workflow
    And the trigger type should be set to WEBHOOK
    And the config should contain webhook-specific settings

  @DB @table:workflow_triggers @type:constraint @action:delete @status:critical
  Scenario: Cascade delete on workflow removal
    Given a workflow has associated triggers
    When the workflow is deleted
    Then all associated triggers should be automatically deleted
    And no orphaned triggers should remain

  @DB @table:workflow_triggers @type:validation @action:update @status:critical
  Scenario: Deactivate trigger
    Given an active workflow trigger exists
    When I deactivate the trigger
    Then is_active should be set to false
    And the trigger should not fire for events
```

---

## Table Constraints and Indexes

### Tags:
`@DB @table:workflows @table:workflow_triggers @type:constraint @type:index @status:critical`

```gherkin
Feature: Workflow Management Indexes and Constraints

  @DB @table:workflows @type:index @action:read @status:critical
  Scenario: Query performance with user_id index
    Given there is an index on workflows.user_id
    When I query workflows by user_id
    Then the query should be optimized by the index
    And only the user's workflows should be returned

  @DB @table:workflows @type:index @action:read @status:critical
  Scenario: Efficient active workflow filtering
    Given there is an index on workflows.is_active
    When I query only active workflows
    Then the query should use the index efficiently
    And inactive workflows should be excluded

  @DB @table:workflow_triggers @type:index @action:read @status:critical
  Scenario: Trigger lookup by type
    Given there is an index on workflow_triggers.type
    When I query triggers by type
    Then the query should be optimized for trigger processing
    And appropriate triggers should be selected efficiently
```

---

## JSON Definition Validation

### Tags:
`@DB @type:validation @status:critical`

```gherkin
Feature: Workflow Definition JSON Validation

  @DB @type:validation @action:create @status:critical
  Scenario: Valid workflow JSON structure
    Given a workflow definition JSON
    When the JSON contains required fields (nodes, connections)
    Then the workflow should be created successfully
    And the JSON should be stored without corruption

  @DB @type:validation @action:update @status:critical
  Scenario: Validate workflow node references
    Given a workflow definition with node connections
    When I update the workflow definition
    Then all node references in connections should be valid
    And no dangling connections should exist

  @DB @type:validation @action:read @status:critical
  Scenario: JSON query and extraction
    Given workflows with complex JSON definitions
    When I query specific nodes from workflow definitions
    Then JSON extraction should work efficiently
    And nested properties should be accessible
```

---

## Security and Access Control

### Tags:
`@DB @type:security @status:critical`

```gherkin
Feature: Workflow Management Security

  @DB @type:security @status:critical
  Scenario: Workflow ownership isolation
    Given multiple users with their own workflows
    When user "A" queries workflows
    Then they should only see their own workflows
    And no other user's workflows should be accessible

  @DB @type:security @action:grant @status:critical
  Scenario: Template workflow sharing
    Given a workflow marked as template
    When other users query templates
    Then they should see the template workflow
    But should not be able to modify the original

  @DB @type:security @action:read @status:critical
  Scenario: Trigger security validation
    Given workflow triggers with sensitive config
    When trigger configurations are accessed
    Then sensitive data should be properly protected
    And only workflow owners should access trigger configs
```

---

## Performance Metrics

### Tags:
`@DB @type:performance @status:optional`

```gherkin
Feature: Workflow Management Performance

  @DB @type:performance @action:read @status:optional
  Scenario: Large workflow definition handling
    Given workflows with complex JSON definitions (>100KB)
    When I query workflow definitions
    Then retrieval should be efficient
    And JSON parsing should not cause performance issues

  @DB @type:performance @action:read @status:optional
  Scenario: Workflow listing with filtering
    Given a user has 500 workflows
    When I query workflows with filters (active, template)
    Then response time should be under 50ms
    And filtering should use appropriate indexes
```

---

## Data Quality and Integrity

### Tags:
`@DB @type:quality @type:validation @status:critical`

```gherkin
Feature: Workflow Data Integrity

  @DB @type:quality @status:critical
  Scenario: Valid workflow ownership
    Given workflows exist in the system
    When I query all workflows
    Then every workflow should have a valid user_id reference
    And project_id should be valid or null

  @DB @type:quality @status:critical
  Scenario: Workflow definition consistency
    When I query workflow definitions
    Then all definitions should be valid JSON
    And required JSON fields should be present
    And no corrupted JSON should exist

  @DB @type:quality @status:critical
  Scenario: Trigger-workflow relationship integrity
    Given workflow triggers exist
    When I query triggers
    Then all triggers should reference valid workflows
    And trigger types should match enum values
```

---

## Migration Strategy

### Tags:
`@DB @type:migration @status:critical`

```gherkin
Feature: Workflow Management Migration

  @DB @type:migration @action:create @status:critical
  Scenario: Apply workflow management migration
    Given a database with users and projects tables
    When I run migration "003_create_workflows_and_triggers"
    Then workflows table should be created with JSON support
    And workflow_triggers table should be created with enum types
    And all foreign keys should be properly established

  @DB @type:migration @action:rollback @status:optional
  Scenario: Rollback workflow migration safely
    Given workflows table exists with executions
    When I rollback workflow migration
    Then dependent execution references should be handled
    And JSON data should be preserved during migration
```

---

## Business Logic Behaviors

### Tags:
`@DB @type:business @status:critical`

```gherkin
Feature: Workflow Business Logic

  @DB @type:business @action:create @status:critical
  Scenario: Workflow template creation
    Given a user creates a successful workflow
    When they mark it as a template
    Then other users should be able to clone it
    And the original workflow should remain unchanged

  @DB @type:business @action:update @status:critical
  Scenario: Workflow versioning on major changes
    Given a workflow is used in production
    When significant definition changes are made
    Then version should increment appropriately
    And previous executions should reference correct version

  @DB @type:business @action:read @status:optional
  Scenario: Workflow execution eligibility
    Given workflows with different statuses
    When execution is requested
    Then only active workflows should be executable
    And inactive workflows should return appropriate errors
```