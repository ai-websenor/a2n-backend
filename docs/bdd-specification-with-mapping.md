# A2N Enterprise-Grade Extended BDD Specification with Database-UI Mapping

## 1. Overview
This document provides an **enterprise-grade** specification for writing **extended BDD feature files** using the **Layered Backgrounds** approach with integrated **Database-to-UI Component Mapping** for the A2N workflow automation platform. It ensures consistency, clarity, and reusability across development teams, enabling both human stakeholders and AI-driven pipelines to generate and maintain full-stack code effectively.

## 2. Document Structure
1. Purpose & Audience  
2. Layered BDD Conventions  
3. Metadata Definitions  
4. **A2N-Specific Database-UI Mapping**
5. Feature File Template  
6. Detailed Example: Workflow Execution with Real-time Updates  
7. Best Practices & Guidelines  
8. A2N Tagging Strategy  
9. Versioning & Change Management  

---

## 3. Purpose & Audience
- **Purpose:** Standardize how A2N features are specified, incorporating workflow UI, API endpoints, Prisma database schema, and explicit data-UI relationships.  
- **Audience:** Product Owners, QA Engineers, Developers, DevOps, UI/UX Designers, and AI Integration Specialists working on A2N platform.

## 4. Layered BDD Conventions for A2N
- **Background Sections:** Separate `@UI`, `@API`, `@DB`, and `@DataMapping` backgrounds at the top of each feature.  
- **Scenario Focus:** Each scenario remains high-level, referencing shared A2N contexts.  
- **Tagging:** Use tags to denote metadata and enable targeted test runs (`@smoke`, `@regression`, `@workflow-engine`).
- **Data Flow:** Explicit mapping between Prisma schema and UI components for A2N workflow platform.

## 5. Metadata Definitions for A2N

### UI (@UI Background)
- **Workflow Builder Components:** Node editors, connection lines, canvas operations
- **Dashboard Views:** Execution logs, workflow status, project management
- **Data Bindings:** References to Prisma model fields displayed in UI

### API (@API Background)
- **NestJS Endpoints:** Controller methods, DTOs, response schemas
- **Authentication:** JWT-based auth with refresh tokens
- **WebSocket Events:** Real-time workflow execution updates

### DB (@DB Background)
- **Prisma Models:** User, Workflow, Execution, Project, NodeDefinition tables
- **Relations:** Foreign keys and joins between workflow entities
- **Indexes:** Performance-critical indexes for workflow queries

### Data Mapping (@DataMapping Background)
- **Model-to-Component:** Direct mapping of Prisma fields to React components
- **Aggregations:** Computed workflow statistics and execution metrics
- **Real-time Updates:** WebSocket-driven UI state changes

## 6. A2N-Specific Database-UI Mapping Specification

### 6.1 Core A2N Models and UI Components

#### User Management
```gherkin
| Prisma Model.Field    | UI Component          | Display Format         | Transform                    |
| users.email           | UserProfile.email     | Text                   | None                         |
| users.name            | UserAvatar.initials   | Initials               | first_char(name.split(' '))  |
| users.isActive        | UserStatus.indicator  | Status badge           | IF(active, 'Online', 'Away') |
| users.createdAt       | ProfileInfo.memberSince| Relative date         | format_relative_date()       |
```

#### Workflow Management
```gherkin
| Prisma Model.Field         | UI Component              | Display Format      | Transform                        |
| workflows.name             | WorkflowCard.title        | Text                | None                             |
| workflows.isActive         | WorkflowCard.statusBadge  | Status indicator    | IF(active, 'Active', 'Draft')    |
| workflows.definition       | WorkflowCanvas.nodes      | Visual graph        | JSON_to_visual_nodes()           |
| workflows.version          | WorkflowHeader.version    | Version badge       | "v" + version                    |
| workflows.createdAt        | WorkflowCard.timestamp    | Relative time       | time_ago(createdAt)              |
| workflows.updatedAt        | WorkflowCard.lastModified | Relative time       | time_ago(updatedAt)              |
```

#### Execution Tracking
```gherkin
| Prisma Model.Field           | UI Component                | Display Format       | Transform                           |
| executions.status            | ExecutionCard.statusBadge   | Status with color    | status_to_color_badge()             |
| executions.startTime         | ExecutionCard.startTime     | Timestamp            | format_datetime(startTime)          |
| executions.duration          | ExecutionCard.duration      | Human readable       | milliseconds_to_human(duration)     |
| executions.error             | ExecutionCard.errorMessage  | Truncated text       | truncate(error, 100)                |
| execution_logs.level         | LogEntry.icon               | Severity icon        | log_level_to_icon()                 |
| execution_logs.message       | LogEntry.text               | Formatted message    | format_log_message()                |
```

