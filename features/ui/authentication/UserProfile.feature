# Extended BDD Template for UI Components with Tags

## Component Overview

**Component Name**: `UserProfile`  
**CSS Selector**: `.user-profile`  
**Location**: `/profile` or sidebar component  
**Purpose**: Display and manage user profile information with avatar and account settings

### Tags for Component
`@UI @component:UserProfile @status:critical`

---

## Component Structure

```typescript
interface UserProfileProps {
  user: User;
  onUpdate: (userData: Partial<User>) => Promise<void>;
  isEditable?: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  avatarUrl?: string;
}
```

---

## UI Elements & Layout

### Profile Display View
- **User Avatar**: Profile image or initials display
- **User Name**: Display name with edit capability
- **Email Address**: User email (read-only)
- **Member Since**: Account creation date
- **Account Status**: Active/inactive indicator
- **Edit Button**: Toggle edit mode

### Edit Mode View
- **Name Input**: Editable name field
- **Avatar Upload**: Profile image upload/change
- **Save Button**: Confirm changes
- **Cancel Button**: Discard changes

---

## Component Behaviors

### Feature Block 1: Profile Display
```gherkin
Feature: Profile Display

  @UI @component:UserProfile @feature:display @type:happy-path @action:view @status:critical
  Scenario: Display user profile information
    Given I am logged in as user "john@example.com"
    When I view my user profile
    Then I should see my name "John Doe"
    And I should see my email "john@example.com"
    And I should see my account status as "Active"
    And I should see "Member since" with my registration date

  @UI @component:UserProfile @feature:display @type:typical @action:view @status:critical
  Scenario: Display user avatar or initials
    Given I am viewing my user profile
    When I have no custom avatar uploaded
    Then I should see my initials "JD" in the avatar space
    And the initials should be generated from my name "John Doe"
    And the avatar should have appropriate styling

  @UI @component:UserProfile @feature:display @type:typical @action:view @status:optional
  Scenario: Display custom avatar
    Given I have uploaded a custom avatar
    When I view my profile
    Then I should see my custom avatar image
    And the image should be properly sized and centered
```

---

### Feature Block 2: Profile Editing
```gherkin
Feature: Profile Editing

  @UI @component:UserProfile @feature:editing @type:happy-path @action:edit @status:critical
  Scenario: Edit profile name
    Given I am viewing my profile in display mode
    When I click the "Edit" button
    Then I should see the name field become editable
    And I should see "Save" and "Cancel" buttons
    When I change my name to "John Smith"
    And I click "Save"
    Then my profile should be updated with the new name
    And I should see a success confirmation message

  @UI @component:UserProfile @feature:editing @type:error-case @action:edit @status:critical
  Scenario: Cancel profile editing
    Given I am in profile edit mode
    And I have made changes to my name
    When I click the "Cancel" button
    Then my changes should be discarded
    And I should return to display mode
    And my original name should be restored

  @UI @component:UserProfile @feature:editing @type:validation @action:edit @status:critical
  Scenario: Validate required profile fields
    Given I am editing my profile
    When I try to save with an empty name
    Then I should see a validation error "Name is required"
    And the save button should be disabled
    And I should remain in edit mode
```

---

## Error Handling

### Validation and Error Handling
```gherkin
Feature: Validation and Error Handling

  @UI @component:UserProfile @type:validation @action:save @status:critical
  Scenario: Handle profile update errors
    Given I am editing my profile
    When I submit valid changes
    But the server returns an update error
    Then I should see an error message
    And I should remain in edit mode with my changes
    And I should be able to retry the save operation

  @UI @component:UserProfile @type:validation @action:upload @status:optional
  Scenario: Avatar upload validation
    Given I am uploading a new avatar
    When I select a file larger than 5MB
    Then I should see an error "File size must be less than 5MB"
    And the upload should not proceed
    And I should be able to select a different file
```

---

## Performance Requirements

### Tags:
`@UI @component:UserProfile @type:performance @status:optional`

```gherkin
Feature: Performance Monitoring

  @UI @component:UserProfile @type:performance @action:load @status:optional
  Scenario: Profile load performance
    When I navigate to my profile page
    Then the UserProfile component should load within 300ms
    And avatar/initials should render immediately
```

---

## Accessibility Requirements

### Tags:
`@UI @component:UserProfile @type:accessibility @status:critical`

```gherkin
Feature: Accessibility Compliance

  @UI @component:UserProfile @type:accessibility @action:navigation @status:critical
  Scenario: Keyboard navigation in edit mode
    When I enter edit mode using keyboard
    Then I should be able to navigate between form fields using Tab
    And I should be able to save changes using Enter
    And I should be able to cancel using Escape

  @UI @component:UserProfile @type:accessibility @action:screen-reader @status:critical
  Scenario: Screen reader support for profile data
    When I use a screen reader on the profile
    Then all profile information should be properly announced
    And edit mode transitions should be communicated
    And form validation errors should be announced immediately
```

---

## Integration Requirements

### Tags:
`@UI @component:UserProfile @type:integration @status:critical`

```gherkin
Feature: API Integration

  @UI @component:UserProfile @type:integration @action:update @status:critical
  Scenario: Update profile via API
    When I save profile changes
    Then it should call PUT /users/profile
    And send updated user data in request body
    And update local user state on success

  @UI @component:UserProfile @type:integration @action:upload @status:optional
  Scenario: Avatar upload integration
    When I upload a new avatar
    Then it should call POST /users/avatar
    And send file as multipart form data
    And update avatar URL on successful upload
```

---

## Dependencies

### Tags:
`@UI @component:UserProfile @type:dependency @status:optional`

- Required Services: `useUser`, `useFileUpload`
- Sub-Components: `Avatar`, `EditableField`, `Button`, `FileUpload`

---

## Data Mapping

### Tags:
`@UI @component:UserProfile @type:data-mapping @status:critical`

```gherkin
Feature: User Data Mapping

  @UI @component:UserProfile @type:data-mapping @action:display @status:critical
  Scenario: Map user data to UI elements
    Given user data from database
      | Field      | Value                  | UI Element          | Transform                    |
      | name       | John Doe               | .user-name          | None                         |
      | email      | john@example.com       | .user-email         | None                         |
      | createdAt  | 2024-01-15T10:30:00Z   | .member-since       | format_relative_date()       |
      | isActive   | true                   | .status-indicator   | IF(active, 'Active', 'Away') |
    When the component renders
    Then all mapped data should display correctly
    And transforms should be applied appropriately
```