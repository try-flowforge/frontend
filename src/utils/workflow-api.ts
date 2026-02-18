/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Workflow API utilities
 * Functions to interact with the backend workflow API
 */

import type { Node, Edge } from "reactflow";
import { api, ApiClientError } from "@/lib/api-client";
import type {
  WorkflowListResponse,
  WorkflowDetailResponse,
  WorkflowSummary,
  WorkflowDetail,
  BackendNode,
  BackendEdge,
  ExecutionListResponse,
  WorkflowExecution,
  PublicWorkflowListResponse,
  PublicWorkflowDetailResponse,
  PublicWorkflowSummary,
  PublicWorkflowDetail,
} from "@/types/workflow";

// Import backend mappings from centralized blocks system
import {
  normalizeNodeType,
  extractNodeConfig,
  transformNodeToCanvas,
} from "@/blocks/utils/backend-mapping";

/**
 * Extract node-specific configuration from node data
 * Uses centralized implementation from @/blocks/utils/backend-mapping
 */
function extractNodeConfigForBackend(node: Node): any {
  return extractNodeConfig(node);
}

/**
 * Transform React Flow nodes to backend format
 */
function transformNodeToBackend(node: Node) {
  const backendType = normalizeNodeType(node.type || "base");

  return {
    id: node.id,
    type: backendType,
    name: node.data?.label || node.id,
    description: node.data?.description || "",
    config: extractNodeConfigForBackend(node),
    position: node.position,
    metadata: {
      blockId: node.data?.blockId,
      iconName: node.data?.iconName,
      status: node.data?.status,
      frontendType: node.type, // Preserve original frontend type
    },
  };
}

/**
 * Transform React Flow edges to backend format
 */
function transformEdgeToBackend(edge: Edge) {
  return {
    sourceNodeId: edge.source,
    targetNodeId: edge.target,
    sourceHandle: edge.sourceHandle || null,
    targetHandle: edge.targetHandle || null,
    condition: {}, // Empty object for future use (backend expects object type)
    dataMapping: {}, // Empty object for future use (backend expects object type)
  };
}

/**
 * Create a new workflow in the backend
 */
export async function createWorkflow(params: {
  accessToken: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  isPublic?: boolean;
  tags?: string[];
}): Promise<{
  success: boolean;
  data?: any;
  error?: ApiError;
  requestId?: string;
}> {
  // Find trigger node (start node)
  const startNode = params.nodes.find(
    (n) => n.type === "start" || n.id === "start-node",
  );

  const response = await api.post<{ data: any }>(
    "/workflows",
    {
      name: params.name,
      description: params.description || "",
      nodes: params.nodes.map(transformNodeToBackend),
      edges: params.edges.map(transformEdgeToBackend),
      triggerNodeId: startNode?.id,
      category: "automation",
      tags: params.tags || [],
      isPublic: params.isPublic || false,
    },
    { accessToken: params.accessToken },
  );

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error creating workflow:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data,
    requestId: response.requestId,
  };
}

/**
 * Execute workflow response data
 */
export interface ExecuteWorkflowResponseData {
  executionId: string;
  status: string;
  message: string;
  subscriptionToken: string; // Token for SSE subscription
}

/**
 * API error response (type alias for ApiClientError for request ID support)
 */
export type ApiError = ApiClientError;

/**
 * Validation error details from the backend WorkflowValidator (graph-level)
 */
export interface ValidationErrorDetails {
  reason?: string;
  field?: string;
  nodeId?: string;
  nodeIds?: string[];
  referencedNodeId?: string;
}

/**
 * Joi schema validation error (block-config-level)
 */
export interface JoiFieldError {
  field: string;
  message: string;
}

/**
 * Result of workflow validation
 */
export interface ValidateWorkflowResult {
  valid: boolean;
  message: string;
  /** Present when validation fails */
  errorCode?: string;
  /** Joi field-level errors (when blocks have missing configs) */
  fieldErrors?: JoiFieldError[];
  /** Graph-level error details from WorkflowValidator */
  graphDetails?: ValidationErrorDetails;
}

/**
 * Convert a raw camelCase config field name to a human-readable label.
 * Strips common block-type prefixes (swap, lending, etc.) and formats nicely.
 *   "swapProvider"       → "Provider"
 *   "userPromptTemplate" → "Prompt Template"
 *   "tokenIn"            → "Token In"
 *   "apiKey"             → "API Key"
 */
