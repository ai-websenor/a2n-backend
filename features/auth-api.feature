# Extended BDD Template for Authentication API with Tags

## API Overview

**Purpose**: User authentication and session management API  
**Base URL**: `/api/auth`  
**Authentication**: JWT Bearer Token (for protected endpoints)  
**Content Type**: `application/json`

### Tags for Overview
`@API @resource:auth @status:critical`

---

## API Endpoints Specification

### Endpoint Group: User Registration and Login

#### POST /api/auth/register

**Purpose**: Register a new user account  
**Authentication**: Public endpoint  

**Request Schema**:
```typescript
interface RegisterDto {
  email: string;
  name?: string;
  password: string;
}
```

**Response Schema**:
```typescript
interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    isActive: boolean;
  };
}
```

**Tags for Endpoint**:
`@API @endpoint:auth-register @action:POST @status:critical @type:authentication`

**API Behaviors**:
```gherkin
Feature: User Registration API

  @API @endpoint:auth-register @action:POST @type:happy-path @status:critical
  Scenario: Successful user registration with valid data
    Given I have valid registration data
    When I send POST /api/auth/register with:
      """
      {
        "email": "newuser@example.com",
        "name": "John Doe",
        "password": "SecurePass123!"
      }
      """
    Then I should receive status code 201
    And the response should contain "accessToken"
    And the response should contain user details
    And a refresh token cookie should be set

  @API @endpoint:auth-register @action:POST @type:error-case @status:critical
  Scenario: Registration fails with duplicate email
    Given a user already exists with email "existing@example.com"
    When I send POST /api/auth/register with:
      """
      {
        "email": "existing@example.com",
        "name": "Jane Doe",
        "password": "SecurePass123!"
      }
      """
    Then I should receive status code 409
    And the response should contain error message about email already registered

  @API @endpoint:auth-register @action:POST @type:validation @status:critical
  Scenario: Registration fails with invalid email format
    When I send POST /api/auth/register with:
      """
      {
        "email": "invalid-email",
        "name": "John Doe",
        "password": "SecurePass123!"
      }
      """
    Then I should receive status code 400
    And the response should contain validation error for email format

  @API @endpoint:auth-register @action:POST @type:rate-limiting @status:critical
  Scenario: Registration rate limiting - too many attempts
    Given I have made 3 registration attempts in the last minute
    When I send POST /api/auth/register with valid data
    Then I should receive status code 429
    And the response should indicate too many attempts
```

---

#### POST /api/auth/login

**Purpose**: Authenticate user and provide access tokens  
**Authentication**: Public endpoint with LocalAuthGuard  

**Request Schema**:
```typescript
interface LoginDto {
  email: string;
  password: string;
}
```

**Response Schema**:
```typescript
interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    isActive: boolean;
  };
}
```

**Tags for Endpoint**:
`@API @endpoint:auth-login @action:POST @status:critical @type:authentication`

```gherkin
Feature: User Login API

  @API @endpoint:auth-login @action:POST @type:happy-path @status:critical
  Scenario: Successful login with valid credentials
    Given a user exists with email "user@example.com" and password "ValidPass123!"
    When I send POST /api/auth/login with:
      """
      {
        "email": "user@example.com",
        "password": "ValidPass123!"
      }
      """
    Then I should receive status code 200
    And the response should contain "accessToken"
    And the response should contain user details
    And a refresh token cookie should be set

  @API @endpoint:auth-login @action:POST @type:error-case @status:critical
  Scenario: Login fails with invalid credentials
    When I send POST /api/auth/login with:
      """
      {
        "email": "user@example.com",
        "password": "WrongPassword"
      }
      """
    Then I should receive status code 401
    And the response should indicate invalid credentials

  @API @endpoint:auth-login @action:POST @type:rate-limiting @status:critical
  Scenario: Login rate limiting - too many attempts
    Given I have made 5 failed login attempts in the last minute
    When I send POST /api/auth/login with any credentials
    Then I should receive status code 429
    And the response should indicate too many login attempts
```

---

#### POST /api/auth/refresh

**Purpose**: Refresh access token using refresh token  
**Authentication**: Public endpoint  

**Tags for Endpoint**:
`@API @endpoint:auth-refresh @action:POST @status:critical @type:token-management`

```gherkin
Feature: Token Refresh API

  @API @endpoint:auth-refresh @action:POST @type:happy-path @status:critical
  Scenario: Successful token refresh with valid refresh token
    Given I have a valid refresh token in cookies
    When I send POST /api/auth/refresh
    Then I should receive status code 200
    And the response should contain new "accessToken"
    And a new refresh token cookie should be set

  @API @endpoint:auth-refresh @action:POST @type:error-case @status:critical
  Scenario: Token refresh fails with missing refresh token
    Given I have no refresh token in cookies
    When I send POST /api/auth/refresh
    Then I should receive status code 401
    And the response should indicate refresh token not found

  @API @endpoint:auth-refresh @action:POST @type:error-case @status:critical
  Scenario: Token refresh fails with expired refresh token
    Given I have an expired refresh token in cookies
    When I send POST /api/auth/refresh
    Then I should receive status code 401
    And the response should indicate invalid or expired refresh token
```

---

#### POST /api/auth/logout

**Purpose**: Logout user and invalidate refresh token  
**Authentication**: JWT Bearer Token required  

**Tags for Endpoint**:
`@API @endpoint:auth-logout @action:POST @status:critical @type:session-management`

