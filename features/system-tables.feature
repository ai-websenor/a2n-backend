# Extended BDD Template for System Tables Database Schema with Tags

## Overview

**Purpose**: Structured template for documenting System Tables database schemas using Behavior-Driven Development (BDD) principles, including tables, constraints, indexes, triggers, validation rules, performance, and security.

---

## Table: app_settings

**Description**: Application-wide configuration and settings management

```sql
CREATE TABLE app_settings (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  key VARCHAR UNIQUE NOT NULL,
  value JSON NOT NULL,
  category VARCHAR DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_app_settings_key ON app_settings(key);
CREATE INDEX idx_app_settings_category ON app_settings(category);
```

### Tags:
`@DB @table:app_settings @status:critical`

---

### Data Behaviors

```gherkin
Feature: App Settings Data Validations and Operations

  @DB @table:app_settings @type:validation @action:create @status:critical
  Scenario: Insert valid application setting
    Given I have valid data for app_settings table
      | field     | value                           |
      | key       | max_concurrent_executions      |
      | value     | {"limit": 100}                  |
      | category  | performance                     |
      | is_public | false                           |
    When I insert the record into the app_settings table
    Then the record should be created successfully
    And the setting key should be unique across all settings
    And the value should be stored as valid JSON

  @DB @table:app_settings @type:constraint @action:create @status:critical
  Scenario: Prevent duplicate setting keys
    Given a setting exists with key "max_concurrent_executions"
    When I try to insert another setting with the same key
    Then the insert should fail with a constraint violation
    And the error should indicate unique constraint on key

  @DB @table:app_settings @type:validation @action:update @status:critical
  Scenario: Update setting value with validation
    Given an application setting exists
    When I update the setting value
    Then the value should be validated as proper JSON
    And updated_at should reflect the new timestamp
    And setting history should be maintained if required

  @DB @table:app_settings @type:validation @action:read @status:critical
  Scenario: Public vs private setting access
    Given settings with different privacy levels
    When querying settings
    Then public settings should be accessible to all components
    And private settings should require appropriate authorization
    And sensitive configuration should never be exposed publicly
```

---

## Table: health_checks

**Description**: System health monitoring and service status tracking

```sql
CREATE TABLE health_checks (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  service VARCHAR NOT NULL,
  status health_status NOT NULL,
  response_time INTEGER, -- Response time in milliseconds
  error_message TEXT,
  checked_at TIMESTAMP DEFAULT now()
);

CREATE TYPE health_status AS ENUM ('HEALTHY', 'UNHEALTHY', 'DEGRADED');
CREATE INDEX idx_health_checks_service ON health_checks(service);
CREATE INDEX idx_health_checks_checked_at ON health_checks(checked_at);
```

### Tags:
`@DB @table:health_checks @status:critical`

```gherkin
Feature: Health Check Data Operations

  @DB @table:health_checks @type:validation @action:create @status:critical
  Scenario: Record service health check
    Given a health check is performed on database service
    When I record the health check result
      | field         | value                    |
      | service       | database                 |
      | status        | HEALTHY                  |
      | response_time | 25                       |
      | error_message | null                     |
    Then the health check should be recorded successfully
    And the status should be a valid enum value
    And response_time should be recorded in milliseconds

  @DB @table:health_checks @type:validation @action:create @status:critical
  Scenario: Record unhealthy service status
    Given a health check fails for external API service
    When I record the failed health check
    Then status should be set to UNHEALTHY
    And error_message should contain failure details
    And response_time may be null for timeout scenarios

  @DB @table:health_checks @type:validation @action:read @status:critical
  Scenario: Query recent health status
    Given multiple health checks exist for various services
    When I query recent health status
    Then I should get the latest status for each service
    And historical health data should be preserved
    And health trends should be analyzable
```

---

## Table: schema_migrations

**Description**: Database schema version tracking and migration history

