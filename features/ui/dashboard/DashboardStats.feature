# Extended BDD Template for UI Components with Tags

## Component Overview

**Component Name**: `DashboardStats`  
**CSS Selector**: `.dashboard-stats`  
**Location**: `/dashboard` (main dashboard page)  
**Purpose**: Display key platform metrics and statistics with real-time updates and trend indicators

### Tags for Component
`@UI @component:DashboardStats @status:critical`

---

## Component Structure

```typescript
interface DashboardStatsProps {
  userId?: string;
  timeRange?: TimeRange;
  onStatsClick?: (statType: StatType) => void;
  refreshInterval?: number;
  showTrends?: boolean;
}

interface DashboardStatsData {
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  todayRuns: number;
  trends: StatTrends;
}

interface StatTrends {
  activeWorkflows: TrendDirection;
  successRate: TrendDirection;
  avgDuration: TrendDirection;
  todayRuns: TrendDirection;
}

type TrendDirection = 'up' | 'down' | 'stable';
```

---

## UI Elements & Layout

### Stats Cards Grid
- **Active Workflows**: Count of currently active workflows with trend
- **Success Rate**: Percentage of successful executions with trend
- **Average Duration**: Mean execution time with trend
- **Today's Executions**: Executions started today with trend
- **Total Executions**: All-time execution count

### Trend Indicators
- **Trend Arrows**: Up/down arrows for metric changes
- **Percentage Change**: Numeric change from previous period
- **Trend Colors**: Green for positive, red for negative trends
- **Comparison Period**: Time period for trend calculation

### Interactive Elements
- **Clickable Stats**: Navigate to detailed views
- **Time Range Selector**: Filter stats by time period
- **Refresh Button**: Manual stats refresh
- **Auto-refresh Indicator**: Real-time update status

---

## Component Behaviors

### Feature Block 1: Stats Display
```gherkin
Feature: Stats Display

  @UI @component:DashboardStats @feature:display @type:happy-path @action:view @status:critical
  Scenario: Display current dashboard statistics
    Given the user has 5 active workflows
    And 150 total executions with 85% success rate
    And average execution duration of 2.3 seconds
    And 12 executions started today
    When I view the dashboard stats
    Then I should see "5 Active Workflows"
    And I should see "85% Success Rate"
    And I should see "2.3s Avg Duration"
    And I should see "12 Executions Today"
    And I should see "150 Total Executions"

  @UI @component:DashboardStats @feature:display @type:typical @action:view @status:critical
  Scenario: Display stats with trend indicators
    Given my success rate increased from 80% to 85%
    And my average duration decreased from 2.8s to 2.3s
    When I view the dashboard stats
    Then I should see an upward arrow next to success rate
    And I should see "+5%" trend indicator for success rate
    And I should see a downward arrow next to average duration
    And I should see "-0.5s" trend indicator for duration
    And trend colors should indicate positive/negative changes

  @UI @component:DashboardStats @feature:display @type:typical @action:view @status:optional
  Scenario: Display zero or empty states
    Given I am a new user with no workflows or executions
    When I view the dashboard stats
    Then I should see "0 Active Workflows"
    And I should see appropriate empty state messaging
    And I should see calls-to-action to create first workflow
    And trend indicators should not be shown for empty data
```

---

### Feature Block 2: Interactive Features
```gherkin
Feature: Interactive Features

  @UI @component:DashboardStats @feature:interaction @type:happy-path @action:navigate @status:critical
  Scenario: Navigate to detailed views
    Given I am viewing dashboard stats
    When I click on the "Active Workflows" stat card
    Then I should navigate to the workflows page
    And see filtered view of active workflows
    When I click on "Success Rate" stat
    Then I should see execution analytics or detailed reports

  @UI @component:DashboardStats @feature:interaction @type:typical @action:filter @status:optional
  Scenario: Change time range for stats
    Given I am viewing dashboard stats for "Last 30 days"
    When I change the time range to "Last 7 days"
    Then all stats should be recalculated for the new period
    And trend indicators should reflect the new time range
    And the selected period should be clearly displayed
    And stats should update without full page refresh

  @UI @component:DashboardStats @feature:interaction @type:typical @action:refresh @status:optional
  Scenario: Manual stats refresh
    When I click the refresh button
    Then stats should be fetched from the server
    And I should see a loading indicator during refresh
    And updated stats should replace the current values
    And the last update timestamp should be updated
```

---

### Feature Block 3: Real-time Updates
```gherkin
Feature: Real-time Updates

  @UI @component:DashboardStats @feature:realtime @type:happy-path @action:update @status:critical
  Scenario: Real-time stats updates
    Given I am viewing dashboard stats
    And auto-refresh is enabled
    When a workflow execution completes
    Then the execution count should increase automatically
    And success rate should be recalculated if applicable
    And trends should be updated based on new data
    And updates should happen without user intervention

  @UI @component:DashboardStats @feature:realtime @type:typical @action:update @status:optional
  Scenario: Smooth stats transitions
    When stats values change due to real-time updates
    Then numbers should animate smoothly to new values
    And trend arrows should animate direction changes
    And color changes should transition smoothly
    And updates should not be jarring or distracting

  @UI @component:DashboardStats @feature:realtime @type:error-case @action:reconnect @status:optional
  Scenario: Handle real-time connection issues
    Given real-time updates are enabled
    When the connection to real-time updates is lost
    Then I should see an indicator of stale data
    And the component should attempt automatic reconnection
    And when reconnected, stats should be refreshed immediately
```

---

## Error Handling

