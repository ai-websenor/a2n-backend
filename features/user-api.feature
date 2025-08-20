# Extended BDD Template for User Management API with Tags

## API Overview

**Purpose**: User profile management and account operations API  
**Base URL**: `/api/users`  
**Authentication**: JWT Bearer Token (all endpoints require authentication)  
**Content Type**: `application/json`

### Tags for Overview
`@API @resource:users @status:critical`

---

## API Endpoints Specification

### Endpoint Group: User Profile Management

#### GET /api/users/me

**Purpose**: Get current authenticated user details  
**Authentication**: JWT Bearer Token required  

**Response Schema**:
```typescript
interface UserResponse {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Tags for Endpoint**:
`@API @endpoint:users-profile @action:GET @status:critical @type:profile-management`

**API Behaviors**:
```gherkin
Feature: User Profile Retrieval API

  @API @endpoint:users-profile @action:GET @type:happy-path @status:critical
  Scenario: Get current user profile successfully
    Given I am authenticated with valid JWT token
    When I send GET /api/users/me with Authorization header
    Then I should receive status code 200
    And the response should contain user profile data
    And the response should include id, email, name, and isActive fields
    And the response should not contain password field

  @API @endpoint:users-profile @action:GET @type:error-case @status:critical
  Scenario: Profile access fails without authentication
    When I send GET /api/users/me without Authorization header
    Then I should receive status code 401
    And the response should indicate unauthorized access

  @API @endpoint:users-profile @action:GET @type:error-case @status:critical
  Scenario: Profile not found for valid token
    Given I am authenticated but my user record doesn't exist
    When I send GET /api/users/me with Authorization header
    Then I should receive status code 404
    And the response should indicate user not found
```

---

#### GET /api/users/me/stats

**Purpose**: Get current user statistics (workflows, projects, executions)  
**Authentication**: JWT Bearer Token required  

**Response Schema**:
```typescript
interface UserStatsDto {
  workflows: number;
  projects: number;
  executions: number;
}
```

**Tags for Endpoint**:
`@API @endpoint:users-stats @action:GET @status:optional @type:analytics`

```gherkin
Feature: User Statistics API

  @API @endpoint:users-stats @action:GET @type:happy-path @status:optional
  Scenario: Get user statistics successfully
    Given I am authenticated with valid JWT token
    And I have 5 workflows, 3 projects, and 20 executions
    When I send GET /api/users/me/stats with Authorization header
    Then I should receive status code 200
    And the response should contain "workflows": 5
    And the response should contain "projects": 3
    And the response should contain "executions": 20

  @API @endpoint:users-stats @action:GET @type:error-case @status:optional
  Scenario: Stats access fails without authentication
    When I send GET /api/users/me/stats without Authorization header
    Then I should receive status code 401
    And the response should indicate unauthorized access
```

---

#### PUT /api/users/me

**Purpose**: Update current user profile information  
**Authentication**: JWT Bearer Token required  

**Request Schema**:
```typescript
interface UpdateUserDto {
  name?: string;
  email?: string;
}
```

**Tags for Endpoint**:
`@API @endpoint:users-update @action:PUT @status:critical @type:profile-management`

```gherkin
Feature: User Profile Update API

  @API @endpoint:users-update @action:PUT @type:happy-path @status:critical
  Scenario: Update user profile successfully
    Given I am authenticated with valid JWT token
    When I send PUT /api/users/me with:
      """
      {
        "name": "Updated Name",
        "email": "newemail@example.com"
      }
      """
    Then I should receive status code 200
    And the response should contain updated user data
    And the user name should be "Updated Name"
    And the user email should be "newemail@example.com"

  @API @endpoint:users-update @action:PUT @type:validation @status:critical
  Scenario: Update fails with invalid email format
    Given I am authenticated with valid JWT token
    When I send PUT /api/users/me with:
      """
      {
        "email": "invalid-email-format"
      }
      """
    Then I should receive status code 400
    And the response should contain validation error for email format

  @API @endpoint:users-update @action:PUT @type:error-case @status:critical
  Scenario: Update fails with duplicate email
    Given I am authenticated with valid JWT token
    And another user exists with email "existing@example.com"
    When I send PUT /api/users/me with:
      """
      {
        "email": "existing@example.com"
      }
      """
    Then I should receive status code 409
    And the response should indicate email already in use

  @API @endpoint:users-update @action:PUT @type:rate-limiting @status:critical
  Scenario: Profile update rate limiting
    Given I have made 5 profile updates in the last minute
    When I send PUT /api/users/me with valid data
    Then I should receive status code 429
    And the response should indicate too many update attempts