/**
 * Convert a raw camelCase or dot-separated config field path to a human-readable label.
 * Strips common prefixes and formats nicely.
 *   "swapProvider"                   → "Provider"
 *   "inputConfig.sourceToken.address" → "Source Token Address"
 *   "asset.symbol"                   → "Asset Symbol"
 */
function humanizeFieldName(raw: string): string {
  // 1. Strip structural prefixes from new nested schemas
  let clean = raw
    .replace(/^inputConfig\./, "")
    .replace(/^asset\./, "")
    .replace(/^sourceToken\./, "Source Token ")
    .replace(/^destinationToken\./, "Destination Token ");

  // Known exact mappings for common final field names
  const knownLabels: Record<string, string> = {
    swapProvider: "Provider",
    swapChain: "Chain",
    swapType: "Swap Type",
    tokenIn: "Token In",
    tokenOut: "Token Out",
    amount: "Amount",
    slippage: "Slippage",
    apiKey: "API Key",
    model: "Model",
    userPromptTemplate: "Prompt Template",
    systemPrompt: "System Prompt",
    to: "Recipient",
    subject: "Subject",
    body: "Body",
    message: "Message",
    connectionId: "Connection",
    chatId: "Chat ID",
    provider: "Provider",
    chain: "Chain",
    action: "Action",
    token: "Token",
    feedId: "Price Feed",
    description: "Description",
    walletAddress: "Wallet Address",
    triggerType: "Trigger Type",
    schedule: "Schedule",
    aggregatorAddress: "Aggregator Address",
    priceFeedId: "Price Feed ID",
    staleAfterSeconds: "Stale After (Seconds)",
    maxOutputTokens: "Max Tokens",
    webhookPath: "Webhook Path",
    cronExpression: "Cron Expression",
  };

  if (knownLabels[clean]) return knownLabels[clean];

  // 2. Format remaining camelCase or dot identifiers
  // Strip common block-type prefixes (swap, lending, etc.) if still present
  clean = clean.replace(/^(swap|lending|oracle|telegram|mail|ai)/, "");

  // Replace dots with spaces
  clean = clean.replace(/\./g, " ");

  // Insert space before capitals
  clean = clean.replace(/([A-Z])/g, " $1");

  // Trim and capitalize first letter
  const result = clean.trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Build a user-friendly summary from Joi field errors.
 * Uses the original React Flow nodes to identify blocks by their display name.
 *
 * Example output:
 *   "Swap → missing Provider, Chain, Type\nMail → missing Recipient, Subject"
 */
function summarizeJoiErrors(fieldErrors: JoiFieldError[], nodes: Node[]): string {
  // Joi path.join('.') produces: "nodes.0.config.provider", "nodes.2.config.apiKey"
  // Joi messages use bracket notation: "nodes[0].config.provider"
  // We match BOTH formats to be safe
  const dotRegex = /^nodes\.(\d+)\.config\.(.+)$/;
  const bracketRegex = /^nodes\[(\d+)\]\.config\.(.+)$/;
  const nodeErrorMap = new Map<string, string[]>(); // nodeIndex → readable field names
  const otherErrors: string[] = [];

  for (const err of fieldErrors) {
    const match = err.field.match(dotRegex) || err.field.match(bracketRegex);
    if (match) {
      const nodeIndex = match[1];
      const fieldName = match[2];
      if (!nodeErrorMap.has(nodeIndex)) {
        nodeErrorMap.set(nodeIndex, []);
      }
      nodeErrorMap.get(nodeIndex)!.push(humanizeFieldName(fieldName));
    } else {
      // Non-node config errors (top-level like "name", "description")
      otherErrors.push(err.message);
    }
  }

  if (nodeErrorMap.size === 0 && otherErrors.length > 0) {
    return otherErrors.slice(0, 3).join(". ");
  }

  if (nodeErrorMap.size === 0) {
    return "Some fields are missing. Please review your blocks.";
  }

  // Build per-block line summaries
  const lines: string[] = [];
  for (const [indexStr, fields] of nodeErrorMap) {
    const idx = parseInt(indexStr, 10);
    // Look up the block's display name from the original nodes
    const node = nodes[idx];
    const blockName = node?.data?.label || node?.type || `Block ${idx + 1}`;

    const fieldList = fields.slice(0, 4).join(", ");
    const extra = fields.length > 4 ? ` +${fields.length - 4} more` : "";
    lines.push(`${blockName} → missing ${fieldList}${extra}`);
  }

  return lines.join("\n");
}

/**
 * Validate a workflow without saving it
 * Calls the backend POST /workflows/validate endpoint which runs:
 * 1. Joi schema validation (block config fields: provider, apiKey, etc.)
 * 2. WorkflowValidator checks (trigger integrity, graph cycles, orphaned nodes, template refs)
 */
export async function validateWorkflow(params: {
  accessToken: string;
  nodes: Node[];
  edges: Edge[];
}): Promise<ValidateWorkflowResult> {
  // Find trigger node (start node)
  const startNode = params.nodes.find(
    (n) => n.type === "start" || n.id === "start-node",
  );

  const response = await api.post<{
    data: { valid: boolean; message: string };
  }>(
    "/workflows/validate",
    {
      name: "Validation Check",
      nodes: params.nodes.map(transformNodeToBackend),
      edges: params.edges.map(transformEdgeToBackend),
      triggerNodeId: startNode?.id,
    },
    { accessToken: params.accessToken },
  );

  if (!response.ok) {
    const err = response.error;
    const errCode = err?.code;

    // ── Case 1: Joi schema validation errors (block config fields) ──
    // code = "VALIDATION_ERROR", details = Array<{field, message}>
    if (errCode === "VALIDATION_ERROR" && Array.isArray(err?.details)) {
      const fieldErrors = err.details as JoiFieldError[];
      const friendlyMessage = summarizeJoiErrors(fieldErrors, params.nodes);

      return {
        valid: false,
        message: friendlyMessage,
        errorCode: "VALIDATION_ERROR",
        fieldErrors,
      };
    }


    // ── Case 2: WorkflowValidator graph-structure errors ──
    // code = "VALIDATION_FAILED", details = {reason, nodeId, ...}
    // Note: details comes through as an object (not an array) from the error handler
    const rawDetails = (err as any)?.details;
    const reason = rawDetails?.reason as string | undefined;

    let friendlyMessage = err?.message || "Workflow validation failed";

    if (reason === "MISSING_TRIGGER") {
      friendlyMessage = "Your workflow needs a Start (trigger) block. Please add one to begin.";
    } else if (reason === "MULTIPLE_TRIGGERS") {
      friendlyMessage = "Your workflow has multiple Start blocks. Only one is allowed.";
    } else if (reason === "CIRCULAR_DEPENDENCY") {
      friendlyMessage = "Circular connection detected — a block is connecting back to itself. Please remove the loop.";
    } else if (reason === "ORPHANED_NODES") {
      const count = rawDetails?.nodeIds?.length || 0;
      friendlyMessage = `${count} block${count > 1 ? "s are" : " is"} not connected to the workflow. Connect or remove ${count > 1 ? "them" : "it"} to continue.`;
    } else if (reason === "INVALID_FORWARD_REFERENCE") {
      friendlyMessage = "A block references another block that isn't upstream. Check your template variables.";
    }

    return {
      valid: false,
      message: friendlyMessage,
      errorCode: errCode || "VALIDATION_FAILED",
      graphDetails: rawDetails as ValidationErrorDetails | undefined,
    };
  }

  return {
    valid: true,
    message: "Workflow is valid",
  };
}


/**
 * Execute a workflow
 */
export async function executeWorkflow(params: {
  workflowId: string;
  accessToken: string;
  initialInput?: Record<string, any>;
}): Promise<{
  success: boolean;
  data?: ExecuteWorkflowResponseData;
  error?: ApiError;
  statusCode?: number;
  requestId?: string;
}> {
  const response = await api.post<{
    data: ExecuteWorkflowResponseData;
    retryAfter?: number;
  }>(
    `/workflows/${params.workflowId}/execute`,
    { initialInput: params.initialInput || {} },
    { accessToken: params.accessToken },
  );

  if (!response.ok) {
    const error = response.error!;

    // Handle rate limiting (429)
    if (response.status === 429) {
      error.code = "RATE_LIMIT_EXCEEDED";
      error.message = `Rate limit exceeded. Please try again ${error.retryAfter
        ? `in ${Math.ceil(error.retryAfter / 1000)} seconds`
        : "later"
        }.`;
    }

    // Handle validation errors (400)
    if (response.status === 400 && error.code === "VALIDATION_ERROR") {
      error.message =
        "Validation failed: " +
        (error.details?.map((d) => d.message).join(", ") || error.message);
    }

    // console.error(
    //   `[${response.requestId}] Error executing workflow:`,
    //   formatErrorWithRequestId(error)
    // );

    return {
      success: false,
      error: error as ApiError,
      statusCode: response.status,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data,
    statusCode: response.status,
    requestId: response.requestId,
  };
}

/**
 * Get execution status
 */
export async function getExecutionStatus(params: {
  executionId: string;
  accessToken: string;
}): Promise<{
  success: boolean;
  data?: any;
  error?: ApiError;
  requestId?: string;
}> {
  const response = await api.get<{ data: any }>(
    `/workflows/executions/${params.executionId}`,
    { accessToken: params.accessToken },
  );

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error getting execution status:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data,
    requestId: response.requestId,
  };
}

/**
 * Save and execute workflow (convenience function)
 */
export async function saveAndExecuteWorkflow(params: {
  accessToken: string;
  workflowName: string;
  nodes: Node[];
  edges: Edge[];
  initialInput?: Record<string, any>;
}): Promise<{
  success: boolean;
  workflowId?: string;
  executionId?: string;
  data?: any;
  error?: any;
}> {
  // Step 1: Create workflow
  const createResult = await createWorkflow({
    accessToken: params.accessToken,
    name: params.workflowName,
    nodes: params.nodes,
    edges: params.edges,
  });

  if (!createResult.success) {
    return {
      success: false,
      error: createResult.error,
    };
  }

  const workflowId = createResult.data.id;

  // Step 2: Execute workflow
  const executeResult = await executeWorkflow({
    workflowId,
    accessToken: params.accessToken,
    initialInput: params.initialInput,
  });

  if (!executeResult.success) {
    return {
      success: false,
      workflowId,
      error: executeResult.error,
    };
  }

  return {
    success: true,
    workflowId,
    executionId: executeResult.data?.executionId,
    data: executeResult.data,
  };
}

// ===========================================
// WORKFLOW CRUD OPERATIONS
// ===========================================

/**
 * List all workflows for the current user
 */
export async function listWorkflows(params: {
  accessToken: string;
  limit?: number;
  offset?: number;
  category?: string;
  isActive?: boolean;
}): Promise<{
  success: boolean;
  data?: WorkflowSummary[];
  total?: number;
  error?: ApiError;
  requestId?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.set("limit", params.limit.toString());
  if (params.offset) queryParams.set("offset", params.offset.toString());
  if (params.category) queryParams.set("category", params.category);
  if (params.isActive !== undefined)
    queryParams.set("isActive", params.isActive.toString());

  const queryString = queryParams.toString();
  const url = `/workflows${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<WorkflowListResponse>(url, {
    accessToken: params.accessToken,
  });

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error listing workflows:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data || [],
    total: response.data?.meta?.total || 0,
    requestId: response.requestId,
  };
}

/**
 * Get a single workflow with all nodes and edges
 */
export async function getWorkflow(params: {
  workflowId: string;
  accessToken: string;
}): Promise<{
  success: boolean;
  data?: WorkflowDetail;
  error?: ApiError;
  requestId?: string;
}> {
  const response = await api.get<WorkflowDetailResponse>(
    `/workflows/${params.workflowId}`,
    { accessToken: params.accessToken },
  );

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error getting workflow:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data,
    requestId: response.requestId,
  };
}

/**
 * Full update a workflow (replace all nodes and edges)
 */
export async function fullUpdateWorkflow(params: {
  workflowId: string;
  accessToken: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}): Promise<{
  success: boolean;
  data?: WorkflowDetail;
  error?: ApiError;
  requestId?: string;
}> {
  // Find trigger node (start node)
  const startNode = params.nodes.find(
    (n) => n.type === "start" || n.id === "start-node",
  );

  const response = await api.put<WorkflowDetailResponse>(
    `/workflows/${params.workflowId}/full`,
    {
      name: params.name,
      description: params.description || "",
      nodes: params.nodes.map(transformNodeToBackend),
      edges: params.edges.map(transformEdgeToBackend),
      triggerNodeId: startNode?.id,
      category: params.category || "automation",
      tags: params.tags || [],
      isPublic: params.isPublic,
    },
    { accessToken: params.accessToken },
  );

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error updating workflow:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data,
    requestId: response.requestId,
  };
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(params: {
  workflowId: string;
  accessToken: string;
}): Promise<{
  success: boolean;
  error?: ApiError;
  requestId?: string;
}> {
  const response = await api.delete(`/workflows/${params.workflowId}`, {
    accessToken: params.accessToken,
  });

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error deleting workflow:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    requestId: response.requestId,
  };
}

/**
 * Get workflow execution history
 */
export async function getWorkflowExecutions(params: {
  workflowId: string;
  accessToken: string;
  limit?: number;
  offset?: number;
}): Promise<{
  success: boolean;
  data?: WorkflowExecution[];
  total?: number;
  error?: ApiError;
  requestId?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.set("limit", params.limit.toString());
  if (params.offset) queryParams.set("offset", params.offset.toString());

  const queryString = queryParams.toString();
  const url = `/workflows/${params.workflowId}/executions${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<ExecutionListResponse>(url, {
    accessToken: params.accessToken,
  });

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error getting workflow executions:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data || [],
    total: response.data?.meta?.total || 0,
    requestId: response.requestId,
  };
}

// ===========================================
// CANVAS TRANSFORMATION UTILITIES
// ===========================================

/**
 * Transform backend node to React Flow format
 * @deprecated Use transformNodeToCanvas from @/blocks/utils/backend-mapping instead
 * Re-exported for backward compatibility
 */
export { transformNodeToCanvas } from "@/blocks/utils/backend-mapping";

/**
 * Transform backend edge to React Flow format
 */
export function transformEdgeToCanvas(backendEdge: BackendEdge): Edge {
  return {
    id: backendEdge.id,
    source: backendEdge.source_node_id,
    target: backendEdge.target_node_id,
    sourceHandle: backendEdge.source_handle || undefined,
    targetHandle: backendEdge.target_handle || undefined,
    type: "smoothstep",
    animated: true,
  };
}

/**
 * Transform complete backend workflow to canvas format
 */
export function transformWorkflowToCanvas(
  workflow: Pick<WorkflowDetail, "nodes" | "edges">,
): {
  nodes: Node[];
  edges: Edge[];
} {
  return {
    nodes: workflow.nodes.map(transformNodeToCanvas),
    edges: workflow.edges.map(transformEdgeToCanvas),
  };
}

/**
 * Save workflow - creates new or updates existing
 */
export async function saveWorkflow(params: {
  workflowId?: string | null;
  accessToken: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}): Promise<{
  success: boolean;
  workflowId?: string;
  data?: WorkflowDetail;
  error?: ApiError;
  requestId?: string;
  isNew?: boolean;
}> {
  // If we have a workflow ID, update; otherwise create
  if (params.workflowId) {
    const result = await fullUpdateWorkflow({
      workflowId: params.workflowId,
      accessToken: params.accessToken,
      name: params.name,
      description: params.description,
      nodes: params.nodes,
      edges: params.edges,
      category: params.category,
      tags: params.tags,
      isPublic: params.isPublic,
    });

    return {
      ...result,
      workflowId: params.workflowId,
      isNew: false,
    };
  } else {
    const result = await createWorkflow({
      accessToken: params.accessToken,
      name: params.name,
      description: params.description,
      nodes: params.nodes,
      edges: params.edges,
      isPublic: params.isPublic,
      tags: params.tags,
    });

    return {
      success: result.success,
      workflowId: result.data?.id,
      data: result.data,
      error: result.error,
      requestId: result.requestId,
      isNew: true,
    };
  }
}

/**
 * List public workflows (no authentication required)
 */
export async function listPublicWorkflows(params: {
  q?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  success: boolean;
  data?: PublicWorkflowSummary[];
  total?: number;
  error?: ApiError;
  requestId?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params.q) queryParams.set("q", params.q);
  if (params.tag) queryParams.set("tag", params.tag);
  if (params.limit) queryParams.set("limit", params.limit.toString());
  if (params.offset) queryParams.set("offset", params.offset.toString());

  const queryString = queryParams.toString();
  const url = `/workflows/public${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<PublicWorkflowListResponse>(url, {
    // No accessToken required
  });

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error listing public workflows:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data || [],
    total: response.data?.meta?.total || 0,
    requestId: response.requestId,
  };
}

/**
 * Get a public workflow detail (no authentication required)
 */
export async function getPublicWorkflow(params: {
  workflowId: string;
}): Promise<{
  success: boolean;
  data?: PublicWorkflowDetail;
  error?: ApiError;
  requestId?: string;
}> {
  const response = await api.get<PublicWorkflowDetailResponse>(
    `/workflows/public/${params.workflowId}`,
    {
      // No accessToken required
    },
  );

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error getting public workflow:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data,
    requestId: response.requestId,
  };
}

/**
 * Get version history for a public workflow (no authentication required)
 */
export async function getPublicWorkflowVersions(params: {
  workflowId: string;
}): Promise<{
  success: boolean;
  currentVersion?: number;
  versions?: WorkflowVersionSummary[];
  error?: ApiError;
  requestId?: string;
}> {
  const response = await api.get<{
    data: { currentVersion: number; versions: WorkflowVersionSummary[] };
  }>(`/workflows/public/${params.workflowId}/versions`, {
    // No accessToken required
  });

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error fetching public workflow versions:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    currentVersion: response.data?.data?.currentVersion,
    versions: response.data?.data?.versions || [],
    requestId: response.requestId,
  };
}

export interface PublicWorkflowVersionDetail {
  versionNumber: number;
  isCurrent: boolean;
  nodes: BackendNode[];
  edges: BackendEdge[];
  metadata: {
    name?: string;
    description?: string;
  };
  createdAt?: string;
}

/**
 * Get a specific version of a public workflow (no authentication required)
 */
export async function getPublicWorkflowVersion(params: {
  workflowId: string;
  versionNumber: number;
}): Promise<{
  success: boolean;
  data?: PublicWorkflowVersionDetail;
  error?: ApiError;
  requestId?: string;
}> {
  const response = await api.get<{ data: PublicWorkflowVersionDetail }>(
    `/workflows/public/${params.workflowId}/versions/${params.versionNumber}`,
    {
      // No accessToken required
    },
  );

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error fetching public workflow version:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data,
    requestId: response.requestId,
  };
}

/**
 * Clone a public workflow to the user's account
 */
export async function clonePublicWorkflow(params: {
  workflowId: string;
  accessToken: string;
}): Promise<{
  success: boolean;
  newWorkflowId?: string;
  data?: WorkflowDetail;
  error?: ApiError;
  requestId?: string;
}> {
  const response = await api.post<{ data: WorkflowDetail }>(
    `/workflows/public/${params.workflowId}/clone`,
    {},
    { accessToken: params.accessToken },
  );

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error cloning public workflow:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    newWorkflowId: response.data?.data?.id,
    data: response.data?.data,
    requestId: response.requestId,
  };
}

// ===========================================
// WORKFLOW VERSION HISTORY
// ===========================================

export interface WorkflowVersionSummary {
  id: string;
  version_number: number;
  change_summary: string | null;
  created_at: string;
  created_by: string | null;
}

export interface WorkflowVersionDetail {
  id: string;
  workflowId: string;
  versionNumber: number;
  changeSummary: string | null;
  nodes: BackendNode[];
  edges: BackendEdge[];
  metadata: Record<string, any> | null;
  createdAt: string;
  createdBy: string | null;
}

/**
 * Get workflow version history
 */
export async function getWorkflowVersions(params: {
  workflowId: string;
  accessToken: string;
}): Promise<{
  success: boolean;
  currentVersion?: number;
  versions?: WorkflowVersionSummary[];
  error?: ApiError;
  requestId?: string;
}> {
  const response = await api.get<{
    data: { currentVersion: number; versions: WorkflowVersionSummary[] };
  }>(`/workflows/${params.workflowId}/versions`, {
    accessToken: params.accessToken,
  });

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error fetching workflow versions:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    currentVersion: response.data?.data?.currentVersion,
    versions: response.data?.data?.versions || [],
    requestId: response.requestId,
  };
}

/**
 * Restore workflow to a previous version
 */
export async function restoreWorkflowVersion(params: {
  workflowId: string;
  versionNumber: number;
  accessToken: string;
}): Promise<{
  success: boolean;
  newVersion?: number;
  error?: ApiError;
  requestId?: string;
}> {
  const response = await api.post<{
    data: {
      workflowId: string;
      restoredFromVersion: number;
      newVersion: number;
    };
  }>(
    `/workflows/${params.workflowId}/versions/${params.versionNumber}/restore`,
    {},
    { accessToken: params.accessToken },
  );

  if (!response.ok) {
    // console.error(
    //   `[${response.requestId}] Error restoring workflow version:`,
    //   formatErrorWithRequestId(response.error!)
    // );
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    newVersion: response.data?.data?.newVersion,
    requestId: response.requestId,
  };
}