#### Project Organization
```gherkin
| Prisma Model.Field    | UI Component            | Display Format    | Transform                      |
| projects.name         | ProjectCard.title       | Text              | None                           |
| projects.color        | ProjectCard.colorBadge  | Color indicator   | hex_to_css_variable()          |
| projects.isArchived   | ProjectCard.archiveTag  | Archive badge     | IF(archived, 'Archived', '')   |
| projects.description  | ProjectCard.description | Truncated text    | truncate(description, 150)     |
```

### 6.2 Advanced A2N Mappings

#### Aggregated Workflow Statistics
```gherkin
| Aggregation Query                                           | UI Component              | Display                    |
| COUNT(*) FROM workflows WHERE userId = ? AND isActive=true | DashboardStats.activeCount| "5 Active Workflows"       |
| COUNT(*) FROM executions WHERE status='SUCCESS'            | DashboardStats.successRate| "85% Success Rate"         |
| AVG(duration) FROM executions WHERE status='SUCCESS'       | DashboardStats.avgDuration| "2.3s Avg Duration"        |
| COUNT(*) FROM executions WHERE DATE(startTime) = TODAY()   | DashboardStats.todayRuns  | "12 Executions Today"      |
```

#### Real-time Execution Updates
```gherkin
| WebSocket Event                    | UI Component State        | Visual Change                      |
| execution.status.updated           | ExecutionCard.status      | Badge color and text change        |
| execution.logs.new                 | LogViewer.entries         | New log entry with animation       |
| workflow.execution.started         | WorkflowCard.indicator    | Pulsing "running" animation        |
| node.state.changed                 | WorkflowCanvas.nodeStatus | Node border color change           |
```

#### Complex Workflow Relationships
```gherkin
| Join Query                                               | UI Component           | Display Format                |
| workflows JOIN executions ORDER BY startTime DESC       | WorkflowCard.lastRun   | "Last run: 2 hours ago"       |
| workflows JOIN projects ON projectId                    | WorkflowCard.project   | Project name with color badge |
| executions JOIN execution_node_states GROUP BY nodeId   | NodeExecutionStats     | Success/failure per node      |
| users JOIN workflows COUNT(*)                          | UserDashboard.metrics  | "You have 8 workflows"        |
```

## 7. A2N Feature File Template
```gherkin
Feature: <A2N Feature Title>

  @UI
  Background: A2N UI Components
    Given the A2N workflow platform includes:
      | Component         | Selector                | Description                  | Prisma Source       |
      | WorkflowCanvas    | .workflow-canvas        | Visual workflow editor       | workflows.definition |
      | ExecutionLog      | .execution-log          | Real-time execution logs     | execution_logs      |
      | ProjectSidebar    | .project-sidebar        | Project organization         | projects            |

  @API
  Background: A2N NestJS API
    Given the following A2N API endpoints:
      | Method | Endpoint                    | Controller Method         | Returns              |
      | GET    | /workflows                  | WorkflowController.findAll| Workflow[]           |
      | POST   | /workflows/{id}/execute     | WorkflowController.execute| Execution            |
      | GET    | /executions/{id}/logs       | ExecutionController.logs  | ExecutionLog[]       |

  @DB
  Background: A2N Prisma Schema
    Given the A2N database contains:
      | Model              | Key Fields                                    | Indexes              |
      | User               | id, email, name, isActive                     | email, isActive      |
      | Workflow           | id, name, definition, isActive, userId        | userId, isActive     |
      | Execution          | id, status, startTime, workflowId, userId     | workflowId, status   |
      | ExecutionLog       | id, level, message, executionId, timestamp    | executionId, level   |

  @DataMapping
  Background: A2N Data-to-UI Mapping
    Given these A2N data mappings exist:
      | Prisma Source              | UI Component             | Transform/Format           |
      | workflows.name             | WorkflowCard.title       | None                       |
      | executions.status          | ExecutionBadge.status    | status_color_mapping()     |
      | execution_logs.timestamp   | LogEntry.time            | relative_time_format()     |
      | workflows.definition.nodes | WorkflowCanvas.graph     | json_to_visual_graph()     |

  Scenario: <A2N Scenario Title>
    Given ...
    When ...
    Then ...
```

