# Extended BDD Template for Credential Management Database Schema with Tags

## Overview

**Purpose**: Structured template for documenting Credential Management database schemas using Behavior-Driven Development (BDD) principles, including tables, constraints, indexes, triggers, validation rules, performance, and security.

---

## Table: credentials

**Description**: Secure storage and management of user credentials for external service integrations

```sql
CREATE TABLE credentials (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- oauth, api_key, basic_auth, etc.
  encrypted_data TEXT NOT NULL, -- AES-256 encrypted credential data
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  user_id VARCHAR NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_credentials_type ON credentials(type);
CREATE INDEX idx_credentials_is_active ON credentials(is_active);
CREATE INDEX idx_credentials_expires_at ON credentials(expires_at);
```

### Tags:
`@DB @table:credentials @status:critical @security:high`

---

### Data Behaviors

```gherkin
Feature: Credential Data Validations and Operations

  @DB @table:credentials @type:validation @action:create @status:critical @security:high
  Scenario: Insert valid encrypted credential
    Given I have valid credential data for storage
      | field          | value                               |
      | name           | GitHub API Token                   |
      | type           | api_key                            |
      | encrypted_data | AES256_ENCRYPTED_TOKEN_DATA        |
      | is_active      | true                               |
      | expires_at     | 2025-12-31T23:59:59Z              |
      | user_id        | user123                            |
    When I insert the record into the credentials table
    Then the record should be created successfully
    And the credential data should be AES-256 encrypted
    And no plain text sensitive data should be stored
    And the credential should be linked to the correct user

  @DB @table:credentials @type:validation @action:create @status:critical @security:high
  Scenario: Require credential encryption
    When I attempt to store credential without encryption
    Then the system should reject the operation
    And an appropriate security error should be returned
    And no unencrypted sensitive data should be persisted

  @DB @table:credentials @type:validation @action:update @status:critical @security:high
  Scenario: Update credential with re-encryption
    Given an existing encrypted credential
    When I update the credential data
    Then the new data should be re-encrypted
    And the old encrypted data should be securely overwritten
    And updated_at timestamp should be refreshed

  @DB @table:credentials @type:validation @action:update @status:critical
  Scenario: Handle credential expiration
    Given a credential with expiration date
    When the expiration date passes
    Then the credential should be marked as inactive automatically
    And workflows using expired credentials should receive appropriate errors
    And users should be notified of credential expiration
```

---

## Table Constraints and Indexes

### Tags:
`@DB @table:credentials @type:constraint @type:index @status:critical @security:high`

```gherkin
Feature: Credential Management Indexes and Constraints

  @DB @table:credentials @type:index @action:read @status:critical @security:high
  Scenario: Query performance with user_id index
    Given there is an index on credentials.user_id
    When I query credentials by user_id
    Then the query should be optimized by the index
    And only the user's credentials should be returned
    And credential isolation should be maintained

  @DB @table:credentials @type:index @action:read @status:critical
  Scenario: Efficient credential type filtering
    Given there is an index on credentials.type
    When I query credentials by type (oauth, api_key, basic_auth)
    Then the query should use the type index
    And credential management should be optimized by type

  @DB @table:credentials @type:constraint @action:delete @status:critical @security:high
  Scenario: Cascade delete on user removal
    Given a user has stored credentials
    When the user is deleted
    Then all associated credentials should be securely deleted
    And encrypted data should be properly wiped
    And no orphaned credentials should remain

  @DB @table:credentials @type:index @action:read @status:critical
  Scenario: Expiration monitoring performance
    Given there is an index on credentials.expires_at
    When I query expiring credentials
    Then the query should use the expiration index efficiently
    And credential lifecycle management should be optimized
```

---

## Security and Access Control

### Tags:
`@DB @type:security @status:critical @security:high`

```gherkin
Feature: Credential Security and Encryption

  @DB @type:security @status:critical @security:high
  Scenario: Credential data encryption at rest
    Given credentials are stored in the database
    When credential data is persisted
    Then all sensitive data should be AES-256 encrypted
    And encryption keys should be stored separately from database
    And no plain text credentials should exist in storage

  @DB @type:security @action:grant @status:critical @security:high
  Scenario: Credential ownership isolation
    Given multiple users with their own credentials
    When user "A" queries credentials
    Then they should only access their own credentials
    And no other user's credentials should be visible or accessible
    And proper access control should be enforced at database level

  @DB @type:security @action:read @status:critical @security:high
  Scenario: Secure credential decryption
    Given encrypted credentials exist in database
    When credentials are needed for workflow execution
    Then decryption should occur in secure memory space
    And decrypted data should never be logged or persisted
    And decryption keys should be properly managed

  @DB @type:security @action:update @status:critical @security:high
  Scenario: Credential rotation security
    Given credentials that need rotation
    When new credentials replace old ones
    Then old encrypted data should be securely overwritten
    And rotation should be atomic to prevent credential gaps
    And audit trail should record credential changes without exposing data

  @DB @type:security @action:delete @status:critical @security:high
  Scenario: Secure credential deletion
    Given credentials marked for deletion
    When credentials are removed
    Then encrypted data should be cryptographically wiped
    And no recoverable traces should remain in database
    And deletion should be logged for audit purposes
```

---

## Performance Metrics

### Tags:
`@DB @type:performance @status:optional @security:medium`

