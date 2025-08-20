# Extended BDD Template for UI Components with Tags

## Component Overview

**Component Name**: `WorkflowCard`  
**CSS Selector**: `.workflow-card`  
**Location**: `/workflows` (workflow listing page)  
**Purpose**: Display workflow summary information with status, actions, and quick access to execution

### Tags for Component
`@UI @component:WorkflowCard @status:critical`

---

## Component Structure

```typescript
interface WorkflowCardProps {
  workflow: Workflow;
  onEdit: (workflowId: string) => void;
  onExecute: (workflowId: string) => void;
  onDelete: (workflowId: string) => void;
  onToggleActive: (workflowId: string, isActive: boolean) => void;
  showExecutionStatus?: boolean;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isTemplate: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
  lastExecution?: Execution;
  executionCount: number;
}
```

---

## UI Elements & Layout

### Card Header
- **Workflow Name**: Main title with edit link
- **Status Badge**: Active/Draft indicator with color coding
- **Version Badge**: Current version number
- **Template Badge**: Template workflow indicator

### Card Body
- **Description**: Workflow description (truncated if long)
- **Project Badge**: Associated project with color
- **Last Modified**: Relative timestamp
- **Execution Stats**: Success rate and run count

### Card Footer
- **Execute Button**: Primary action to run workflow
- **Edit Button**: Navigate to workflow editor
- **More Actions Menu**: Delete, duplicate, export options
- **Last Run Indicator**: Status of most recent execution

---

## Component Behaviors

### Feature Block 1: Workflow Display
```gherkin
Feature: Workflow Display

  @UI @component:WorkflowCard @feature:display @type:happy-path @action:view @status:critical
  Scenario: Display workflow card information
    Given I have a workflow "Data Processing Pipeline"
    With description "Automated ETL workflow for customer data"
    And status "Active"
    And version 3
    When I view the workflow card
    Then I should see the workflow name "Data Processing Pipeline"
    And I should see the description truncated to 150 characters
    And I should see an "Active" status badge in green
    And I should see version badge "v3"

  @UI @component:WorkflowCard @feature:display @type:typical @action:view @status:critical
  Scenario: Display template workflow
    Given I have a workflow marked as template
    When I view the workflow card
    Then I should see a "Template" badge
    And the template badge should be visually distinct
    And I should see options to clone the template

  @UI @component:WorkflowCard @feature:display @type:typical @action:view @status:optional
  Scenario: Display execution statistics
    Given a workflow has been executed 25 times
    With 20 successful executions
    When I view the workflow card
    Then I should see "80% Success Rate"
    And I should see "25 executions"
    And execution stats should be prominently displayed
```

---

### Feature Block 2: Workflow Actions
```gherkin
Feature: Workflow Actions

  @UI @component:WorkflowCard @feature:actions @type:happy-path @action:execute @status:critical
  Scenario: Execute workflow from card
    Given I have an active workflow card
    When I click the "Execute" button
    Then the workflow execution should start
    And I should see a loading indicator
    And the execute button should be disabled during execution
    And I should receive confirmation when execution starts

  @UI @component:WorkflowCard @feature:actions @type:happy-path @action:edit @status:critical
  Scenario: Navigate to workflow editor
    Given I am viewing a workflow card
    When I click the "Edit" button or workflow name
    Then I should navigate to the workflow editor
    And the URL should be "/workflows/{id}/editor"
    And the workflow should open in edit mode

  @UI @component:WorkflowCard @feature:actions @type:typical @action:toggle @status:critical
  Scenario: Toggle workflow active status
    Given I have a draft workflow
    When I toggle the active status switch
    Then the workflow should become active
    And the status badge should change to "Active"
    And the workflow should be available for execution
```

---

### Feature Block 3: Context Menu Actions
```gherkin
Feature: Context Menu Actions

  @UI @component:WorkflowCard @feature:context-menu @type:typical @action:delete @status:critical
  Scenario: Delete workflow
    Given I am viewing a workflow card
    When I click the more actions menu
    And I select "Delete"
    Then I should see a confirmation dialog
    When I confirm the deletion
    Then the workflow should be removed
    And the card should disappear from the list

  @UI @component:WorkflowCard @feature:context-menu @type:typical @action:duplicate @status:optional
  Scenario: Duplicate workflow
    Given I am viewing a workflow card
    When I click the more actions menu
    And I select "Duplicate"
    Then a new workflow should be created
    And the new workflow should have "(Copy)" appended to the name
    And I should see the new workflow card in the list

  @UI @component:WorkflowCard @feature:context-menu @type:typical @action:export @status:optional
  Scenario: Export workflow
    When I click the more actions menu
    And I select "Export"
    Then I should be able to download the workflow definition
    And the export should be in JSON format
    And include all workflow metadata
```

