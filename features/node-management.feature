# Extended BDD Template for Node Management Database Schema with Tags

## Overview

**Purpose**: Structured template for documenting Node Management database schemas using Behavior-Driven Development (BDD) principles, including tables, constraints, indexes, triggers, validation rules, performance, and security.

---

## Table: node_definitions

**Description**: Node type definitions and configuration schemas for workflow components

```sql
CREATE TABLE node_definitions (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  type VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR NOT NULL,
  version VARCHAR DEFAULT '1.0.0',
  config JSON NOT NULL, -- Node configuration schema
  is_active BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  user_id VARCHAR, -- Null for built-in nodes
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_node_definitions_type ON node_definitions(type);
CREATE INDEX idx_node_definitions_category ON node_definitions(category);
CREATE INDEX idx_node_definitions_is_active ON node_definitions(is_active);
CREATE INDEX idx_node_definitions_is_custom ON node_definitions(is_custom);
```

### Tags:
`@DB @table:node_definitions @status:critical`

---

### Data Behaviors

```gherkin
Feature: Node Definition Data Validations and Operations

  @DB @table:node_definitions @type:validation @action:create @status:critical
  Scenario: Insert valid built-in node definition
    Given I have valid data for node_definitions table
      | field       | value                                    |
      | type        | http_request                            |
      | name        | HTTP Request                            |
      | description | Make HTTP requests to external APIs     |
      | category    | network                                 |
      | version     | 1.0.0                                   |
      | config      | {"url": {"type": "string", "required": true}} |
      | is_active   | true                                    |
      | is_custom   | false                                   |
      | user_id     | null                                    |
    When I insert the record into the node_definitions table
    Then the record should be created successfully
    And the node type should be unique across all definitions
    And config schema should be stored as valid JSON

  @DB @table:node_definitions @type:validation @action:create @status:critical
  Scenario: Insert valid custom node definition
    Given a user wants to create a custom node
    When I insert a custom node definition
      | field       | value                     |
      | type        | custom_data_processor     |
      | name        | Custom Data Processor     |
      | description | User-defined processor    |
      | category    | custom                    |
      | is_custom   | true                      |
      | user_id     | user123                   |
    Then the record should be created successfully
    And the node should be linked to the creating user
    And it should be marked as custom

  @DB @table:node_definitions @type:constraint @action:create @status:critical
  Scenario: Prevent duplicate node types
    Given a node definition exists with type "http_request"
    When I try to insert another node with the same type
    Then the insert should fail with a constraint violation
    And the error should indicate unique constraint on type

  @DB @table:node_definitions @type:validation @action:update @status:critical
  Scenario: Version increment on schema update
    Given a node definition exists with version "1.0.0"
    When I update the config schema significantly
    Then the version should be incremented appropriately
    And the updated_at should reflect the new timestamp
    And backward compatibility should be considered
```

---

## Table Constraints and Indexes

### Tags:
`@DB @table:node_definitions @type:constraint @type:index @status:critical`

```gherkin
Feature: Node Definition Indexes and Constraints

  @DB @table:node_definitions @type:index @action:read @status:critical
  Scenario: Query performance with type index
    Given there is a unique index on node_definitions.type
    When I query node definitions by type
    Then the query should be optimized by the index
    And node lookup should be nearly instantaneous

  @DB @table:node_definitions @type:index @action:read @status:critical
  Scenario: Efficient category-based filtering
    Given there is an index on node_definitions.category
    When I query nodes by category (network, data, custom)
    Then the query should use the category index
    And nodes should be grouped efficiently by category

  @DB @table:node_definitions @type:index @action:read @status:critical
  Scenario: Active node filtering performance
    Given there is an index on node_definitions.is_active
    When I query only active node definitions
    Then the query should use the is_active index
    And inactive nodes should be excluded efficiently

  @DB @table:node_definitions @type:constraint @action:delete @status:critical
  Scenario: Cascade delete custom nodes on user removal
    Given a user has created custom node definitions
    When the user is deleted
    Then all their custom node definitions should be automatically deleted
    And built-in nodes should remain unaffected
```

---

## JSON Schema Validation

### Tags:
`@DB @type:validation @status:critical`

```gherkin
Feature: Node Configuration Schema Validation

  @DB @type:validation @action:create @status:critical
  Scenario: Valid configuration schema structure
    Given a node definition with configuration schema
    When the config JSON contains required schema fields
    Then the node definition should be created successfully
    And the schema should define input/output requirements
    And validation rules should be properly structured

  @DB @type:validation @action:update @status:critical
  Scenario: Schema backward compatibility validation
    Given an existing node definition with version "1.0.0"
    When I update the configuration schema
    Then new schema should maintain backward compatibility
    And existing workflows using this node should remain functional
    And breaking changes should increment major version

  @DB @type:validation @action:read @status:critical
  Scenario: Schema-based node configuration validation
    Given a node definition with specific config schema
    When a workflow uses this node type
    Then the node configuration should validate against the schema
    And invalid configurations should be rejected
    And appropriate validation errors should be provided
```

---

## Security and Access Control

### Tags:
`@DB @type:security @status:critical`