```

---

#### PUT /api/users/me/password

**Purpose**: Change user password  
**Authentication**: JWT Bearer Token required  

**Request Schema**:
```typescript
interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
```

**Tags for Endpoint**:
`@API @endpoint:users-password @action:PUT @status:critical @type:security`

```gherkin
Feature: Password Change API

  @API @endpoint:users-password @action:PUT @type:happy-path @status:critical
  Scenario: Change password successfully
    Given I am authenticated with valid JWT token
    And my current password is "OldPassword123!"
    When I send PUT /api/users/me/password with:
      """
      {
        "currentPassword": "OldPassword123!",
        "newPassword": "NewSecurePass456!"
      }
      """
    Then I should receive status code 200
    And the response should confirm password change
    And all user sessions should be invalidated
    And the user should need to log in again

  @API @endpoint:users-password @action:PUT @type:error-case @status:critical
  Scenario: Password change fails with incorrect current password
    Given I am authenticated with valid JWT token
    When I send PUT /api/users/me/password with:
      """
      {
        "currentPassword": "WrongPassword",
        "newPassword": "NewSecurePass456!"
      }
      """
    Then I should receive status code 400
    And the response should indicate current password is incorrect

  @API @endpoint:users-password @action:PUT @type:validation @status:critical
  Scenario: Password change fails with weak new password
    Given I am authenticated with valid JWT token
    When I send PUT /api/users/me/password with:
      """
      {
        "currentPassword": "OldPassword123!",
        "newPassword": "weak"
      }
      """
    Then I should receive status code 400
    And the response should contain password validation errors

  @API @endpoint:users-password @action:PUT @type:rate-limiting @status:critical
  Scenario: Password change rate limiting
    Given I have made 3 password change attempts in the last 5 minutes
    When I send PUT /api/users/me/password with valid data
    Then I should receive status code 429
    And the response should indicate too many password change attempts
```

---

#### DELETE /api/users/me

**Purpose**: Deactivate user account  
**Authentication**: JWT Bearer Token required  

**Tags for Endpoint**:
`@API @endpoint:users-deactivate @action:DELETE @status:critical @type:account-management`

```gherkin
Feature: Account Deactivation API

  @API @endpoint:users-deactivate @action:DELETE @type:happy-path @status:critical
  Scenario: Deactivate account successfully
    Given I am authenticated with valid JWT token
    And my account is currently active
    When I send DELETE /api/users/me with Authorization header
    Then I should receive status code 200
    And the response should confirm account deactivation
    And all user sessions should be terminated
    And the user account should be marked as inactive

  @API @endpoint:users-deactivate @action:DELETE @type:rate-limiting @status:critical
  Scenario: Account deactivation rate limiting
    Given I have made 1 deactivation attempt in the last 5 minutes
    When I send DELETE /api/users/me
    Then I should receive status code 429
    And the response should indicate too many deactivation attempts
```

---

#### PUT /api/users/me/activate

**Purpose**: Reactivate user account  
**Authentication**: JWT Bearer Token required  

**Tags for Endpoint**:
`@API @endpoint:users-activate @action:PUT @status:critical @type:account-management`

```gherkin
Feature: Account Reactivation API

  @API @endpoint:users-activate @action:PUT @type:happy-path @status:critical
  Scenario: Reactivate account successfully
    Given I am authenticated with valid JWT token
    And my account is currently inactive
    When I send PUT /api/users/me/activate with Authorization header
    Then I should receive status code 200
    And the response should confirm account reactivation
    And the response should contain updated user data
    And the user account should be marked as active

  @API @endpoint:users-activate @action:PUT @type:rate-limiting @status:critical
  Scenario: Account reactivation rate limiting
    Given I have made 3 reactivation attempts in the last 5 minutes
    When I send PUT /api/users/me/activate
    Then I should receive status code 429
    And the response should indicate too many reactivation attempts
```

---

### Endpoint Group: Session Management

#### GET /api/users/me/sessions

**Purpose**: Get active sessions information for current user  
**Authentication**: JWT Bearer Token required  

**Tags for Endpoint**:
`@API @endpoint:users-sessions-info @action:GET @status:optional @type:session-management`

```gherkin
Feature: User Sessions Information API

  @API @endpoint:users-sessions-info @action:GET @type:happy-path @status:optional
  Scenario: Get active sessions information
    Given I am authenticated with valid JWT token
    And I have 3 active sessions
    When I send GET /api/users/me/sessions with Authorization header
    Then I should receive status code 200
    And the response should contain "activeSessionsCount": 3
    And the response should contain appropriate message about active sessions

  @API @endpoint:users-sessions-info @action:GET @type:edge-case @status:optional
  Scenario: Get sessions info with only current session
    Given I am authenticated with valid JWT token
    And I have only 1 active session
    When I send GET /api/users/me/sessions with Authorization header
    Then I should receive status code 200
    And the response should contain "activeSessionsCount": 1
    And the response should indicate "Current session only"