```sql
CREATE TABLE schema_migrations (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  version VARCHAR UNIQUE NOT NULL,
  description TEXT NOT NULL,
  applied_at TIMESTAMP DEFAULT now(),
  checksum VARCHAR NOT NULL
);

CREATE INDEX idx_schema_migrations_version ON schema_migrations(version);
CREATE INDEX idx_schema_migrations_applied_at ON schema_migrations(applied_at);
```

### Tags:
`@DB @table:schema_migrations @status:critical`

```gherkin
Feature: Schema Migration Tracking

  @DB @table:schema_migrations @type:validation @action:create @status:critical
  Scenario: Record successful migration
    Given a database migration is executed
    When I record the migration in schema_migrations
      | field       | value                        |
      | version     | 20250812_001_create_users    |
      | description | Create users and auth tables |
      | checksum    | sha256_hash_of_migration     |
    Then the migration should be recorded successfully
    And the version should be unique across all migrations
    And checksum should ensure migration integrity

  @DB @table:schema_migrations @type:constraint @action:create @status:critical
  Scenario: Prevent duplicate migration versions
    Given a migration version "20250812_001_create_users" exists
    When I try to record the same version again
    Then the insert should fail with constraint violation
    And migration system should detect duplicate versions

  @DB @table:schema_migrations @type:validation @action:read @status:critical
  Scenario: Query migration history
    Given multiple migrations have been applied
    When I query migration history
    Then migrations should be ordered by applied_at timestamp
    And migration status should be trackable
    And rollback information should be available
```

---

## Table Constraints and Indexes

### Tags:
`@DB @table:app_settings @table:health_checks @table:schema_migrations @type:constraint @type:index @status:critical`

```gherkin
Feature: System Tables Indexes and Constraints

  @DB @table:app_settings @type:index @action:read @status:critical
  Scenario: Query performance with key index
    Given there is a unique index on app_settings.key
    When I query settings by key
    Then the query should be optimized by the index
    And setting lookup should be nearly instantaneous

  @DB @table:health_checks @type:index @action:read @status:critical
  Scenario: Efficient health history queries
    Given there is an index on health_checks.checked_at
    When I query health check history
    Then temporal queries should be optimized
    And health trend analysis should be efficient

  @DB @table:app_settings @type:index @action:read @status:critical
  Scenario: Category-based setting queries
    Given there is an index on app_settings.category
    When I query settings by category
    Then settings should be grouped efficiently
    And category-based configuration should be fast

  @DB @table:schema_migrations @type:constraint @action:read @status:critical
  Scenario: Migration version uniqueness
    Given migration versions must be unique
    When checking migration status
    Then version conflicts should be impossible
    And migration order should be deterministic
```

---

## Security and Access Control

### Tags:
`@DB @type:security @status:critical`

```gherkin
Feature: System Tables Security

  @DB @type:security @status:critical
  Scenario: Application setting access control
    Given app_settings contain sensitive configuration
    When settings are accessed
    Then private settings should require system-level access
    And public settings should be safely exposed to application
    And no sensitive credentials should be stored in settings

  @DB @type:security @action:read @status:critical
  Scenario: Health check information security
    Given health checks may reveal system architecture
    When health status is queried
    Then sensitive system details should be sanitized
    And health information should be available to authorized monitoring
    And external exposure should be carefully controlled

  @DB @type:security @action:grant @status:critical
  Scenario: Migration history protection
    Given schema migrations contain system structure information
    When migration history is accessed
    Then only authorized database administrators should access full details
    And migration information should not expose sensitive schema details
    And proper audit trails should be maintained
```

---

## Performance Metrics

### Tags:
`@DB @type:performance @status:optional`

```gherkin
Feature: System Tables Performance

  @DB @type:performance @action:read @status:optional
  Scenario: Application setting lookup performance
    Given hundreds of application settings exist
    When settings are queried by key
    Then response time should be under 2ms
    And setting cache should be efficiently managed

  @DB @type:performance @action:read @status:optional
  Scenario: Health check data retention performance
    Given months of health check history
    When querying recent health status
    Then queries should complete within 10ms
    And historical data cleanup should be efficient

  @DB @type:performance @action:read @status:optional
  Scenario: Migration history query performance
    Given extensive migration history
    When checking current schema version
    Then version lookup should be instantaneous
    And migration status should be quickly determinable
```