---

## Error Handling

### Validation and Error Handling
```gherkin
Feature: Validation and Error Handling

  @UI @component:WorkflowCard @type:error-case @action:execute @status:critical
  Scenario: Handle execution errors
    Given I have a workflow with configuration issues
    When I try to execute the workflow
    Then I should see an error message
    And the error should be specific and actionable
    And I should be guided to fix the issues

  @UI @component:WorkflowCard @type:error-case @action:load @status:critical
  Scenario: Handle missing workflow data
    Given a workflow card has incomplete data
    When the card renders
    Then placeholder content should be shown for missing fields
    And the card should remain functional
    And appropriate fallback values should be displayed
```

---

## Performance Requirements

### Tags:
`@UI @component:WorkflowCard @type:performance @status:optional`

```gherkin
Feature: Performance Monitoring

  @UI @component:WorkflowCard @type:performance @action:load @status:optional
  Scenario: Card rendering performance
    Given a list of 100 workflow cards
    When the workflow list page loads
    Then each card should render within 50ms
    And the entire list should be interactive within 1 second
    And scrolling should be smooth with no lag
```

---

## Accessibility Requirements

### Tags:
`@UI @component:WorkflowCard @type:accessibility @status:critical`

```gherkin
Feature: Accessibility Compliance

  @UI @component:WorkflowCard @type:accessibility @action:navigation @status:critical
  Scenario: Keyboard navigation support
    When I navigate workflow cards using keyboard
    Then I should be able to reach all interactive elements
    And card actions should be accessible via keyboard
    And focus indicators should be clearly visible

  @UI @component:WorkflowCard @type:accessibility @action:screen-reader @status:critical
  Scenario: Screen reader support
    When I use a screen reader on workflow cards
    Then all workflow information should be announced
    And card status and actions should be clearly described
    And the relationship between elements should be clear
```

---

## Integration Requirements

### Tags:
`@UI @component:WorkflowCard @type:integration @status:critical`

```gherkin
Feature: API Integration

  @UI @component:WorkflowCard @type:integration @action:execute @status:critical
  Scenario: Execute workflow via API
    When I click execute on a workflow card
    Then it should call POST /workflows/{id}/execute
    And receive execution ID in response
    And update card with execution status

  @UI @component:WorkflowCard @type:integration @action:update @status:critical
  Scenario: Update workflow status
    When I toggle the workflow active status
    Then it should call PATCH /workflows/{id}
    And send updated isActive value
    And update local state on success
```

---

## Dependencies

### Tags:
`@UI @component:WorkflowCard @type:dependency @status:optional`

- Required Services: `useWorkflows`, `useExecutions`
- Sub-Components: `StatusBadge`, `VersionBadge`, `ProjectBadge`, `ActionMenu`, `ConfirmDialog`

---

## Data Mapping

### Tags:
`@UI @component:WorkflowCard @type:data-mapping @status:critical`

```gherkin
Feature: Workflow Data Mapping

  @UI @component:WorkflowCard @type:data-mapping @action:display @status:critical
  Scenario: Map workflow data to card elements
    Given workflow data from database
      | Field           | Value                    | UI Element              | Transform                        |
      | name            | Data Processing Pipeline | .workflow-title         | None                             |
      | isActive        | true                     | .status-badge           | IF(active, 'Active', 'Draft')    |
      | version         | 3                        | .version-badge          | "v" + version                    |
      | updatedAt       | 2024-08-10T14:30:00Z     | .last-modified          | time_ago(updatedAt)              |
      | description     | Long description text... | .workflow-description   | truncate(description, 150)       |
      | executionCount  | 25                       | .execution-count        | count + " executions"            |
    When the card renders
    Then all mapped data should display correctly
    And transforms should be applied appropriately

  @UI @component:WorkflowCard @type:data-mapping @action:display @status:critical
  Scenario: Map execution data to status indicators
    Given workflow with last execution data
      | Field               | Value     | UI Element           | Transform                   |
      | lastExecution.status| SUCCESS   | .last-run-indicator  | status_to_color_badge()     |
      | lastExecution.startTime| 2 hours ago | .last-run-time  | relative_time_format()      |
    When the card displays execution status
    Then execution indicators should show current status
    And timestamps should be human-readable
```