## 8. Detailed A2N Example: Real-time Workflow Execution Monitoring

```gherkin
Feature: Real-time Workflow Execution Monitoring

  @UI
  Background: A2N Execution Monitoring UI
    Given the A2N execution monitoring interface includes:
      | Component              | Selector                  | Description                        | Data Source           |
      | ExecutionDashboard     | .execution-dashboard      | Live execution overview            | executions            |
      | WorkflowStatusCard     | .workflow-status-card     | Individual workflow status         | workflows + executions |
      | ExecutionLogViewer     | .execution-log-viewer     | Streaming execution logs           | execution_logs        |
      | NodeExecutionMap       | .node-execution-map       | Visual node execution status       | execution_node_states |
      | ExecutionMetrics       | .execution-metrics        | Aggregated execution statistics    | execution aggregates  |

  @API
  Background: A2N Execution API & WebSockets
    Given the following A2N execution endpoints and events:
      | Type      | Method/Event                  | Endpoint/Channel              | Returns/Emits                |
      | REST      | POST                          | /workflows/{id}/execute       | Execution started response   |
      | REST      | GET                           | /executions/{id}              | Execution details            |
      | REST      | GET                           | /executions/{id}/logs         | ExecutionLog[]               |
      | WebSocket | execution.started             | /ws/executions                | ExecutionStartedEvent        |
      | WebSocket | execution.node.updated        | /ws/executions/{id}           | NodeExecutionStateEvent      |
      | WebSocket | execution.log.new             | /ws/executions/{id}/logs      | NewLogEvent                  |
      | WebSocket | execution.completed           | /ws/executions                | ExecutionCompletedEvent      |

  @DB
  Background: A2N Execution Database Schema
    Given the A2N execution database contains:
      | Model                  | Key Fields                                           | Critical Indexes                    |
      | Execution              | id, status, startTime, endTime, workflowId, userId  | workflowId, userId, status, startTime |
      | ExecutionLog           | id, executionId, nodeId, level, message, timestamp  | executionId, timestamp, level       |
      | ExecutionNodeState     | id, executionId, nodeId, status, input, output      | executionId, nodeId, status         |
      | Workflow               | id, name, definition, isActive, userId              | userId, isActive                    |

  @DataMapping
  Background: A2N Execution Data-to-UI Mapping
    Given these A2N execution data mappings exist:
      # Direct Status Mappings
      | Prisma Source                   | UI Component                    | Display Format                  |
      | executions.status               | ExecutionStatusBadge.status     | Color-coded status badge        |
      | executions.startTime            | ExecutionCard.startTime         | "Started 2 minutes ago"         |
      | executions.duration             | ExecutionCard.duration          | "2.3s" or "Running..."          |
      | execution_logs.level            | LogEntry.icon                   | Severity icon (🔴⚠️ℹ️🐛)          |
      | execution_logs.message          | LogEntry.text                   | Formatted log message           |
      
      # Computed Execution Metrics
      | Computation                                             | UI Component              | Display Format              |
      | COUNT(*) FROM executions WHERE status='RUNNING'        | DashboardHeader.running   | "3 workflows running"       |
      | AVG(duration) FROM executions WHERE status='SUCCESS'   | MetricsCard.avgDuration   | "1.8s average duration"     |
      | COUNT(*) FROM executions WHERE DATE(startTime)=TODAY() | MetricsCard.todayCount    | "47 executions today"       |
      
      # Real-time Node State Mapping
      | Prisma Source                        | UI Component                | Visual State                     |
      | execution_node_states.status         | WorkflowNode.statusBorder   | Border color (green/red/yellow)  |
      | execution_node_states.output         | NodeOutputPreview.data      | JSON formatted output            |
      | execution_node_states.error          | NodeErrorBadge.message      | Error tooltip on hover           |
      
      # Relational Execution Data
      | Join Query                                                    | UI Component                | Display Format                    |
      | executions JOIN workflows ON workflowId                      | ExecutionCard.workflowName  | "Workflow: Data Processing"       |
      | executions JOIN execution_logs WHERE level='ERROR'           | ExecutionCard.errorCount    | "3 errors" (clickable)            |
      | execution_node_states GROUP BY nodeId, status                | NodeExecutionStats.chart    | Success/failure pie chart         |

  @smoke @critical @realtime
  Scenario: Monitor workflow execution with real-time log streaming
    Given I have an active workflow "Data Processing Pipeline"
    And the workflow contains 5 processing nodes
    When I start the workflow execution
    Then I should see the ExecutionStatusBadge change to "RUNNING"
    And the WorkflowNode borders should update in real-time as each node executes
    And new ExecutionLog entries should stream to the LogViewer without page refresh
    And the NodeExecutionMap should show visual progress through the workflow
    And when execution completes, the ExecutionStatusBadge should show "SUCCESS" or "FAILED"
    And the final execution duration should be calculated and displayed in ExecutionCard.duration

  @regression @performance
  Scenario: Display aggregated execution metrics on dashboard
    Given I have executed workflows 50 times in the last 24 hours
    And 42 executions were successful with varying durations
    When I view the execution dashboard
    Then the MetricsCard.todayCount should display "50 executions today"
    And the MetricsCard.avgDuration should show the calculated average from successful executions
    And the DashboardHeader.running should show current count of RUNNING executions
    And all metrics should update automatically when new executions start or complete

  @websocket @realtime
  Scenario: Receive real-time execution updates via WebSocket
    Given I am subscribed to execution updates via WebSocket
    And another user starts a workflow execution
    When the execution progresses through different nodes
    Then I should receive "execution.node.updated" events for each node state change
    And my UI should update the NodeExecutionMap without API polling
    And when new logs are generated, I should receive "execution.log.new" events
    And the LogViewer should append new entries with smooth animations
```