```gherkin
Feature: User Logout API

  @API @endpoint:auth-logout @action:POST @type:happy-path @status:critical
  Scenario: Successful logout with valid token
    Given I am authenticated with valid JWT token
    And I have a refresh token in cookies
    When I send POST /api/auth/logout with Authorization header
    Then I should receive status code 200
    And the response should confirm successful logout
    And the refresh token cookie should be cleared

  @API @endpoint:auth-logout @action:POST @type:error-case @status:critical
  Scenario: Logout fails without authentication
    When I send POST /api/auth/logout without Authorization header
    Then I should receive status code 401
    And the response should indicate unauthorized access
```

---

#### POST /api/auth/logout-all

**Purpose**: Logout from all devices and invalidate all user sessions  
**Authentication**: JWT Bearer Token required  

**Tags for Endpoint**:
`@API @endpoint:auth-logout-all @action:POST @status:critical @type:session-management`

```gherkin
Feature: Logout All Devices API

  @API @endpoint:auth-logout-all @action:POST @type:happy-path @status:critical
  Scenario: Successful logout from all devices
    Given I am authenticated with valid JWT token
    And I have multiple active sessions
    When I send POST /api/auth/logout-all with Authorization header
    Then I should receive status code 200
    And the response should confirm logout from all devices
    And all refresh tokens for the user should be invalidated
    And the refresh token cookie should be cleared
```

---

#### GET /api/auth/profile

**Purpose**: Get current authenticated user profile  
**Authentication**: JWT Bearer Token required  

**Tags for Endpoint**:
`@API @endpoint:auth-profile @action:GET @status:critical @type:user-info`

```gherkin
Feature: User Profile API

  @API @endpoint:auth-profile @action:GET @type:happy-path @status:critical
  Scenario: Get user profile with valid authentication
    Given I am authenticated with valid JWT token
    When I send GET /api/auth/profile with Authorization header
    Then I should receive status code 200
    And the response should contain user profile data
    And the response should include id, email, name, and isActive fields

  @API @endpoint:auth-profile @action:GET @type:error-case @status:critical
  Scenario: Profile access fails without authentication
    When I send GET /api/auth/profile without Authorization header
    Then I should receive status code 401
    And the response should indicate unauthorized access
```

---

#### GET /api/auth/sessions

**Purpose**: Get active sessions count for current user  
**Authentication**: JWT Bearer Token required  

**Tags for Endpoint**:
`@API @endpoint:auth-sessions @action:GET @status:optional @type:session-info`

```gherkin
Feature: Active Sessions API

  @API @endpoint:auth-sessions @action:GET @type:happy-path @status:optional
  Scenario: Get active sessions count
    Given I am authenticated with valid JWT token
    And I have 2 active sessions
    When I send GET /api/auth/sessions with Authorization header
    Then I should receive status code 200
    And the response should contain "activeSessionsCount": 2
```

---

#### POST /api/auth/validate-token

**Purpose**: Validate refresh token status  
**Authentication**: Public endpoint  

**Tags for Endpoint**:
`@API @endpoint:auth-validate-token @action:POST @status:optional @type:token-validation`

```gherkin
Feature: Token Validation API

  @API @endpoint:auth-validate-token @action:POST @type:happy-path @status:optional
  Scenario: Validate valid refresh token
    Given I have a valid refresh token in cookies
    When I send POST /api/auth/validate-token
    Then I should receive status code 200
    And the response should contain "valid": true
    And the response should contain success message

  @API @endpoint:auth-validate-token @action:POST @type:error-case @status:optional
  Scenario: Validate missing refresh token
    Given I have no refresh token in cookies
    When I send POST /api/auth/validate-token
    Then I should receive status code 200
    And the response should contain "valid": false
    And the response should indicate no refresh token found
```

---

## Error Handling and Status Codes

### Tags:
`@API @type:error-handling @status:critical`

```gherkin
Feature: Authentication API Error Handling

  @API @type:error-handling @action:any @status:critical
  Scenario: Handle unauthorized access to protected endpoints
    When I send a request to any protected endpoint without valid token
    Then I should receive 401 Unauthorized
    And the response should contain appropriate error message

  @API @type:error-handling @action:POST @status:critical
  Scenario: Handle validation errors on registration
    When I send registration request with missing required fields
    Then I should receive 400 Bad Request
    And the response should contain validation error details

  @API @type:error-handling @action:POST @status:critical
  Scenario: Handle conflict on duplicate email registration
    When I send registration request with existing email
    Then I should receive 409 Conflict
    And the response should indicate email already registered
```

---

## Security Requirements

### Tags:
`@API @type:security @status:critical`

```gherkin
Feature: Authentication Security

  @API @type:security @action:POST @status:critical
  Scenario: Refresh tokens are HTTP-only cookies
    When I receive authentication response
    Then refresh token should be set as HTTP-only cookie
    And refresh token should not be accessible via JavaScript
    And cookie should have secure flag in production

  @API @type:security @action:POST @status:critical
  Scenario: Password hashing validation
    When I register or change password
    Then the password should be bcrypt hashed before storage
    And plain text password should never be stored
    And password should never be returned in API responses

  @API @type:security @action:POST @status:critical
  Scenario: Rate limiting protection
    When I exceed rate limits for any endpoint
    Then I should receive 429 Too Many Requests
    And subsequent requests should be blocked temporarily
```

---

## Performance Requirements

### Tags:
`@API @type:performance @status:optional`

```gherkin
Feature: Authentication API Performance

  @API @type:performance @action:POST @status:optional
  Scenario: Login response time
    When I send valid login request
    Then response time should be less than 500ms
    And JWT token generation should be efficient

  @API @type:performance @action:POST @status:optional
  Scenario: Token refresh performance
    When I refresh access token
    Then response time should be less than 200ms
    And refresh token validation should be optimized
```