```gherkin
Feature: Credential Management Performance

  @DB @type:performance @action:read @status:optional
  Scenario: Credential lookup performance
    Given a user has 100+ stored credentials
    When I query user's credentials
    Then response time should be under 20ms
    And credential listing should be efficiently indexed

  @DB @type:performance @action:read @status:optional
  Scenario: Credential decryption performance
    Given workflows require credential access
    When credentials are decrypted for use
    Then decryption should complete within 10ms per credential
    And performance should not degrade with credential count

  @DB @type:performance @action:read @status:optional
  Scenario: Credential expiration checking performance
    Given thousands of credentials with various expiration dates
    When checking for expired credentials
    Then expiration queries should complete efficiently
    And background cleanup should not impact system performance
```

---

## Data Quality and Integrity

### Tags:
`@DB @type:quality @type:validation @status:critical @security:high`

```gherkin
Feature: Credential Data Integrity

  @DB @type:quality @status:critical @security:high
  Scenario: Valid credential ownership
    Given credentials exist in the system
    When I query all credentials
    Then every credential should have a valid user_id reference
    And no orphaned credentials should exist
    And user-credential relationships should be consistent

  @DB @type:quality @status:critical @security:high
  Scenario: Encryption integrity validation
    When I query credential encrypted_data
    Then all credentials should have non-empty encrypted_data
    And encryption format should be consistent and valid
    And no plain text sensitive data should be found

  @DB @type:quality @status:critical
  Scenario: Credential type consistency
    Given credentials with different types
    When I query credential types
    Then all types should be valid and recognized
    And type values should follow established conventions
    And no invalid or malformed types should exist

  @DB @type:quality @status:critical
  Scenario: Expiration date validity
    Given credentials with expiration dates
    When I query expiration data
    Then expires_at should be null or future timestamp for active credentials
    And expired credentials should be properly handled
    And no invalid expiration dates should exist
```

---

## Migration Strategy

### Tags:
`@DB @type:migration @status:critical @security:high`

```gherkin
Feature: Credential Management Migration

  @DB @type:migration @action:create @status:critical @security:high
  Scenario: Apply credential management migration
    Given a database with users table
    When I run migration "006_create_credentials"
    Then credentials table should be created with all security constraints
    And all indexes should be properly established
    And foreign key to users should be enforced
    And proper column encryption should be configured

  @DB @type:migration @action:rollback @status:optional @security:high
  Scenario: Rollback credential migration safely
    Given credentials table exists with encrypted data
    When I rollback credential migration
    Then encrypted data should be securely handled
    And no credential data should leak during rollback
    And dependent workflow integrations should be considered

  @DB @type:migration @action:update @status:critical @security:high
  Scenario: Credential schema evolution with security
    Given existing credentials need schema updates
    When migration includes credential structure changes
    Then existing encrypted data should be preserved
    And encryption/decryption should remain functional
    And no credential data should be lost or exposed
```

---

## Credential Lifecycle Management

### Tags:
`@DB @type:business @status:critical @security:medium`

```gherkin
Feature: Credential Lifecycle Management

  @DB @type:business @action:create @status:critical
  Scenario: OAuth credential storage
    Given a user connects an OAuth service
    When OAuth tokens are received
    Then access and refresh tokens should be encrypted separately
    And token expiration should be tracked
    And automatic token refresh should be supported

  @DB @type:business @action:update @status:critical
  Scenario: API key credential management
    Given a user stores an API key credential
    When the API key is used in workflows
    Then usage should be tracked for audit purposes
    And key rotation should be supported
    And key validation should be performed when possible

  @DB @type:business @action:read @status:critical
  Scenario: Credential usage monitoring
    Given credentials are used by workflows
    When monitoring credential usage
    Then usage patterns should be trackable
    And unused credentials should be identifiable
    And overused credentials should trigger alerts

  @DB @type:business @action:update @status:optional
  Scenario: Credential health checking
    Given stored credentials for external services
    When performing health checks
    Then credential validity should be verified periodically
    And invalid credentials should be flagged
    And users should be notified of credential issues

  @DB @type:business @action:delete @status:critical @security:high
  Scenario: Credential cleanup and archival
    Given old or unused credentials
    When cleanup processes run
    Then expired credentials should be securely removed
    And archival should maintain audit trails
    And cleanup should not affect active workflows
```

---

## Integration Security

### Tags:
`@DB @type:integration @status:critical @security:high`

```gherkin
Feature: Credential Integration Security

  @DB @type:integration @action:read @status:critical @security:high
  Scenario: Workflow credential access
    Given a workflow requires external service credentials
    When the workflow requests credential access
    Then credentials should be decrypted only in secure execution context
    And credential access should be logged for audit
    And credentials should never be exposed in logs or UI

  @DB @type:integration @action:create @status:critical @security:high
  Scenario: Third-party service integration
    Given integrations with multiple external services
    When credentials are used for API calls
    Then each service should have isolated credential storage
    And cross-service credential leakage should be prevented
    And service-specific encryption should be considered

  @DB @type:integration @action:update @status:critical @security:high
  Scenario: Credential backup and recovery
    Given critical credentials for business operations
    When backup and recovery procedures are needed
    Then encrypted credential backups should be supported
    And recovery should maintain encryption integrity
    And backup access should be strictly controlled
```