```

---

#### DELETE /api/users/me/sessions

**Purpose**: Terminate all other sessions (keep current session)  
**Authentication**: JWT Bearer Token required  

**Tags for Endpoint**:
`@API @endpoint:users-sessions-terminate @action:DELETE @status:optional @type:session-management`

```gherkin
Feature: Other Sessions Termination API

  @API @endpoint:users-sessions-terminate @action:DELETE @type:happy-path @status:optional
  Scenario: Terminate other sessions successfully
    Given I am authenticated with valid JWT token
    And I have 3 active sessions
    When I send DELETE /api/users/me/sessions with Authorization header
    Then I should receive status code 200
    And the response should contain information about active sessions
    And the response should suggest using logout-all endpoint
    And the current session should remain active

  @API @endpoint:users-sessions-terminate @action:DELETE @type:edge-case @status:optional
  Scenario: Terminate sessions when only current session exists
    Given I am authenticated with valid JWT token
    And I have only 1 active session
    When I send DELETE /api/users/me/sessions with Authorization header
    Then I should receive status code 200
    And the response should indicate only current session exists
```

---

## Error Handling and Status Codes

### Tags:
`@API @type:error-handling @status:critical`

```gherkin
Feature: User Management API Error Handling

  @API @type:error-handling @action:any @status:critical
  Scenario: Handle unauthorized access to all endpoints
    When I send a request to any user endpoint without valid token
    Then I should receive 401 Unauthorized
    And the response should contain appropriate error message

  @API @type:error-handling @action:PUT @status:critical
  Scenario: Handle validation errors on profile update
    When I send profile update with invalid data format
    Then I should receive 400 Bad Request
    And the response should contain validation error details

  @API @type:error-handling @action:GET @status:critical
  Scenario: Handle user not found scenarios
    When I request user data but user record doesn't exist
    Then I should receive 404 Not Found
    And the response should indicate user not found
```

---

## Security Requirements

### Tags:
`@API @type:security @status:critical`

```gherkin
Feature: User Management Security

  @API @type:security @action:PUT @status:critical
  Scenario: Password change invalidates all sessions
    When I successfully change my password
    Then all existing refresh tokens should be invalidated
    And all active sessions should be terminated
    And user should need to log in again

  @API @type:security @action:PUT @status:critical
  Scenario: Current password validation for changes
    When I attempt to change password
    Then the current password must be validated
    And password change should fail with incorrect current password
    And no password should be changed without proper verification

  @API @type:security @action:any @status:critical
  Scenario: User data isolation
    When I access any user endpoint
    Then I should only access my own user data
    And no other user's data should be accessible
    And user ID should be extracted from JWT token
```

---

## Performance Requirements

### Tags:
`@API @type:performance @status:optional`

```gherkin
Feature: User Management API Performance

  @API @type:performance @action:GET @status:optional
  Scenario: User profile retrieval performance
    When I request my user profile
    Then response time should be less than 200ms
    And database query should be optimized

  @API @type:performance @action:GET @status:optional
  Scenario: User statistics calculation performance
    When I request user statistics
    Then response time should be less than 500ms
    And statistics should be efficiently calculated

  @API @type:performance @action:PUT @status:optional
  Scenario: Profile update performance
    When I update my profile
    Then response time should be less than 300ms
    And update operation should be atomic
```

---

## Data Quality and Validation

### Tags:
`@API @type:validation @status:critical`

```gherkin
Feature: User Data Validation

  @API @type:validation @action:PUT @status:critical
  Scenario: Email format validation on update
    When I update my email
    Then email should be validated for proper format
    And invalid email formats should be rejected
    And appropriate validation error should be returned

  @API @type:validation @action:PUT @status:critical
  Scenario: Password strength validation
    When I change my password
    Then new password should meet security requirements
    And weak passwords should be rejected
    And password requirements should be clearly communicated

  @API @type:validation @action:PUT @status:critical
  Scenario: Data consistency on updates
    When I update any profile field
    Then updated_at timestamp should be automatically updated
    And data integrity should be maintained
    And conflicting data should be prevented
```