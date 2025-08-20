# Extended BDD Template for User Management Database Schema with Tags

## Overview

**Purpose**: Structured template for documenting User Management database schemas using Behavior-Driven Development (BDD) principles, including tables, constraints, indexes, triggers, validation rules, performance, and security.

---

## Table: users

**Description**: Core user authentication and profile management table

```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  password VARCHAR NOT NULL, -- bcrypt hashed
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
```

### Tags:
`@DB @table:users @status:critical`

---

### Data Behaviors

```gherkin
Feature: User Data Validations and Operations

  @DB @table:users @type:validation @action:create @status:critical
  Scenario: Insert valid user record
    Given I have valid data for users table
      | field     | value                    |
      | email     | user@example.com        |
      | name      | John Doe                |
      | password  | $2b$10$hashedpassword        |
      | is_active | true                    |
    When I insert the record into the users table
    Then the record should be created successfully
    And required fields should be populated correctly

  @DB @table:users @type:constraint @action:create @status:critical
  Scenario: Prevent duplicate entries on email
    Given there exists a user record with email "user@example.com"
    When I try to insert a record with the same email
    Then the insert should fail with a constraint violation
    And the error should indicate unique constraint on email

  @DB @table:users @type:validation @action:create @status:critical
  Scenario: Reject invalid email format
    When I insert a user record with invalid email format
    Then the system should throw a validation error
    And the user should not be created

  @DB @table:users @type:validation @action:update @status:critical
  Scenario: Auto-update timestamp on modification
    Given a user record exists
    When I update any field in the user record
    Then the updated_at should reflect the new timestamp
    And the created_at should remain unchanged
```

---

## Table: refresh_tokens

**Description**: JWT refresh token management for secure authentication

```sql
CREATE TABLE refresh_tokens (
  id VARCHAR PRIMARY KEY DEFAULT cuid(),
  token VARCHAR UNIQUE NOT NULL,
  user_id VARCHAR NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  is_revoked BOOLEAN DEFAULT false,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### Tags:
`@DB @table:refresh_tokens @status:critical`

```gherkin
Feature: Refresh Token Data Operations

  @DB @table:refresh_tokens @type:validation @action:create @status:critical
  Scenario: Create valid refresh token
    Given a valid user exists with id "user123"
    When I create a refresh token for the user
    Then the token should be unique
    And the expires_at should be set to future timestamp
    And the token should be linked to the correct user

  @DB @table:refresh_tokens @type:constraint @action:delete @status:critical
  Scenario: Cascade delete on user removal
    Given a user has associated refresh tokens
    When the user is deleted
    Then all associated refresh tokens should be automatically deleted
    And no orphaned refresh tokens should remain

  @DB @table:refresh_tokens @type:validation @action:update @status:critical
  Scenario: Revoke refresh token
    Given a valid refresh token exists
    When I revoke the refresh token
    Then is_revoked should be set to true
    And the token should not be usable for authentication
```

---

## Table Constraints and Indexes

### Tags:
`@DB @table:users @table:refresh_tokens @type:constraint @type:index @status:critical`

```gherkin
Feature: User Management Indexes and Constraints

  @DB @table:users @type:index @action:read @status:critical
  Scenario: Query performance with email index
    Given there is an index on users.email
    When I query users by email
    Then the query should be optimized by the index
    And response time should be under 10ms for single user lookup

  @DB @table:refresh_tokens @type:index @action:read @status:critical
  Scenario: Efficient token lookup
    Given there is an index on refresh_tokens.token
    When I query refresh tokens by token value
    Then the query should use the index
    And lookup should be optimized for authentication flows

  @DB @table:users @type:constraint @action:create @status:critical
  Scenario: Enforce unique email constraint
    When I insert user with duplicate email
    Then insert should fail due to unique constraint
    And appropriate error message should be returned
```

---

## Security and Access Control

### Tags:
`@DB @type:security @status:critical`

```gherkin
Feature: User Management Security

  @DB @type:security @status:critical
  Scenario: Password hashing validation
    Given a user registration with plain text password
    When the password is stored in the database
    Then it should be bcrypt hashed
    And the plain text password should never be stored

  @DB @type:security @action:grant @status:critical
  Scenario: User data isolation
    Given multiple users exist in the system
    When a user queries their data
    Then they should only access their own records
    And no cross-user data leakage should occur

  @DB @type:security @action:read @status:critical
  Scenario: Refresh token security
    Given refresh tokens are stored in database
    When tokens are accessed
    Then expired tokens should be excluded from queries
    And revoked tokens should not be usable
```

---

## Performance Metrics

### Tags:
`@DB @type:performance @status:optional`

```gherkin
Feature: User Management Performance

  @DB @type:performance @action:read @status:optional
  Scenario: User lookup performance
    Given 100,000 user records exist
    When I query user by email
    Then response time should be under 5ms
    And index scan should be used

  @DB @type:performance @action:read @status:optional
  Scenario: Refresh token cleanup performance
    Given thousands of expired refresh tokens exist
    When cleanup process runs
    Then expired tokens should be efficiently removed
    And active user sessions should not be affected
```

---

## Data Quality and Integrity

### Tags:
`@DB @type:quality @type:validation @status:critical`

```gherkin
Feature: User Data Integrity

  @DB @type:quality @status:critical
  Scenario: No orphaned refresh tokens
    Given users and refresh tokens exist
    When I query refresh tokens
    Then all tokens should have valid user references
    And no tokens should exist without corresponding users

  @DB @type:quality @status:critical
  Scenario: User account consistency
    When I query active users
    Then all users should have valid email addresses
    And password fields should never be null or empty
    And created_at should always be before updated_at
```

---

## Migration Strategy

### Tags:
`@DB @type:migration @status:critical`

```gherkin
Feature: User Management Migration

  @DB @type:migration @action:create @status:critical
  Scenario: Apply user management migration
    Given a new database
    When I run migration "001_create_users_and_refresh_tokens"
    Then users table should be created with all constraints
    And refresh_tokens table should be created with foreign keys
    And all indexes should be properly created

  @DB @type:migration @action:rollback @status:optional
  Scenario: Rollback user management migration safely
    When I rollback user management migration
    Then tables should be removed in correct dependency order
    And no data integrity issues should occur
```