## 9. A2N-Specific Tagging Strategy

### 9.1 Workflow Engine Tags
- `@workflow-engine` - Core workflow execution functionality
- `@node-execution` - Individual node processing
- `@workflow-builder` - Visual workflow creation UI
- `@execution-monitoring` - Real-time execution tracking

### 9.2 A2N Platform Tags
- `@user-management` - Authentication and user features
- `@project-organization` - Project grouping and management
- `@credential-management` - Secure credential storage
- `@template-system` - Workflow templates and sharing

### 9.3 Integration Tags
- `@prisma-integration` - Database layer functionality
- `@nestjs-controllers` - API endpoint functionality
- `@websocket-realtime` - Real-time communication
- `@jwt-authentication` - Token-based authentication

### 9.4 Performance Tags
- `@database-performance` - Query optimization scenarios
- `@realtime-performance` - WebSocket performance testing
- `@execution-scalability` - Concurrent execution testing

## 10. A2N Best Practices

### 10.1 Workflow-Specific Conventions
- Always map workflow definition JSON to visual components
- Include execution state in all workflow-related scenarios
- Test both manual and triggered workflow executions
- Verify real-time updates for long-running workflows

### 10.2 Security Considerations
- Never expose credential data in BDD scenarios
- Test JWT token refresh flows
- Verify user isolation in multi-user scenarios
- Include authorization checks in all API scenarios

### 10.3 Performance Guidelines
- Test workflow execution with varying node counts
- Verify database query performance with large datasets
- Include WebSocket connection limits testing
- Test concurrent execution scenarios

## 11. Versioning & Change Management

### 11.1 Schema Evolution
- **Prisma Migrations:** Track database schema changes
- **API Versioning:** Document breaking changes to endpoints
- **WebSocket Events:** Version real-time event schemas

### 11.2 BDD Specification Updates
- Link BDD scenarios to Prisma schema versions
- Update data mappings when models change
- Maintain backward compatibility for existing scenarios

## 12. A2N-Specific Implementation Notes

### 12.1 NestJS Integration
```typescript
// Example: Mapping BDD scenarios to NestJS testing
describe('Workflow Execution Monitoring', () => {
  beforeEach(async () => {
    // Setup test database with Prisma
    await prisma.workflow.create({
      data: { /* BDD Given data */ }
    });
  });
});
```

### 12.2 Prisma Query Optimization
```typescript
// Example: Efficient queries for BDD scenarios
const workflowWithExecutions = await prisma.workflow.findMany({
  include: {
    executions: {
      orderBy: { startTime: 'desc' },
      take: 10
    }
  }
});
```

### 12.3 WebSocket Event Testing
```typescript
// Example: Testing real-time scenarios
it('should emit execution updates', async () => {
  const execution = await startWorkflowExecution(workflowId);
  expect(mockWebSocket.emit).toHaveBeenCalledWith(
    'execution.started',
    { executionId: execution.id, status: 'RUNNING' }
  );
});
```

---

**Document Version:** 1.0  
**Last Updated:** August 2025  
**Compatible with:** A2N Platform v0.0.1, Prisma 6.13.0, NestJS 11.0.1

*This specification is maintained in sync with the A2N platform development and should be updated with each major release.*