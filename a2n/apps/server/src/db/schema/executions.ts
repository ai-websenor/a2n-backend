import { pgTable, text, timestamp, integer, json, boolean, index } from "drizzle-orm/pg-core";
import { executionStatusEnum, nodeExecutionStatusEnum, logLevelEnum } from "./types";
import { user } from "./auth";
import { workflow, workflowTrigger } from "./workflows";

export const execution = pgTable("execution", {
	id: text("id").primaryKey(),
	status: executionStatusEnum("status").notNull().default("PENDING"),
	startTime: timestamp("start_time").notNull().defaultNow(),
	endTime: timestamp("end_time"),
	duration: integer("duration"), // in milliseconds
	triggerData: json("trigger_data").$type<Record<string, any>>(), // Data that triggered the execution
	inputData: json("input_data").$type<Record<string, any>>(), // Input parameters for execution
	outputData: json("output_data").$type<Record<string, any>>(), // Final output data
	errorMessage: text("error_message"),
	errorDetails: json("error_details").$type<{
		code?: string;
		stack?: string;
		nodeId?: string;
		retryCount?: number;
	}>(),
	retryCount: integer("retry_count").notNull().default(0),
	maxRetries: integer("max_retries").notNull().default(3),
	priority: integer("priority").notNull().default(0), // Higher number = higher priority
	parentExecutionId: text("parent_execution_id"), // For sub-workflow executions
	contextData: json("context_data").$type<Record<string, any>>(), // Shared context across nodes
	metadata: json("metadata").$type<{
		userAgent?: string;
		ipAddress?: string;
		source?: string;
		environment?: string;
	}>(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	workflowId: text("workflow_id")
		.notNull()
		.references(() => workflow.id, { onDelete: "cascade" }),
	workflowVersion: integer("workflow_version").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	triggerId: text("trigger_id")
		.references(() => workflowTrigger.id, { onDelete: "set null" }),
}, (table) => ({
	// Indexes for better query performance
	statusIdx: index("idx_execution_status").on(table.status),
	workflowIdx: index("idx_execution_workflow").on(table.workflowId),
	userIdx: index("idx_execution_user").on(table.userId),
	startTimeIdx: index("idx_execution_start_time").on(table.startTime),
	workflowStatusIdx: index("idx_execution_workflow_status").on(table.workflowId, table.status),
}));

export const executionNodeState = pgTable("execution_node_state", {
	id: text("id").primaryKey(),
	nodeId: text("node_id").notNull(), // Node ID from workflow definition
	nodeName: text("node_name").notNull(),
	nodeType: text("node_type").notNull(),
	status: nodeExecutionStatusEnum("status").notNull().default("PENDING"),
	startTime: timestamp("start_time"),
	endTime: timestamp("end_time"),
	duration: integer("duration"), // in milliseconds
	inputData: json("input_data").$type<Record<string, any>>(),
	outputData: json("output_data").$type<Record<string, any>>(),
	errorMessage: text("error_message"),
	errorDetails: json("error_details").$type<{
		code?: string;
		stack?: string;
		retryCount?: number;
	}>(),
	retryCount: integer("retry_count").notNull().default(0),
	maxRetries: integer("max_retries").notNull().default(3),
	progressPercentage: integer("progress_percentage").notNull().default(0),
	position: json("position").$type<{ x: number; y: number }>(), // Node position in workflow
	configuration: json("configuration").$type<Record<string, any>>(), // Node configuration snapshot
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	executionId: text("execution_id")
		.notNull()
		.references(() => execution.id, { onDelete: "cascade" }),
}, (table) => ({
	// Indexes for better query performance
	executionIdx: index("idx_node_state_execution").on(table.executionId),
	statusIdx: index("idx_node_state_status").on(table.status),
	nodeIdx: index("idx_node_state_node").on(table.nodeId),
	executionNodeIdx: index("idx_node_state_execution_node").on(table.executionId, table.nodeId),
}));

export const executionLog = pgTable("execution_log", {
	id: text("id").primaryKey(),
	level: logLevelEnum("level").notNull().default("INFO"),
	message: text("message").notNull(),
	details: json("details").$type<Record<string, any>>(),
	nodeId: text("node_id"), // Optional - log entry may be for specific node
	nodeName: text("node_name"),
	timestamp: timestamp("timestamp").notNull().defaultNow(),
	source: text("source").notNull().default("SYSTEM"), // SYSTEM, USER, NODE, TRIGGER
	category: text("category"), // ERROR, PERFORMANCE, SECURITY, BUSINESS
	correlationId: text("correlation_id"), // For tracing related log entries
	duration: integer("duration"), // For performance logs
	metadata: json("metadata").$type<{
		httpStatus?: number;
		requestId?: string;
		userAgent?: string;
		ipAddress?: string;
	}>(),
	executionId: text("execution_id")
		.notNull()
		.references(() => execution.id, { onDelete: "cascade" }),
	nodeStateId: text("node_state_id")
		.references(() => executionNodeState.id, { onDelete: "cascade" }),
}, (table) => ({
	// Indexes for better query performance
	executionIdx: index("idx_log_execution").on(table.executionId),
	timestampIdx: index("idx_log_timestamp").on(table.timestamp),
	levelIdx: index("idx_log_level").on(table.level),
	nodeIdx: index("idx_log_node").on(table.nodeId),
	executionTimestampIdx: index("idx_log_execution_timestamp").on(table.executionId, table.timestamp),
}));

export const executionMetrics = pgTable("execution_metrics", {
	id: text("id").primaryKey(),
	metricName: text("metric_name").notNull(),
	metricValue: text("metric_value").notNull(), // String to support various data types
	metricType: text("metric_type").notNull().default("COUNTER"), // COUNTER, GAUGE, HISTOGRAM, TIMER
	unit: text("unit"), // seconds, bytes, count, etc.
	tags: json("tags").$type<Record<string, string>>(), // Key-value pairs for metric dimensions
	timestamp: timestamp("timestamp").notNull().defaultNow(),
	nodeId: text("node_id"), // Optional - metric may be for specific node
	executionId: text("execution_id")
		.notNull()
		.references(() => execution.id, { onDelete: "cascade" }),
}, (table) => ({
	// Indexes for better query performance
	executionIdx: index("idx_metrics_execution").on(table.executionId),
	timestampIdx: index("idx_metrics_timestamp").on(table.timestamp),
	metricNameIdx: index("idx_metrics_name").on(table.metricName),
	nodeIdx: index("idx_metrics_node").on(table.nodeId),
}));

export const executionSchedule = pgTable("execution_schedule", {
	id: text("id").primaryKey(),
	scheduledTime: timestamp("scheduled_time").notNull(),
	status: text("status").notNull().default("PENDING"), // PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
	attempts: integer("attempts").notNull().default(0),
	maxAttempts: integer("max_attempts").notNull().default(3),
	lastAttemptAt: timestamp("last_attempt_at"),
	nextAttemptAt: timestamp("next_attempt_at"),
	executionData: json("execution_data").$type<Record<string, any>>(),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	workflowId: text("workflow_id")
		.notNull()
		.references(() => workflow.id, { onDelete: "cascade" }),
	triggerId: text("trigger_id")
		.notNull()
		.references(() => workflowTrigger.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	executionId: text("execution_id")
		.references(() => execution.id, { onDelete: "set null" }),
}, (table) => ({
	// Indexes for better query performance
	scheduledTimeIdx: index("idx_schedule_time").on(table.scheduledTime),
	statusIdx: index("idx_schedule_status").on(table.status),
	workflowIdx: index("idx_schedule_workflow").on(table.workflowId),
	nextAttemptIdx: index("idx_schedule_next_attempt").on(table.nextAttemptAt),
}));