---

## Data Quality and Integrity

### Tags:
`@DB @type:quality @type:validation @status:critical`

```gherkin
Feature: System Tables Data Integrity

  @DB @type:quality @status:critical
  Scenario: Application setting value validity
    Given app_settings contain JSON values
    When I query all settings
    Then all values should be valid JSON
    And no malformed configuration should exist
    And setting types should be consistent within categories

  @DB @type:quality @status:critical
  Scenario: Health check status consistency
    Given health checks with various statuses
    When I query health data
    Then all statuses should be valid enum values
    And response_time should be positive integers or null
    And service names should follow naming conventions

  @DB @type:quality @status:critical
  Scenario: Migration checksum integrity
    Given schema migrations with checksums
    When validating migration integrity
    Then checksums should match applied migrations
    And no corrupted migration records should exist
    And migration sequence should be complete
```

---

## Migration Strategy

### Tags:
`@DB @type:migration @status:critical`

```gherkin
Feature: System Tables Migration

  @DB @type:migration @action:create @status:critical
  Scenario: Apply system tables migration
    Given a new database instance
    When I run migration "007_create_system_tables"
    Then app_settings table should be created with JSON support
    And health_checks table should be created with enum types
    And schema_migrations table should be created with constraints
    And all system indexes should be properly established

  @DB @type:migration @action:create @status:critical
  Scenario: Seed default application settings
    Given an empty app_settings table
    When I run the settings seeder
    Then default system settings should be created
    And essential configuration should be initialized
    And setting categories should be properly organized

  @DB @type:migration @action:rollback @status:optional
  Scenario: Rollback system tables migration safely
    Given system tables exist with configuration data
    When I rollback system tables migration
    Then critical settings should be backed up
    And system functionality should degrade gracefully
    And rollback should not break application startup
```

---

## System Configuration Management

### Tags:
`@DB @type:business @status:critical`

```gherkin
Feature: System Configuration Management

  @DB @type:business @action:update @status:critical
  Scenario: Dynamic configuration updates
    Given application settings control system behavior
    When configuration is updated
    Then changes should take effect without restart when possible
    And configuration validation should prevent invalid values
    And change history should be maintained for audit

  @DB @type:business @action:read @status:critical
  Scenario: Environment-specific configuration
    Given settings may vary by deployment environment
    When deploying to different environments
    Then environment-specific settings should be properly managed
    And sensitive settings should be externally configured
    And default values should be appropriate for each environment

  @DB @type:business @action:create @status:optional
  Scenario: Feature flag management
    Given features may be enabled/disabled via settings
    When managing feature rollouts
    Then feature flags should be stored as application settings
    And flag changes should be trackable
    And gradual rollouts should be supported through configuration
```

---

## Health Monitoring and Alerting

### Tags:
`@DB @type:monitoring @status:critical`

```gherkin
Feature: Health Monitoring and Alerting

  @DB @type:monitoring @action:create @status:critical
  Scenario: Automated health check recording
    Given system components need health monitoring
    When health checks are performed automatically
    Then results should be consistently recorded
    And health trends should be trackable over time
    And alerting should be triggered based on health patterns

  @DB @type:monitoring @action:read @status:critical
  Scenario: Service degradation detection
    Given health checks track service performance
    When service performance degrades
    Then DEGRADED status should be recorded appropriately
    And degradation patterns should be identifiable
    And escalation should occur for persistent issues

  @DB @type:monitoring @action:read @status:optional
  Scenario: Health check aggregation and reporting
    Given health data from multiple services
    When generating system health reports
    Then overall system health should be calculable
    And service dependencies should be considered
    And health dashboards should display accurate status
```