# Extended BDD Template for UI Components with Tags

## Component Overview

**Component Name**: `ProjectCard`  
**CSS Selector**: `.project-card`  
**Location**: `/projects` (project listing page)  
**Purpose**: Display project information with workflow count, color coding, and management actions

### Tags for Component
`@UI @component:ProjectCard @status:critical`

---

## Component Structure

```typescript
interface ProjectCardProps {
  project: Project;
  onEdit: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onArchive: (projectId: string) => void;
  onClick?: (projectId: string) => void;
  showWorkflowCount?: boolean;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  workflowCount: number;
  activeWorkflowCount: number;
}
```

---

## UI Elements & Layout

### Card Header
- **Project Name**: Main title with edit capability
- **Color Badge**: Project color indicator
- **Archive Badge**: Archived status indicator
- **Options Menu**: Edit, archive, delete actions

### Card Body
- **Description**: Project description (truncated if long)
- **Workflow Count**: Number of workflows in project
- **Active Workflows**: Count of active workflows
- **Last Modified**: Relative timestamp

### Card Footer
- **View Project Button**: Navigate to project workflows
- **Quick Actions**: Create workflow, project settings
- **Creation Date**: Project creation timestamp

---

## Component Behaviors

### Feature Block 1: Project Display
```gherkin
Feature: Project Display

  @UI @component:ProjectCard @feature:display @type:happy-path @action:view @status:critical
  Scenario: Display project card information
    Given I have a project "E-commerce Analytics"
    With description "Analytics workflows for e-commerce platform"
    And color "#3B82F6"
    And 12 total workflows
    And 8 active workflows
    When I view the project card
    Then I should see the project name "E-commerce Analytics"
    And I should see the description truncated to 150 characters
    And I should see a color badge with "#3B82F6" background
    And I should see "12 workflows (8 active)"

  @UI @component:ProjectCard @feature:display @type:typical @action:view @status:critical
  Scenario: Display archived project
    Given I have a project marked as archived
    When I view the project card
    Then I should see an "Archived" badge
    And the card should have muted/grayed styling
    And archived projects should be visually distinct from active ones

  @UI @component:ProjectCard @feature:display @type:typical @action:view @status:optional
  Scenario: Display empty project
    Given I have a project with no workflows
    When I view the project card
    Then I should see "0 workflows"
    And I should see a "Get Started" or "Create Workflow" call-to-action
    And the empty state should be encouraging for new users
```

---

### Feature Block 2: Project Navigation
```gherkin
Feature: Project Navigation

  @UI @component:ProjectCard @feature:navigation @type:happy-path @action:navigate @status:critical
  Scenario: Navigate to project workflows
    Given I am viewing a project card
    When I click the "View Project" button or project name
    Then I should navigate to the project workflows page
    And the URL should be "/projects/{id}/workflows"
    And I should see all workflows belonging to this project

  @UI @component:ProjectCard @feature:navigation @type:typical @action:create @status:optional
  Scenario: Quick workflow creation
    Given I am viewing a project card
    When I click the "Create Workflow" quick action
    Then I should navigate to the workflow creation page
    And the project should be pre-selected
    And the workflow should be automatically associated with this project
```

---

### Feature Block 3: Project Management
```gherkin
Feature: Project Management

  @UI @component:ProjectCard @feature:management @type:typical @action:edit @status:critical
  Scenario: Edit project details
    Given I am viewing a project card
    When I click the options menu and select "Edit"
    Then I should see a project edit dialog or navigate to edit page
    And I should be able to modify name, description, and color
    And changes should be reflected in the card after saving

  @UI @component:ProjectCard @feature:management @type:typical @action:archive @status:critical
  Scenario: Archive project
    Given I have an active project with workflows
    When I click the options menu and select "Archive"
    Then I should see a confirmation dialog
    When I confirm the archive action
    Then the project should be marked as archived
    And the "Archived" badge should appear
    And the card styling should change to archived state

  @UI @component:ProjectCard @feature:management @type:error-case @action:delete @status:critical
  Scenario: Delete project with workflows
    Given I have a project containing workflows
    When I try to delete the project
    Then I should see a warning about existing workflows
    And I should be required to confirm the destructive action
    And I should have the option to move workflows to another project
    Or confirm that workflows will be deleted with the project
```

---

## Error Handling

### Validation and Error Handling
```gherkin
Feature: Validation and Error Handling

  @UI @component:ProjectCard @type:error-case @action:load @status:critical
  Scenario: Handle missing project data
    Given a project card has incomplete data
    When the card renders
    Then placeholder content should be shown for missing fields
    And the card should remain functional with available data
    And appropriate fallback values should be displayed

  @UI @component:ProjectCard @type:error-case @action:update @status:critical
  Scenario: Handle project update errors
    Given I am editing project details
    When the save operation fails due to server error
    Then I should see an appropriate error message
    And my changes should be preserved in the form
    And I should be able to retry the save operation
    And the card should not be corrupted by the failed update
```

