# Extended BDD Template for Project Management Database Schema with Tags

## Overview

**Purpose**: Structured template for documenting Project Management database schemas using Behavior-Driven Development (BDD) principles, including tables, constraints, indexes, triggers, validation rules, performance, and security.

---

## Table: projects

**Description**: Project organization and grouping for workflows

```sql
CREATE TABLE projects (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  color VARCHAR, -- Hex color for UI organization
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  user_id VARCHAR NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_is_archived ON projects(is_archived);
```

### Tags:
`@DB @table:projects @status:critical`

---

### Data Behaviors

```gherkin
Feature: Project Data Validations and Operations

  @DB @table:projects @type:validation @action:create @status:critical
  Scenario: Insert valid project record
    Given I have valid data for projects table
      | field       | value                    |
      | name        | Data Processing Project  |
      | description | Automated data pipeline  |
      | color       | #3B82F6                 |
      | is_archived | false                   |
      | user_id     | user123                 |
    When I insert the record into the projects table
    Then the record should be created successfully
    And required fields should be populated correctly
    And the project should be linked to the correct user

  @DB @table:projects @type:validation @action:create @status:critical
  Scenario: Require project name
    When I insert a project record without a name
    Then the system should throw a validation error
    And the project should not be created

  @DB @table:projects @type:validation @action:update @status:critical
  Scenario: Auto-update timestamp on modification
    Given a project record exists
    When I update any field in the project record
    Then the updated_at should reflect the new timestamp
    And the created_at should remain unchanged

  @DB @table:projects @type:validation @action:update @status:critical
  Scenario: Archive project instead of delete
    Given an active project with associated workflows
    When I archive the project
    Then is_archived should be set to true
    And associated workflows should remain accessible
    And project should be hidden from active project lists
```

---

## Table Constraints and Indexes

### Tags:
`@DB @table:projects @type:constraint @type:index @status:critical`

```gherkin
Feature: Project Management Indexes and Constraints

  @DB @table:projects @type:index @action:read @status:critical
  Scenario: Query performance with user_id index
    Given there is an index on projects.user_id
    When I query projects by user_id
    Then the query should be optimized by the index
    And only the user's projects should be returned

  @DB @table:projects @type:constraint @action:delete @status:critical
  Scenario: Cascade delete on user removal
    Given a user has associated projects
    When the user is deleted
    Then all associated projects should be automatically deleted
    And no orphaned projects should remain

  @DB @table:projects @type:index @action:read @status:critical
  Scenario: Efficient archived project filtering
    Given there is an index on projects.is_archived
    When I query only active projects
    Then the query should use the index efficiently
    And archived projects should be excluded from results
```

---

## Security and Access Control

### Tags:
`@DB @type:security @status:critical`

```gherkin
Feature: Project Management Security

  @DB @type:security @status:critical
  Scenario: Project ownership isolation
    Given multiple users with their own projects
    When user "A" queries projects
    Then they should only see their own projects
    And no other user's projects should be accessible

  @DB @type:security @action:grant @status:critical
  Scenario: Project access control
    Given a user owns a project
    When they perform CRUD operations on the project
    Then all operations should succeed
    And user should have full control over their project data

  @DB @type:security @action:read @status:critical
  Scenario: Prevent unauthorized project access
    Given a project belongs to user "A"
    When user "B" attempts to access the project
    Then access should be denied
    And appropriate authorization error should be returned
```

---

## Performance Metrics

### Tags:
`@DB @type:performance @status:optional`

```gherkin
Feature: Project Management Performance

  @DB @type:performance @action:read @status:optional
  Scenario: Project listing performance
    Given a user has 100 projects
    When I query the user's projects
    Then response time should be under 20ms
    And results should be properly indexed

  @DB @type:performance @action:read @status:optional
  Scenario: Archived project filtering performance
    Given 10,000 projects with 30% archived
    When I filter only active projects
    Then the query should efficiently exclude archived projects
    And response time should remain consistent
```

---

## Data Quality and Integrity

### Tags:
`@DB @type:quality @type:validation @status:critical`

```gherkin
Feature: Project Data Integrity

  @DB @type:quality @status:critical
  Scenario: Valid project ownership
    Given projects exist in the system
    When I query all projects
    Then every project should have a valid user_id reference
    And no orphaned projects should exist

  @DB @type:quality @status:critical
  Scenario: Project color validation
    Given a project has a color field
    When the color is set
    Then it should be a valid hex color format
    And empty color should be allowed for default styling

  @DB @type:quality @status:critical
  Scenario: Project archival consistency
    When I query archived projects
    Then is_archived should be explicitly true or false
    And no null values should exist in is_archived field
```

---

## Migration Strategy

### Tags:
`@DB @type:migration @status:critical`

```gherkin
Feature: Project Management Migration

  @DB @type:migration @action:create @status:critical
  Scenario: Apply project management migration
    Given a database with users table
    When I run migration "002_create_projects"
    Then projects table should be created with all constraints
    And foreign key to users should be properly established
    And all indexes should be created

  @DB @type:migration @action:rollback @status:optional
  Scenario: Rollback project migration safely
    Given projects table exists with data
    When I rollback project migration
    Then dependent workflow references should be handled
    And no data integrity issues should occur
```

---

## Business Logic Behaviors

### Tags:
`@DB @type:business @status:critical`

```gherkin
Feature: Project Business Logic

  @DB @type:business @action:create @status:critical
  Scenario: Default project creation
    Given a new user creates their first project
    When no color is specified
    Then a default color should be assigned
    And the project should be set as active by default

  @DB @type:business @action:update @status:critical
  Scenario: Project workflow dependency
    Given a project has associated workflows
    When the project is archived
    Then workflows should remain functional
    But should be grouped under archived project in UI

  @DB @type:business @action:read @status:optional
  Scenario: Project statistics calculation
    Given a project with multiple workflows
    When project statistics are requested
    Then workflow count should be calculated correctly
    And execution statistics should be aggregated properly
```