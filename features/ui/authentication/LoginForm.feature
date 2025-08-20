# Extended BDD Template for UI Components with Tags

## Component Overview

**Component Name**: `LoginForm`  
**CSS Selector**: `.login-form`  
**Location**: `/login`  
**Purpose**: User authentication form with email/password validation and JWT token management

### Tags for Component
`@UI @component:LoginForm @status:critical`

---

## Component Structure

```typescript
interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

---

## UI Elements & Layout

### Primary View
- **Email Input**: Email address input field with validation
- **Password Input**: Password input field with visibility toggle
- **Remember Me Checkbox**: Session persistence option
- **Login Button**: Submit form with loading state
- **Error Message**: Authentication error display
- **Forgot Password Link**: Password recovery navigation

### Loading State
- **Spinner**: Loading indicator during authentication
- **Disabled Form**: Form inputs disabled during submission

---

## Component Behaviors

### Feature Block 1: User Authentication
```gherkin
Feature: User Authentication

  @UI @component:LoginForm @feature:authentication @type:happy-path @action:login @status:critical
  Scenario: Successful login with valid credentials
    Given I am on the login page
    And I see the LoginForm component
    When I enter valid email "user@example.com"
    And I enter valid password "SecurePassword123"
    And I click the "Login" button
    Then I should see a loading spinner
    And I should be redirected to the dashboard
    And I should see a welcome message

  @UI @component:LoginForm @feature:authentication @type:error-case @action:login @status:critical
  Scenario: Login with invalid credentials
    Given I am on the login page
    When I enter invalid email "invalid@example.com"
    And I enter invalid password "wrongpassword"
    And I click the "Login" button
    Then I should see an error message "Invalid email or password"
    And I should remain on the login page
    And the form should be ready for retry

  @UI @component:LoginForm @feature:authentication @type:validation @action:input @status:critical
  Scenario: Email validation
    Given I am on the login page
    When I enter an invalid email format "notanemail"
    And I try to submit the form
    Then I should see a validation error "Please enter a valid email address"
    And the Login button should be disabled
```

---

### Feature Block 2: Form Interaction
```gherkin
Feature: Form Interaction

  @UI @component:LoginForm @feature:form-interaction @type:typical @action:use @status:optional
  Scenario: Remember me functionality
    Given I am on the login page
    When I check the "Remember me" checkbox
    And I complete a successful login
    Then my session should persist for extended period
    And I should not need to login again on next visit

  @UI @component:LoginForm @feature:form-interaction @type:typical @action:navigate @status:optional
  Scenario: Forgot password navigation
    Given I am on the login page
    When I click the "Forgot Password" link
    Then I should be redirected to password recovery page
    And the URL should be "/forgot-password"
```

---

## Error Handling

### Validation and Error Handling
```gherkin
Feature: Validation and Error Handling

  @UI @component:LoginForm @type:validation @action:submit @status:critical
  Scenario: Require email and password fields
    Given I am on the login page
    When I try to submit without entering email or password
    Then I should see validation error messages
    And the login button should remain disabled
    And the form should highlight required fields

  @UI @component:LoginForm @type:error-case @action:submit @status:critical
  Scenario: Handle server authentication errors
    Given I am on the login page
    When I submit valid form data
    But the server returns authentication error
    Then I should see the server error message
    And the form should remain accessible for retry
    And the password field should be cleared for security
```

---

## Performance Requirements

### Tags:
`@UI @component:LoginForm @type:performance @status:optional`

```gherkin
Feature: Performance Monitoring

  @UI @component:LoginForm @type:performance @action:load @status:optional
  Scenario: Login form load performance
    When I navigate to the login page
    Then the LoginForm should render within 200ms
    And all form elements should be interactive immediately
```

---

## Accessibility Requirements

### Tags:
`@UI @component:LoginForm @type:accessibility @status:critical`

```gherkin
Feature: Accessibility Compliance

  @UI @component:LoginForm @type:accessibility @action:navigation @status:critical
  Scenario: Keyboard navigation support
    When I navigate the login form using Tab key
    Then I should reach all interactive elements in logical order
    And I should be able to submit using Enter key
    And focus indicators should be clearly visible

  @UI @component:LoginForm @type:accessibility @action:screen-reader @status:critical
  Scenario: Screen reader support
    When I use a screen reader on the login form
    Then all form fields should have proper labels
    And error messages should be announced
    And the form purpose should be clearly communicated
```

---

## Integration Requirements

### Tags:
`@UI @component:LoginForm @type:integration @status:critical`

```gherkin
Feature: API Integration

  @UI @component:LoginForm @type:integration @action:submit @status:critical
  Scenario: Authentication API integration
    When I submit valid login credentials
    Then it should call POST /auth/login
    And receive JWT access and refresh tokens
    And store tokens securely in browser storage

  @UI @component:LoginForm @type:integration @action:error-handling @status:critical
  Scenario: Handle API error responses
    When the authentication API returns error status
    Then the form should display appropriate error message
    And retry functionality should remain available
    And sensitive data should not be logged
```

---

## Dependencies

### Tags:
`@UI @component:LoginForm @type:dependency @status:optional`

- Required Services: `useAuth`, `useValidation`
- Sub-Components: `Input`, `Button`, `ErrorMessage`, `LoadingSpinner`

---

## Security Requirements

### Tags:
`@UI @component:LoginForm @type:security @status:critical`

```gherkin
Feature: Security Compliance

  @UI @component:LoginForm @type:security @action:input @status:critical
  Scenario: Password field security
    Given I am entering my password
    When I type in the password field
    Then the password should be masked by default
    And autocomplete should be set to "current-password"
    And the field should not expose password in DOM

  @UI @component:LoginForm @type:security @action:submit @status:critical
  Scenario: Secure credential transmission
    When I submit the login form
    Then credentials should be transmitted over HTTPS only
    And passwords should not be stored in browser history
    And form data should be cleared after submission
```