---

## Performance Requirements

### Tags:
`@UI @component:ProjectCard @type:performance @status:optional`

```gherkin
Feature: Performance Monitoring

  @UI @component:ProjectCard @type:performance @action:load @status:optional
  Scenario: Card rendering performance
    Given a list of 50 project cards
    When the projects page loads
    Then each card should render within 50ms
    And the entire page should be interactive within 1 second
    And scrolling through cards should be smooth

  @UI @component:ProjectCard @type:performance @action:interaction @status:optional
  Scenario: Quick action responsiveness
    When I interact with project card actions
    Then button clicks should respond within 100ms
    And hover effects should be immediate
    And no UI lag should be noticeable during interactions
```

---

## Accessibility Requirements

### Tags:
`@UI @component:ProjectCard @type:accessibility @status:critical`

```gherkin
Feature: Accessibility Compliance

  @UI @component:ProjectCard @type:accessibility @action:navigation @status:critical
  Scenario: Keyboard navigation support
    When I navigate project cards using keyboard
    Then I should be able to reach all interactive elements
    And Tab order should be logical and predictable
    And I should be able to activate actions using Enter or Space
    And focus indicators should be clearly visible

  @UI @component:ProjectCard @type:accessibility @action:screen-reader @status:critical
  Scenario: Screen reader support
    When I use a screen reader on project cards
    Then all project information should be announced clearly
    And the project color should be described meaningfully
    And workflow counts should be communicated effectively
    And card actions should be clearly labeled
```

---

## Integration Requirements

### Tags:
`@UI @component:ProjectCard @type:integration @status:critical`

```gherkin
Feature: API Integration

  @UI @component:ProjectCard @type:integration @action:update @status:critical
  Scenario: Update project via API
    When I save changes to project details
    Then it should call PUT /projects/{id}
    And send updated project data in request body
    And update local project state on success
    And handle validation errors appropriately

  @UI @component:ProjectCard @type:integration @action:archive @status:critical
  Scenario: Archive project via API
    When I archive a project
    Then it should call PATCH /projects/{id}/archive
    And update the project's archived status
    And refresh the card display to show archived state
```

---

## Dependencies

### Tags:
`@UI @component:ProjectCard @type:dependency @status:optional`

- Required Services: `useProjects`, `useConfirmation`
- Sub-Components: `ColorBadge`, `ArchiveBadge`, `OptionsMenu`, `ConfirmDialog`, `ProjectEditModal`

---

## Data Mapping

### Tags:
`@UI @component:ProjectCard @type:data-mapping @status:critical`

```gherkin
Feature: Project Data Mapping

  @UI @component:ProjectCard @type:data-mapping @action:display @status:critical
  Scenario: Map project data to card elements
    Given project data from database
      | Field              | Value                    | UI Element              | Transform                      |
      | name               | E-commerce Analytics     | .project-title          | None                           |
      | color              | #3B82F6                  | .color-badge            | hex_to_css_background()        |
      | isArchived         | true                     | .archive-badge          | IF(archived, 'Archived', '')   |
      | description        | Long description text... | .project-description    | truncate(description, 150)     |
      | workflowCount      | 12                       | .workflow-count         | count + " workflows"           |
      | activeWorkflowCount| 8                        | .active-count           | "(" + count + " active)"       |
      | updatedAt          | 2024-08-10T14:30:00Z     | .last-modified          | time_ago(updatedAt)            |
    When the card renders
    Then all mapped data should display correctly
    And transforms should be applied appropriately

  @UI @component:ProjectCard @type:data-mapping @action:style @status:critical
  Scenario: Apply color theming
    Given a project with color "#E11D48"
    When the card renders
    Then the color badge should use the project color as background
    And the card border or accent should reflect the project color
    And hover states should use a lighter shade of the project color
    And the color should be accessible with sufficient contrast
```

---

## Color Management

### Tags:
`@UI @component:ProjectCard @type:color-management @status:optional`

```gherkin
Feature: Color Management

  @UI @component:ProjectCard @feature:color @type:typical @action:display @status:optional
  Scenario: Display project color consistently
    Given projects with different color values
    When I view project cards
    Then each project color should be displayed consistently
    And colors should be accessible with proper contrast
    And color combinations should be visually pleasing

  @UI @component:ProjectCard @feature:color @type:validation @action:validate @status:optional
  Scenario: Handle invalid color values
    Given a project with an invalid color value
    When the card renders
    Then a default color should be used
    And the card should remain functional
    And the invalid color should not break the display
```