```gherkin
Feature: Node Definition Security

  @DB @type:security @status:critical
  Scenario: Custom node ownership isolation
    Given multiple users with custom node definitions
    When user "A" queries custom nodes
    Then they should see built-in nodes and their own custom nodes
    And other users' custom nodes should not be accessible
    And built-in nodes should be visible to all users

  @DB @type:security @action:grant @status:critical
  Scenario: Built-in node protection
    Given built-in node definitions exist (user_id is null)
    When any user attempts to modify built-in nodes
    Then modifications should be prevented
    And only system administrators should modify built-in nodes
    And custom nodes should only be modifiable by their creators

  @DB @type:security @action:read @status:critical
  Scenario: Node definition schema security
    Given node configurations may contain sensitive patterns
    When node schemas are accessed
    Then schema definitions should be sanitized for display
    And potentially dangerous configuration options should be restricted
    And user input should be validated against secure patterns
```

---

## Performance Metrics

### Tags:
`@DB @type:performance @status:optional`

```gherkin
Feature: Node Definition Performance

  @DB @type:performance @action:read @status:optional
  Scenario: Node type lookup performance
    Given 500+ node definitions across categories
    When I query node definitions by type
    Then response time should be under 5ms
    And type lookup should use unique index efficiently

  @DB @type:performance @action:read @status:optional
  Scenario: Category filtering performance
    Given node definitions across multiple categories
    When I filter nodes by category
    Then category-based queries should be optimized
    And response time should remain consistent with node count

  @DB @type:performance @action:read @status:optional
  Scenario: Complex schema parsing performance
    Given node definitions with large JSON schemas
    When schemas are parsed for validation
    Then JSON parsing should be efficient
    And schema validation should not cause performance bottlenecks
```

---

## Data Quality and Integrity

### Tags:
`@DB @type:quality @type:validation @status:critical`

```gherkin
Feature: Node Definition Data Integrity

  @DB @type:quality @status:critical
  Scenario: Valid node type uniqueness
    Given node definitions exist in the system
    When I query all node types
    Then every type should be unique across all definitions
    And no duplicate types should exist
    And type naming should follow consistent conventions

  @DB @type:quality @status:critical
  Scenario: Configuration schema validity
    When I query node definition configs
    Then all config fields should contain valid JSON
    And schema structure should follow JSON Schema specification
    And no malformed configuration schemas should exist

  @DB @type:quality @status:critical
  Scenario: Version format consistency
    Given node definitions with version fields
    When I query versions
    Then all versions should follow semantic versioning (x.y.z)
    And version progression should be logical
    And no invalid version formats should exist

  @DB @type:quality @status:critical
  Scenario: Custom node ownership validity
    Given custom node definitions exist
    When I query custom nodes
    Then all custom nodes (is_custom = true) should have valid user_id
    And all built-in nodes (is_custom = false) should have null user_id
    And no ownership inconsistencies should exist
```

---

## Migration Strategy

### Tags:
`@DB @type:migration @status:critical`

```gherkin
Feature: Node Definition Migration

  @DB @type:migration @action:create @status:critical
  Scenario: Apply node definition migration
    Given a database with users table
    When I run migration "005_create_node_definitions"
    Then node_definitions table should be created with all constraints
    And unique index on type should be established
    And all category and status indexes should be created
    And JSON config field should support complex schemas

  @DB @type:migration @action:create @status:critical
  Scenario: Seed built-in node definitions
    Given an empty node_definitions table
    When I run the built-in nodes seeder
    Then standard node types should be created (http_request, data_transform, etc.)
    And all built-in nodes should have is_custom = false and user_id = null
    And configuration schemas should be properly defined

  @DB @type:migration @action:rollback @status:optional
  Scenario: Rollback node definition migration safely
    Given node_definitions table exists with custom and built-in nodes
    When I rollback node definition migration
    Then workflow dependencies should be considered
    And custom node data should be backed up if needed
```

---

## Node Lifecycle Management

### Tags:
`@DB @type:business @status:critical`

```gherkin
Feature: Node Definition Lifecycle

  @DB @type:business @action:update @status:critical
  Scenario: Deprecate node definition
    Given an active node definition is being phased out
    When I mark the node as inactive
    Then is_active should be set to false
    And existing workflows should continue to function
    And new workflows should not be able to use the deprecated node
    And appropriate warnings should be provided

  @DB @type:business @action:create @status:critical
  Scenario: Node definition versioning
    Given a node definition needs schema updates
    When breaking changes are required
    Then a new version should be created
    And the old version should remain for backward compatibility
    And version migration path should be documented

  @DB @type:business @action:read @status:optional
  Scenario: Node usage analytics
    Given node definitions are used in workflows
    When analyzing node usage patterns
    Then usage statistics should be calculable
    And popular nodes should be identifiable
    And unused nodes should be candidates for deprecation

  @DB @type:business @action:create @status:optional
  Scenario: Custom node sharing
    Given a user creates a useful custom node
    When they want to share it with the community
    Then the node should be promotable to built-in status
    And proper attribution should be maintained
    And security review should be conducted
```