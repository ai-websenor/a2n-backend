# Extended BDD Template for UI Components with Tags

## Component Overview

**Component Name**: `LogViewer`  
**CSS Selector**: `.log-viewer`  
**Location**: `/executions/:id/logs` or embedded in execution detail  
**Purpose**: Real-time streaming display of execution logs with filtering and search capabilities

### Tags for Component
`@UI @component:LogViewer @status:critical`

---

## Component Structure

```typescript
interface LogViewerProps {
  executionId: string;
  autoScroll?: boolean;
  logLevels?: LogLevel[];
  onLogClick?: (log: ExecutionLog) => void;
  maxDisplayLines?: number;
  searchTerm?: string;
}

interface ExecutionLog {
  id: string;
  executionId: string;
  nodeId?: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: LogMetadata;
}

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
```

---

## UI Elements & Layout

### Header Controls
- **Log Level Filter**: Toggle buttons for DEBUG, INFO, WARN, ERROR
- **Search Box**: Real-time log message filtering
- **Auto-scroll Toggle**: Enable/disable automatic scrolling
- **Clear Logs**: Clear current log display
- **Export Logs**: Download logs as file

### Log Display Area
- **Log Entries**: Scrollable list of log messages
- **Log Entry**: Timestamp, level icon, node info, message
- **Line Numbers**: Optional line numbering
- **Syntax Highlighting**: Color coding by log level

### Footer Status
- **Log Count**: Total and filtered log counts
- **Connection Status**: Real-time streaming indicator
- **Last Update**: Timestamp of most recent log

---

## Component Behaviors

### Feature Block 1: Log Display
```gherkin
Feature: Log Display

  @UI @component:LogViewer @feature:display @type:happy-path @action:view @status:critical
  Scenario: Display execution logs in real-time
    Given I am viewing logs for an active execution
    When new log entries are generated
    Then they should appear in the log viewer immediately
    And the logs should be ordered by timestamp
    And each log should show level, timestamp, and message
    And different log levels should have distinct visual styling

  @UI @component:LogViewer @feature:display @type:typical @action:view @status:critical
  Scenario: Display log entry details
    Given I am viewing execution logs
    When I see a log entry with timestamp "2024-08-12 10:30:15"
    And log level "ERROR"
    And message "Database connection failed"
    Then the log should display with error styling (red color)
    And the timestamp should be formatted consistently
    And the message should be fully readable

  @UI @component:LogViewer @feature:display @type:typical @action:scroll @status:critical
  Scenario: Auto-scroll to latest logs
    Given auto-scroll is enabled
    And I am viewing logs for a running execution
    When new log entries arrive
    Then the log viewer should automatically scroll to the bottom
    And the latest logs should always be visible
    But if I manually scroll up, auto-scroll should be temporarily disabled
```

---

### Feature Block 2: Log Filtering
```gherkin
Feature: Log Filtering

  @UI @component:LogViewer @feature:filtering @type:happy-path @action:filter @status:critical
  Scenario: Filter logs by level
    Given I am viewing logs with multiple levels
    When I click to disable "DEBUG" level logs
    Then DEBUG logs should be hidden from the display
    And only INFO, WARN, ERROR, and FATAL logs should be visible
    And the log count should update to reflect filtered results
    And the filter state should be visually indicated

  @UI @component:LogViewer @feature:filtering @type:typical @action:search @status:critical
  Scenario: Search logs by message content
    Given I have logs containing various messages
    When I enter "database" in the search box
    Then only logs containing "database" should be displayed
    And matching text should be highlighted in results
    And the search should be case-insensitive
    And the log count should show filtered results

  @UI @component:LogViewer @feature:filtering @type:typical @action:filter @status:optional
  Scenario: Filter logs by node
    Given I have logs from multiple workflow nodes
    When I filter by a specific node ID
    Then only logs from that node should be displayed
    And the node filter should be clearly indicated
    And I should be able to clear the node filter easily
```

---

### Feature Block 3: Log Management
```gherkin
Feature: Log Management

  @UI @component:LogViewer @feature:management @type:typical @action:clear @status:optional
  Scenario: Clear log display
    Given I am viewing accumulated logs
    When I click the "Clear Logs" button
    Then all currently displayed logs should be removed
    And the log viewer should be empty
    But new incoming logs should continue to display
    And the action should not affect the actual log storage

  @UI @component:LogViewer @feature:management @type:typical @action:export @status:optional
  Scenario: Export logs to file
    Given I am viewing execution logs
    When I click the "Export Logs" button
    Then I should be able to download logs as a text file
    And the export should include timestamp, level, and message
    And the filename should include execution ID and timestamp
    And export should respect current filters

  @UI @component:LogViewer @feature:management @type:typical @action:select @status:optional
  Scenario: Select and copy log entries
    Given I am viewing logs
    When I click on a log entry
    Then the log entry should be selected/highlighted
    And I should be able to copy the log message
    And I should be able to select multiple log entries
    And selection should support keyboard shortcuts
```

---

## Error Handling