### Data Loading and Calculation
```gherkin
Feature: Data Loading and Calculation

  @UI @component:DashboardStats @type:error-case @action:load @status:critical
  Scenario: Handle stats loading errors
    Given the dashboard stats component is mounting
    When the stats API returns an error
    Then I should see appropriate error messaging
    And previous stats should remain visible if available
    And I should have options to retry loading
    And the error should not break other dashboard components

  @UI @component:DashboardStats @type:error-case @action:calculate @status:critical
  Scenario: Handle invalid or missing data
    Given stats data is returned with missing values
    When the component processes the data
    Then missing values should show as "N/A" or appropriate placeholder
    And calculations should handle null/undefined values gracefully
    And trends should not be shown for incomplete data
    And the component should remain functional

  @UI @component:DashboardStats @type:recovery @action:fallback @status:optional
  Scenario: Graceful degradation for calculation errors
    Given trend calculations fail due to data issues
    When the stats display
    Then basic stats should still be shown
    And trend indicators should be hidden for problematic metrics
    And error should be logged but not displayed to user
    And functionality should degrade gracefully
```

---

## Performance Requirements

### Tags:
`@UI @component:DashboardStats @type:performance @status:critical`

```gherkin
Feature: Performance Monitoring

  @UI @component:DashboardStats @type:performance @action:load @status:critical
  Scenario: Fast stats loading and calculation
    Given the dashboard has extensive execution history
    When I load the dashboard stats
    Then stats should be calculated and displayed within 1 second
    And trend calculations should not block the UI
    And subsequent updates should be even faster due to caching

  @UI @component:DashboardStats @type:performance @action:update @status:optional
  Scenario: Efficient real-time updates
    Given real-time stats updates are active
    When multiple executions complete simultaneously
    Then stats updates should be batched appropriately
    And the UI should remain responsive during updates
    And memory usage should remain stable over time
```

---

## Accessibility Requirements

### Tags:
`@UI @component:DashboardStats @type:accessibility @status:critical`

```gherkin
Feature: Accessibility Compliance

  @UI @component:DashboardStats @type:accessibility @action:navigation @status:critical
  Scenario: Keyboard navigation for stats cards
    When I navigate the dashboard stats using keyboard
    Then I should be able to reach all clickable stat cards
    And Tab order should be logical across the stats grid
    And I should be able to activate stats navigation with Enter

  @UI @component:DashboardStats @type:accessibility @action:announce @status:critical
  Scenario: Screen reader support for stats and trends
    When I use a screen reader with dashboard stats
    Then each stat should be announced with its value and description
    And trend directions should be communicated clearly
    And percentage changes should be announced meaningfully
    And real-time updates should be announced appropriately
```

---

## Integration Requirements

### Tags:
`@UI @component:DashboardStats @type:integration @status:critical`

```gherkin
Feature: API Integration

  @UI @component:DashboardStats @type:integration @action:fetch @status:critical
  Scenario: Load dashboard statistics
    When the stats component mounts
    Then it should call GET /dashboard/stats
    And optionally GET /dashboard/trends
    And handle time range parameters appropriately
    And cache results for performance

  @UI @component:DashboardStats @type:integration @action:websocket @status:optional
  Scenario: WebSocket integration for real-time stats
    Given the component subscribes to real-time updates
    When execution events occur
    Then it should receive relevant stat update events
    And recalculate affected metrics
    And update the display without full refresh
```

---

## Dependencies

### Tags:
`@UI @component:DashboardStats @type:dependency @status:critical`

- Required Services: `useDashboardStats`, `useWebSocket`, `useTimeRange`
- Sub-Components: `StatCard`, `TrendIndicator`, `TimeRangeSelector`, `LoadingSpinner`

---

## Data Mapping

### Tags:
`@UI @component:DashboardStats @type:data-mapping @status:critical`

```gherkin
Feature: Dashboard Statistics Data Mapping

  @UI @component:DashboardStats @type:data-mapping @action:display @status:critical
  Scenario: Map aggregated statistics to display
    Given dashboard statistics from API
      | Statistic                                            | Value | UI Element           | Display Format              |
      | COUNT(*) FROM workflows WHERE isActive=true         | 5     | .active-workflows    | "5 Active Workflows"        |
      | (SUCCESS_COUNT/TOTAL_COUNT)*100                      | 85    | .success-rate        | "85% Success Rate"          |
      | AVG(duration) FROM executions WHERE status='SUCCESS'| 2.3   | .avg-duration        | "2.3s Avg Duration"         |
      | COUNT(*) FROM executions WHERE DATE(start)=TODAY()  | 12    | .today-executions    | "12 Executions Today"       |
      | COUNT(*) FROM executions                             | 150   | .total-executions    | "150 Total Executions"      |
    When the stats component renders
    Then all statistics should be properly formatted and displayed
    And calculations should be accurate and up-to-date

  @UI @component:DashboardStats @type:data-mapping @action:trend @status:critical
  Scenario: Map trend calculations to indicators
    Given trend data for statistics
      | Metric        | Previous | Current | Change | UI Element        | Display                     |
      | successRate   | 80       | 85      | +5     | .success-trend    | Green arrow up, "+5%"       |
      | avgDuration   | 2.8      | 2.3     | -0.5   | .duration-trend   | Green arrow down, "-0.5s"   |
      | activeCount   | 4        | 5       | +1     | .active-trend     | Green arrow up, "+1"        |
    When trend indicators render
    Then all trend directions should be calculated correctly
    And trend colors should reflect positive/negative impact
    And percentage/absolute changes should be formatted appropriately
```