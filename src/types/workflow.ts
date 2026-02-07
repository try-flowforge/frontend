/**
 * Workflow Types
 * Types for workflow management and execution tracking
 */

// ===========================================
// WORKFLOW SUMMARY (for list view)
// ===========================================

export interface WorkflowSummary {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    is_draft: boolean;
    category: string | null;
    tags: string[] | null;
    is_public?: boolean;
    published_at?: string | null;
    version?: number;
    version_created_at?: string | null;
    created_at: string;
    updated_at: string;
    last_executed_at: string | null;
    // Execution statistics
    execution_count: number;
    success_count: number;
    failed_count: number;
    last_execution_status: ExecutionStatus | null;
    last_execution_at: string | null;
}

export interface PublicWorkflowSummary {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    tags: string[] | null;
    published_at: string | null;
    updated_at: string;
    created_at: string;
    usage_count: number;
}

// ===========================================
// WORKFLOW DETAIL (for canvas view)
// ===========================================

export interface WorkflowDetail {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    is_draft: boolean;
    category: string | null;
    tags: string[] | null;
    is_public?: boolean;
    published_at?: string | null;
    version?: number;
    version_created_at?: string | null;
    trigger_node_id: string | null;
    created_at: string;
    updated_at: string;
    nodes: BackendNode[];
    edges: BackendEdge[];
}

export interface PublicWorkflowDetail {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    is_draft: boolean;
    category: string | null;
    tags: string[] | null;
    is_public: boolean;
    published_at: string | null;
    trigger_node_id: string | null;
    version: number;
    created_at: string;
    updated_at: string;
    nodes: BackendNode[];
    edges: BackendEdge[];
}

export interface BackendNode {
    id: string;
    workflow_id: string;
    type: string;
    name: string | null;
    description: string | null;
    config: Record<string, unknown>;
    position: { x: number; y: number };
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface BackendEdge {
    id: string;
    workflow_id: string;
    source_node_id: string;
    target_node_id: string;
    source_handle: string | null;
    target_handle: string | null;
    condition: Record<string, unknown> | null;
    data_mapping: Record<string, unknown> | null;
    created_at: string;
}

// ===========================================
// EXECUTION TYPES
// ===========================================

export type ExecutionStatus =
    | 'PENDING'
    | 'RUNNING'
    | 'SUCCESS'
    | 'FAILED'
    | 'CANCELLED'
    | 'RETRYING'
    | 'WAITING_FOR_SIGNATURE';

export type TriggerType = 'MANUAL' | 'CRON' | 'WEBHOOK' | 'EVENT';

export interface WorkflowExecution {
    id: string;
    workflow_id: string;
    user_id: string;
    status: ExecutionStatus;
    triggered_by: TriggerType;
    triggered_at: string;
    initial_input: Record<string, unknown> | null;
    error: {
        message: string;
        code?: string;
        nodeId?: string;
        stack?: string;
    } | null;
    started_at: string;
    completed_at: string | null;
    retry_count: number;
    metadata: Record<string, unknown> | null;
    workflow_name?: string;
    // Computed fields
    duration_ms?: number;
    node_executions?: NodeExecution[];
}

export interface NodeExecution {
    id: string;
    execution_id: string;
    node_id: string;
    node_type: string;
    input_data: Record<string, unknown> | null;
    output_data: Record<string, unknown> | null;
    status: ExecutionStatus;
    error: {
        message: string;
        code?: string;
        details?: unknown;
    } | null;
    started_at: string;
    completed_at: string | null;
    duration_ms: number | null;
    retry_count: number;
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface WorkflowListResponse {
    success: boolean;
    data: WorkflowSummary[];
    meta: {
        timestamp: string;
        total: number;
        limit: number;
        offset: number;
    };
    error?: {
        message: string;
        code?: string;
    };
}

export interface WorkflowDetailResponse {
    success: boolean;
    data: WorkflowDetail;
    meta: {
        timestamp: string;
    };
    error?: {
        message: string;
        code?: string;
    };
}

export interface ExecutionListResponse {
    success: boolean;
    data: WorkflowExecution[];
    meta: {
        timestamp: string;
        total: number;
    };
    error?: {
        message: string;
        code?: string;
    };
}

export interface ExecutionDetailResponse {
    success: boolean;
    data: WorkflowExecution & {
        nodeExecutions: NodeExecution[];
    };
    meta: {
        timestamp: string;
    };
    error?: {
        message: string;
        code?: string;
    };
}

// ===========================================
// SAVE WORKFLOW TYPES
// ===========================================

export interface SaveWorkflowParams {
    workflowId?: string | null; // null = create new
    name: string;
    description?: string;
    nodes: unknown[]; // React Flow nodes
    edges: unknown[]; // React Flow edges
    category?: string;
    tags?: string[];
    isPublic?: boolean;
}

export interface SaveWorkflowResponse {
    success: boolean;
    workflowId: string;
    data?: WorkflowDetail;
    error?: {
        message: string;
        code?: string;
    };
}

export interface PublicWorkflowListResponse {
    success: boolean;
    data: PublicWorkflowSummary[];
    meta: {
        timestamp: string;
        total: number;
        limit: number;
        offset: number;
    };
    error?: {
        message: string;
        code?: string;
    };
}

export interface PublicWorkflowDetailResponse {
    success: boolean;
    data: PublicWorkflowDetail;
    meta: {
        timestamp: string;
    };
    error?: {
        message: string;
        code?: string;
    };
}