### Streaming and Connection Issues
```gherkin
Feature: Streaming and Connection Issues

  @UI @component:LogViewer @type:error-case @action:reconnect @status:critical
  Scenario: Handle log streaming interruption
    Given I am viewing real-time logs
    When the log streaming connection is interrupted
    Then I should see a "Connection Lost" indicator
    And the log viewer should attempt to reconnect automatically
    And when reconnected, missed logs should be fetched and displayed
    And I should be notified of the reconnection

  @UI @component:LogViewer @type:error-case @action:load @status:critical
  Scenario: Handle log loading errors
    Given I am trying to view execution logs
    When the log loading fails due to server error
    Then I should see an appropriate error message
    And I should have options to retry loading
    And previously loaded logs should remain visible
    And the error should not break other log viewer functionality

  @UI @component:LogViewer @type:performance @action:manage @status:optional
  Scenario: Handle large log volumes
    Given an execution generates thousands of log entries
    When the logs exceed the display limit
    Then older logs should be automatically pruned
    And I should see an indicator of log truncation
    And performance should remain acceptable
    And I should have options to view full logs
```

---

## Performance Requirements

### Tags:
`@UI @component:LogViewer @type:performance @status:critical`

```gherkin
Feature: Performance Monitoring

  @UI @component:LogViewer @type:performance @action:stream @status:critical
  Scenario: Handle high-frequency log streaming
    Given an execution generating 100+ logs per second
    When logs stream to the viewer
    Then the UI should remain responsive
    And log updates should be batched to prevent excessive renders
    And memory usage should remain stable
    And scrolling should remain smooth

  @UI @component:LogViewer @type:performance @action:search @status:optional
  Scenario: Efficient log search performance
    Given I have 10,000+ log entries loaded
    When I search for a specific term
    Then search results should return within 500ms
    And the search should not block the UI
    And ongoing log streaming should continue during search
```

---

## Accessibility Requirements

### Tags:
`@UI @component:LogViewer @type:accessibility @status:critical`

```gherkin
Feature: Accessibility Compliance

  @UI @component:LogViewer @type:accessibility @action:navigation @status:critical
  Scenario: Keyboard navigation for log entries
    When I navigate the log viewer using keyboard
    Then I should be able to scroll through logs with arrow keys
    And I should be able to access filter controls via Tab
    And keyboard shortcuts should be available for common actions

  @UI @component:LogViewer @type:accessibility @action:screen-reader @status:critical
  Scenario: Screen reader support for logs
    When I use a screen reader with the log viewer
    Then log levels should be announced clearly
    And timestamps should be read in understandable format
    And new log arrivals should be announced appropriately
    And filter states should be communicated clearly
```

---

## Integration Requirements

### Tags:
`@UI @component:LogViewer @type:integration @status:critical`

```gherkin
Feature: API Integration

  @UI @component:LogViewer @type:integration @action:load @status:critical
  Scenario: Load historical logs
    When the log viewer component mounts
    Then it should call GET /executions/{id}/logs
    And load the most recent logs first
    And support pagination for older logs
    And handle different log levels appropriately

  @UI @component:LogViewer @type:integration @action:stream @status:critical
  Scenario: WebSocket integration for real-time logs
    Given the log viewer is connected to an active execution
    When new logs are generated
    Then it should receive log events via WebSocket
    And display new logs immediately
    And maintain connection health with appropriate error handling
```

---

## Dependencies

### Tags:
`@UI @component:LogViewer @type:dependency @status:critical`

- Required Services: `useExecutionLogs`, `useWebSocket`, `useLogFiltering`
- Sub-Components: `LogEntry`, `LogLevelFilter`, `SearchBox`, `ConnectionIndicator`

---

## Data Mapping

### Tags:
`@UI @component:LogViewer @type:data-mapping @status:critical`

```gherkin
Feature: Log Data Mapping

  @UI @component:LogViewer @type:data-mapping @action:display @status:critical
  Scenario: Map log data to display format
    Given execution log data from API
      | Field      | Value                     | UI Element           | Transform                    |
      | level      | ERROR                     | .log-level-icon      | log_level_to_icon()          |
      | timestamp  | 2024-08-12T10:30:15.123Z  | .log-timestamp       | format_log_timestamp()       |
      | message    | Database connection failed| .log-message         | None                         |
      | nodeId     | node_123                  | .log-node-info       | get_node_display_name()      |
      | metadata   | { requestId: "req_456" }  | .log-metadata        | format_metadata_display()    |
    When logs are displayed in the viewer
    Then all fields should be properly transformed and styled
    And log levels should have appropriate visual indicators

  @UI @component:LogViewer @type:data-mapping @action:stream @status:critical
  Scenario: Process real-time log events
    Given WebSocket log events
      | Event Type        | Data                    | UI Action                     |
      | execution.log.new | New log entry object    | Append to log display         |
      | execution.log.batch| Array of log entries   | Batch append with animation   |
      | execution.complete| Execution end event     | Show completion indicator     |
    When log events are received
    Then they should be processed according to event type
    And UI should update appropriately for each event
```