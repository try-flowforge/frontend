"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowInstance,
} from "reactflow";
import { getBlockById as getBlockByIdFromRegistry, getCategories } from "@/blocks/registry";
import { generateIconRegistry } from "@/blocks/registry";
import type { BlockDefinition } from "@/blocks/types";
import { WorkflowExecution } from "@/types/workflow";
import { BlockProvider, useBlock } from "@/blocks/context";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
// import { isTestnet, isMainnet, CHAIN_IDS } from "@/web3/chains";
import { SaveWorkflowModal } from "@/components/workspace/SaveWorkflowModal";
import { useCanvasDimensions } from "@/hooks/useCanvasDimensions";
import { useUnsavedChanges } from "@/hooks/useWorkflowState";
import { calculateCanvasCenter } from "@/utils/canvas";
import { saveWorkflow, saveAndExecuteWorkflow, getWorkflow, transformWorkflowToCanvas, getExecutionStatus } from "../utils/workflow-api";
import { useToast } from "./ToastContext";
import { LuSquareCheck, LuClock } from "react-icons/lu";

// The Start node ID - used to identify and protect it from deletion
const START_NODE_ID = "start-node";

// Initial nodes include the Start node which is always present
const getInitialNodes = (): Node[] => {
  const startBlock = getBlockByIdFromRegistry("start");
  if (!startBlock) {
    return [];
  }
  return [
    {
      id: START_NODE_ID,
      type: "start",
      position: { x: 100, y: 200 },
      data: {
        ...startBlock.defaultData,
        blockId: startBlock.id,
        iconName: startBlock.iconName,
      },
      deletable: false,
    },
  ];
};
const initialNodes: Node[] = getInitialNodes();
const initialEdges: Edge[] = [];

// Define handler types for React Flow events
type OnNodeClick = (event: React.MouseEvent, node: Node) => void;
type OnPaneClick = (event: React.MouseEvent) => void;
type OnNodeContextMenu = (event: React.MouseEvent, node: Node) => void;
type OnEdgeContextMenu = (event: React.MouseEvent, edge: Edge) => void;

export type ContextMenuState =
  | { type: "node"; node: Node; x: number; y: number }
  | { type: "edge"; edge: Edge; x: number; y: number }
  | null;

export interface WorkflowContextType {
  // State
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  lastSaved: Date | null;
  mobileMenuOpen: boolean;
  workflowName: string;
  setWorkflowName: (name: string) => void;
  workflowDescription: string;
  setWorkflowDescription: (description: string) => void;
  workflowTags: string[];
  setWorkflowTags: (tags: string[]) => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;

  // Workflow management state
  currentWorkflowId: string | null;
  setCurrentWorkflowId: (id: string | null) => void;
  workflowVersion: number;
  isSaving: boolean;
  isLoading: boolean;
  isPublic: boolean;
  setIsPublic: (isPublic: boolean) => void;

  // Canvas dimensions
  canvasDimensions: ReturnType<typeof useCanvasDimensions>;

  // Actions - Node management
  setNodes: ReturnType<typeof useNodesState>[1];
  setEdges: ReturnType<typeof useEdgesState>[1];
  onNodesChange: ReturnType<typeof useNodesState>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  setSelectedNode: (node: Node | null) => void;
  handleNodeClick: OnNodeClick;
  handlePaneClick: OnPaneClick;
  handleNodeContextMenu: OnNodeContextMenu;
  handleEdgeContextMenu: OnEdgeContextMenu;
  handlePaneContextMenu: (event: React.MouseEvent) => void;
  handleNodeDataChange: (nodeId: string, data: Record<string, unknown>) => void;
  deleteNodes: (nodeIds: string[]) => void;
  onNodesDelete: (deleted: Node[]) => void;
  deleteEdge: (edgeId: string) => void;
  contextMenu: ContextMenuState;
  closeContextMenu: () => void;

  // Actions - Canvas operations
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleFitView: () => void;
  handleReactFlowInit: (instance: ReactFlowInstance) => void;

  // Actions - Workflow operations
  handleSave: () => Promise<void>;
  handleRun: () => void;
  loadWorkflow: (workflowId: string) => Promise<boolean>;
  resetWorkflow: () => void;

  applyGeneratedWorkflow: (params: {
    workflowName: string;
    steps: { blockId: string }[];
  }) => boolean;

  // Actions - Block operations
  handleBlockClick: (block: BlockDefinition) => void;
  handleBlockDragStart: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onConnect: (connection: Parameters<typeof addEdge>[0]) => void;

  // Actions - UI state
  setMobileMenuOpen: (open: boolean) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Workflow execution state
  currentExecution: WorkflowExecution | null;
  setCurrentExecution: (execution: WorkflowExecution | null) => void;

  // Utilities
  isProtectedNode: (nodeId: string) => boolean;
  isBlockDisabled: (blockId: string) => boolean;
  isSwapBlockDisabled: (blockId: string) => boolean;
  categories: Array<{
    id: string;
    label: string;
    icon: React.ReactNode | null;
  }>;
  hasUnsavedChanges: boolean;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(
  undefined
);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within WorkflowProvider");
  }
  return context;
};

const WorkflowProviderInner: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { getBlockById } = useBlock();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState<string>("Untitled Workflow");
  const [workflowDescription, setWorkflowDescription] = useState<string>("");
  const [workflowTags, setWorkflowTags] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Workflow management state
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null);
  const [workflowVersion, setWorkflowVersion] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Undo / Redo history (snapshots of { nodes, edges })
  const undoStackRef = useRef<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const redoStackRef = useRef<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [undoStackLength, setUndoStackLength] = useState(0);
  const [redoStackLength, setRedoStackLength] = useState(0);

  const pushUndo = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    undoStackRef.current.push(
      JSON.parse(JSON.stringify({ nodes: currentNodes, edges: currentEdges }))
    );
    redoStackRef.current = [];
    setUndoStackLength(undoStackRef.current.length);
    setRedoStackLength(0);
  }, []);

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const snapshot = undoStackRef.current.pop();
    if (!snapshot) return;
    redoStackRef.current.push(
      JSON.parse(JSON.stringify({ nodes, edges }))
    );
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setUndoStackLength(undoStackRef.current.length);
    setRedoStackLength(redoStackRef.current.length);
  }, [nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const snapshot = redoStackRef.current.pop();
    if (!snapshot) return;
    undoStackRef.current.push(
      JSON.parse(JSON.stringify({ nodes, edges }))
    );
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setUndoStackLength(undoStackRef.current.length);
    setRedoStackLength(redoStackRef.current.length);
  }, [nodes, edges, setNodes, setEdges]);

  const canUndo = undoStackLength > 0;
  const canRedo = redoStackLength > 0;

  // Refs to track the selected node without causing re-renders
  const selectedNodeIdRef = useRef<string | null>(null);
  const selectedNodeRef = useRef<Node | null>(null);
  const pendingUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    selectedNodeIdRef.current = selectedNode?.id ?? null;
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (pendingUpdateTimeoutRef.current) {
        clearTimeout(pendingUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Responsive canvas dimensions hook
  const canvasDimensions = useCanvasDimensions();

  // Warn users when leaving with unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return nodes.length > 1 && !lastSaved;
  }, [nodes.length, lastSaved]);

  useUnsavedChanges({ hasUnsavedChanges });

  // Canvas control handlers
  const handleZoomIn = useCallback(() => {
    reactFlowInstanceRef.current?.zoomIn();
    // Update zoom level after zoom
    setTimeout(() => {
      const zoom = reactFlowInstanceRef.current?.getZoom();
      if (zoom !== undefined) {
        setZoomLevel(Math.round(zoom * 100));
      }
    }, 0);
  }, []);

  const handleZoomOut = useCallback(() => {
    reactFlowInstanceRef.current?.zoomOut();
    // Update zoom level after zoom
    setTimeout(() => {
      const zoom = reactFlowInstanceRef.current?.getZoom();
      if (zoom !== undefined) {
        setZoomLevel(Math.round(zoom * 100));
      }
    }, 0);
  }, []);

  const handleFitView = useCallback(() => {
    reactFlowInstanceRef.current?.fitView({ padding: 0.2 });
    // Update zoom level after fit view
    setTimeout(() => {
      const zoom = reactFlowInstanceRef.current?.getZoom();
      if (zoom !== undefined) {
        setZoomLevel(Math.round(zoom * 100));
      }
    }, 100);
  }, []);

  const handleReactFlowInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstanceRef.current = instance;
    // Initialize zoom level
    const zoom = instance.getZoom();
    if (zoom !== undefined) {
      setZoomLevel(Math.round(zoom * 100));
    }
  }, []);

  // Get Privy access token function (must be declared before handlers that use it)
  const { getPrivyAccessToken, authenticated } = usePrivyWallet();
  const { success: successToast, error: errorToast, info: infoToast } = useToast();

  const handleSave = useCallback(async () => {
    // Check if user is authenticated
    if (!authenticated) {
      // alert("Please log in to save workflows");
      return;
    }

    // Open the save modal
    setShowSaveModal(true);
  }, [authenticated]);

  const handleSaveConfirm = useCallback(async (params: {
    workflowName: string;
    isPublic: boolean;
    description?: string;
    tags?: string[];
  }) => {
    // Get the access token
    const accessToken = await getPrivyAccessToken();
    if (!accessToken) {
      // alert("Unable to authenticate. Please try logging in again.");
      setShowSaveModal(false);
      return;
    }

    setIsSaving(true);
    setShowSaveModal(false);

    try {


      const result = await saveWorkflow({
        workflowId: currentWorkflowId,
        accessToken,
        name: params.workflowName, // Use the workflow name from modal
        description: params.description,
        tags: params.tags,
        nodes,
        edges,
        isPublic: params.isPublic,
      });

      if (result.success) {
        setLastSaved(new Date());
        setWorkflowName(params.workflowName); // Update context with new name
        if (result.workflowId && !currentWorkflowId) {
          setCurrentWorkflowId(result.workflowId);
        }
        // Increment version after save (backend increments on update)
        if (result.data?.version) {
          setWorkflowVersion(result.data.version);
        } else if (currentWorkflowId) {
          // If updating existing workflow, increment local version
          setWorkflowVersion((prev) => prev + 1);
        }
        // console.log("Workflow saved successfully!", result);
      } else {
        // console.error("Failed to save workflow:", result.error);
        // alert(`Failed to save workflow: ${result.error?.message || "Unknown error"}`);
      }
    } catch {
      // console.error("Error saving workflow:", error);
      // alert(`Error saving workflow: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, currentWorkflowId, getPrivyAccessToken]);

  const handleRun = useCallback(() => {
    const executeWorkflowHandler = async () => {
      try {
        // console.log("Running workflow...", { nodes, edges });

        // Check if user is authenticated
        if (!authenticated) {
          // alert("Please log in to run workflows");
          return;
        }

        // Get the access token
        const accessToken = await getPrivyAccessToken();
        if (!accessToken) {
          // alert("Unable to authenticate. Please try logging in again.");
          return;
        }

        const result = await saveAndExecuteWorkflow({
          accessToken,
          workflowName: workflowName || `Workflow ${new Date().toLocaleDateString()}`,
          nodes,
          edges,
          initialInput: {
            amount: 150,
            status: "active",
            email: "test@example.com",
          },
        });

        if (result.success) {
          successToast(
            "Workflow started",
            `Execution ID: ${result.executionId?.substring(0, 8)}...`
          );

          // Start monitoring the execution
          if (result.executionId) {
            monitorExecution(result.executionId, accessToken);
          }
        } else {
          errorToast(
            "Workflow execution failed",
            result.error?.message || "Unknown error"
          );
        }
      } catch (err) {
        errorToast(
          "Failed to execute workflow",
          err instanceof Error ? err.message : String(err)
        );
      }
    };

    executeWorkflowHandler();
  }, [nodes, edges, workflowName, authenticated, getPrivyAccessToken, successToast, errorToast, infoToast]);

  // Monitor workflow execution status
  const monitorExecution = useCallback(async (executionId: string, accessToken: string) => {
    let pollingCount = 0;
    const maxPolling = 30; // Poll for 30 seconds
    const interval = 1000; // 1 second

    const poll = async () => {
      if (pollingCount >= maxPolling) return;
      pollingCount++;

      try {
        const statusResult = await getExecutionStatus({ executionId, accessToken });
        if (statusResult.success && statusResult.data) {
          const execution = statusResult.data as WorkflowExecution;
          setCurrentExecution(execution);
          const status = execution.status;

          if (status === 'WAITING_FOR_SIGNATURE') {
            const pendingNodeExec = execution.node_executions?.find(ne => ne.status === 'WAITING_FOR_SIGNATURE') ||
              (execution as any).nodeExecutions?.find((ne: any) => ne.status === 'WAITING_FOR_SIGNATURE');

            if (pendingNodeExec) {
              const pendingNodeId = pendingNodeExec.node_id || pendingNodeExec.nodeId;
              // Find the actual Node object from the nodes array
              const nodeToSelect = nodes.find(n => n.id === pendingNodeId);
              if (nodeToSelect) {
                setSelectedNode(nodeToSelect);
              }
            }

            infoToast(
              "Signature Required",
              "A swap node in your workflow requires your signature to proceed. Please sign the transaction in the sidebar.",
              0 // Don't auto-dismiss
            );
            return; // Stop polling once we hit waiting state
          }

          if (status === 'SUCCESS') {
            successToast("Workflow completed", "Execution finished successfully.");
            return;
          }

          if (status === 'FAILED') {
            errorToast("Workflow failed", statusResult.data.error?.message || "Execution failed.");
            return;
          }

          // Continue polling if still running
          if (status === 'RUNNING' || status === 'PENDING') {
            setTimeout(poll, interval);
          }
        }
      } catch (e) {
        console.error("Error polling execution status:", e);
      }
    };

    poll();
  }, [successToast, errorToast, infoToast, nodes]);

  // Load workflow from backend
  const loadWorkflow = useCallback(async (workflowId: string): Promise<boolean> => {
    if (!authenticated) {
      // alert("Please log in to load workflows");
      return false;
    }

    const accessToken = await getPrivyAccessToken();
    if (!accessToken) {
      // alert("Unable to authenticate. Please try logging in again.");
      return false;
    }

    setIsLoading(true);

    try {
      const result = await getWorkflow({ workflowId, accessToken });

      if (result.success && result.data) {
        const { nodes: loadedNodes, edges: loadedEdges } = transformWorkflowToCanvas(result.data);

        setNodes(loadedNodes);
        setEdges(loadedEdges);
        undoStackRef.current = [];
        redoStackRef.current = [];
        setUndoStackLength(0);
        setRedoStackLength(0);
        setWorkflowName(result.data.name);
        setWorkflowDescription(result.data.description || "");
        setWorkflowTags(result.data.tags || []);
        setCurrentWorkflowId(workflowId);
        setWorkflowVersion(result.data.version || 1);
        setIsPublic(result.data.is_public || false);
        setLastSaved(new Date(result.data.updated_at));
        setSelectedNode(null);

        // console.log("Workflow loaded successfully:", result.data);
        return true;
      } else {
        // console.error("Failed to load workflow:", result.error);
        // alert(`Failed to load workflow: ${result.error?.message || "Unknown error"}`);
        return false;
      }
    } catch {
      // console.error("Error loading workflow:", error);
      // alert(`Error loading workflow: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, getPrivyAccessToken, setNodes, setEdges]);

  // Reset workflow to initial state
  const resetWorkflow = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    undoStackRef.current = [];
    redoStackRef.current = [];
    setUndoStackLength(0);
    setRedoStackLength(0);
    setCurrentWorkflowId(null);
    setWorkflowVersion(1);
    setIsPublic(false);
    setWorkflowName("Untitled Workflow");
    setWorkflowDescription("");
    setWorkflowTags([]);
    setLastSaved(null);
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  // Apply AI-generated workflow (linear steps) to the canvas
  const applyGeneratedWorkflow = useCallback(
    (params: { workflowName: string; steps: { blockId: string }[] }): boolean => {
      const { workflowName: name, steps } = params;
      if (!steps.length) return false;

      const startNode = initialNodes[0];
      if (!startNode) return false;

      // Tighter spacing so edges are short and nodes visibly connected; fitView will zoom to fit
      const H_GAP = 180;
      const startX = 60;
      const startY = 120;

      const newNodes: Node[] = [{ ...startNode, position: { x: startX, y: startY } }];
      const newEdges: Edge[] = [];

      steps.forEach((step, i) => {
        // Map generic "ai-transform" to first available AI block
        const blockId =
          step.blockId === "ai-transform"
            ? "ai-openai-chatgpt"
            : step.blockId;
        const blockDef = getBlockByIdFromRegistry(blockId);
        if (!blockDef) return;

        if (blockDef.nodeType === "wallet-node") {
          const hasWallet = newNodes.some((n) => n.type === "wallet-node");
          if (hasWallet) return;
        }

        const nodeId = `${step.blockId}-${Date.now()}-${i}`;
        const position = {
          x: startX + (i + 1) * H_GAP,
          y: startY,
        };

        newNodes.push({
          id: nodeId,
          type: blockDef.nodeType || "base",
          position,
          data: {
            ...blockDef.defaultData,
            blockId: blockDef.id,
            iconName: blockDef.iconName,
          },
        });

        const sourceId = i === 0 ? START_NODE_ID : newNodes[i].id;
        const targetId = nodeId;
        newEdges.push({
          id: `e-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#ffffff", strokeWidth: 0.5 },
        });
      });

      if (newNodes.length <= 1) return false;

      pushUndo(nodes, edges);
      setNodes(newNodes);
      setEdges(newEdges);
      setWorkflowName(name || "Untitled Workflow");
      undoStackRef.current = [];
      redoStackRef.current = [];
      setUndoStackLength(0);
      setRedoStackLength(0);
      setSelectedNode(null);

      // Zoom to fit after React has rendered the new nodes so edges are short and graph is visible
      setTimeout(() => {
        reactFlowInstanceRef.current?.fitView({ padding: 0.25, duration: 200 });
        const zoom = reactFlowInstanceRef.current?.getZoom();
        if (zoom !== undefined) {
          setZoomLevel(Math.round(zoom * 100));
        }
      }, 100);

      return true;
    },
    [nodes, edges, setNodes, setEdges, pushUndo]
  );

  // Check if a node is protected from deletion
  const isProtectedNode = useCallback((nodeId: string): boolean => {
    return nodeId === START_NODE_ID;
  }, []);

  // Shared utility to delete nodes and their connected edges
  const deleteNodes = useCallback(
    (nodeIds: string[]) => {
      const deletableIds = nodeIds.filter((id) => !isProtectedNode(id));

      if (deletableIds.length === 0) {
        // console.log("Cannot delete Start node");
        return;
      }

      pushUndo(nodes, edges);
      setNodes((nds) => nds.filter((n) => !deletableIds.includes(n.id)));
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !deletableIds.includes(edge.source) &&
            !deletableIds.includes(edge.target)
        )
      );
      // Clear selection if the selected node was deleted
      if (
        selectedNodeIdRef.current &&
        deletableIds.includes(selectedNodeIdRef.current)
      ) {
        setSelectedNode(null);
      }
    },
    [nodes, edges, setNodes, setEdges, isProtectedNode, pushUndo]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTypingInInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }

      // Ctrl/Cmd + Enter: Run
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }

      // Escape: Close modals/panels
      if (e.key === "Escape") {
        setSelectedNode(null);
        setMobileMenuOpen(false);
      }

      // Delete/Backspace: Delete selected node
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedNodeIdRef.current &&
        !isTypingInInput
      ) {
        e.preventDefault();
        deleteNodes([selectedNodeIdRef.current]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handleRun, deleteNodes]);

  // Handle block click to add (mobile tap-to-add)
  const handleBlockClick = useCallback(
    (block: BlockDefinition) => {
      if (!reactFlowInstanceRef.current) {
        return;
      }

      const blockDefinition = getBlockById(block.id);
      if (!blockDefinition) {
        return;
      }

      // Guard: prevent duplicate wallet blocks
      if (blockDefinition.nodeType === "wallet-node") {
        const walletNodeExists = nodes.some((n) => n.type === "wallet-node");
        if (walletNodeExists) {
          // console.warn("Wallet block already exists on canvas");
          return;
        }
      }

      const canvasCenter = calculateCanvasCenter(
        reactFlowInstanceRef.current,
        canvasDimensions,
        null
      );

      const newNode: Node = {
        id: `${block.id}-${Date.now()}`,
        type: blockDefinition.nodeType || "base",
        position: canvasCenter,
        data: {
          ...blockDefinition.defaultData,
          blockId: block.id,
          iconName: blockDefinition.iconName,
        },
      };

      pushUndo(nodes, edges);
      setNodes((nds) => nds.concat(newNode));
      setMobileMenuOpen(false);
    },
    [nodes, edges, setNodes, canvasDimensions, getBlockById, pushUndo]
  );

  // React Flow's built-in node deletion handler
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const deletedIds = deleted.map((node) => node.id);
      deleteNodes(deletedIds);
    },
    [deleteNodes]
  );

  const onConnect = useCallback(
    (connection: Parameters<typeof addEdge>[0]) => {
      pushUndo(nodes, edges);
      setEdges((eds) => {
        // Use a visible color for edges - white for dark background
        const baseEdge = {
          ...connection,
          type: "smoothstep",
          animated: true,
          style: {
            stroke: "#ffffff",
            strokeWidth: 0.5,
          },
        };

        const sourceNode = nodes.find((n) => n.id === connection.source);

        // If the source is an If node, add a label based on the sourceHandle
        if (
          sourceNode &&
          (sourceNode.type === "if" || sourceNode.data?.blockId === "if")
        ) {
          if (connection.sourceHandle === "true") {
            return addEdge(
              {
                ...baseEdge,
                label: "True",
                labelStyle: { fill: "#10b981", fontWeight: 600, fontSize: 6 },
                labelBgStyle: { fill: "#064e3b", fillOpacity: 0.8 },
                style: { stroke: "#10b981", strokeWidth: 0.5 },
              } as Edge,
              eds
            );
          } else if (connection.sourceHandle === "false") {
            return addEdge(
              {
                ...baseEdge,
                label: "False",
                labelStyle: { fill: "#ef4444", fontWeight: 600, fontSize: 6 },
                labelBgStyle: { fill: "#7f1d1d", fillOpacity: 0.8 },
                style: { stroke: "#ef4444", strokeWidth: 0.5 },
              } as Edge,
              eds
            );
          }
        }

        // If the source is a Switch node, add label based on the case
        if (
          sourceNode &&
          (sourceNode.type === "switch" ||
            sourceNode.data?.blockId === "switch")
        ) {
          const cases =
            (sourceNode.data?.cases as Array<{
              id: string;
              label: string;
              isDefault?: boolean;
            }>) || [];

          // Sort cases to ensure default is first
          const sortedCases = [...cases].sort((a, b) => {
            if (a.isDefault) return -1;
            if (b.isDefault) return 1;
            return 0;
          });

          // Find the matched case by sourceHandle ID
          const matchedCase = sortedCases.find(
            (c) => c.id === connection.sourceHandle
          );

          if (matchedCase) {
            const caseColors = [
              { stroke: "#3b82f6", fill: "#1e40af" },
              { stroke: "#22c55e", fill: "#166534" },
              { stroke: "#eab308", fill: "#854d0e" },
              { stroke: "#a855f7", fill: "#6b21a8" },
            ];

            // Get the index for non-default cases
            const nonDefaultCases = sortedCases.filter((c) => !c.isDefault);
            const caseIndex = nonDefaultCases.findIndex((c) => c.id === matchedCase.id);
            const isDefault = matchedCase.isDefault;

            const color = isDefault
              ? { stroke: "#6b7280", fill: "#374151" }
              : caseColors[caseIndex % caseColors.length];

            return addEdge(
              {
                ...baseEdge,
                label: matchedCase.label,
                labelStyle: {
                  fill: color.stroke,
                  fontWeight: 600,
                  fontSize: 6,
                },
                labelBgStyle: { fill: color.fill, fillOpacity: 0.8 },
                style: { stroke: color.stroke, strokeWidth: 0.5 },
              } as Edge,
              eds
            );
          }
        }

        return addEdge(baseEdge, eds);
      });
    },
    [nodes, edges, setEdges, pushUndo]
  );

  // Handle block drag and drop to canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const blockData = event.dataTransfer.getData("application/reactflow");
      if (!blockData || !reactFlowInstanceRef.current) {
        return;
      }

      try {
        const block: BlockDefinition = JSON.parse(blockData);
        const blockDefinition = getBlockById(block.id);

        if (!blockDefinition) {
          return;
        }

        // Guard: prevent duplicate wallet blocks
        if (blockDefinition.nodeType === "wallet-node") {
          const walletNodeExists = nodes.some((n) => n.type === "wallet-node");
          if (walletNodeExists) {
            // console.warn("Wallet block already exists on canvas");
            return;
          }
        }

        const reactFlowBounds = (
          event.currentTarget as HTMLElement
        ).getBoundingClientRect();
        const position = reactFlowInstanceRef.current.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode: Node = {
          id: `${block.id}-${Date.now()}`,
          type: blockDefinition.nodeType || "base",
          position,
          data: {
            ...blockDefinition.defaultData,
            blockId: block.id,
            iconName: blockDefinition.iconName,
          },
        };

        pushUndo(nodes, edges);
        setNodes((nds) => nds.concat(newNode));
      } catch {
        // console.error("Error dropping block:", error);
      }
    },
    [nodes, edges, setNodes, getBlockById, pushUndo]
  );

  const handleBlockDragStart = useCallback(() => {
    // Optional: Add visual feedback or tracking
  }, []);

  // Get current network from user menu
  // const { chainId } = usePrivyWallet();

  // Check if a swap block is disabled based on network availability
  const isSwapBlockDisabled = useCallback(
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_blockId: string): boolean => {
      // Keep all swap blocks enabled for all networks as per user request
      return false;
    },
    []
  );

  // Check if block is disabled
  const isBlockDisabled = useCallback(
    (blockId: string) => {
      if (blockId === "wallet") {
        return nodes.some((n) => n.type === "wallet-node");
      }

      // All blocks enabled across all networks as per user request
      return isSwapBlockDisabled(blockId);
    },
    [nodes, isSwapBlockDisabled]
  );

  // Handle node click - select node
  const handleNodeClick: OnNodeClick = useCallback((_event, node) => {
    setSelectedNode(node);
  }, []);

  // Handle pane click - deselect node
  const handlePaneClick: OnPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleNodeContextMenu: OnNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      setContextMenu({ type: "node", node, x: event.clientX, y: event.clientY });
    },
    []
  );

  const handleEdgeContextMenu: OnEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      setContextMenu({ type: "edge", edge, x: event.clientX, y: event.clientY });
    },
    []
  );

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu(null);
  }, []);

  const deleteEdge = useCallback(
    (edgeId: string) => {
      pushUndo(nodes, edges);
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      closeContextMenu();
    },
    [nodes, edges, setEdges, closeContextMenu, pushUndo]
  );

  // Handle node data change from right sidebar
  const handleNodeDataChange = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      pushUndo(nodes, edges);
      setNodes((nds) => {
        const updatedNodes = nds.map((node) =>
          node.id === nodeId
            ? {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            }
            : node
        );

        if (selectedNodeIdRef.current === nodeId) {
          const updatedNode = updatedNodes.find((n) => n.id === nodeId);
          if (updatedNode) {
            if (pendingUpdateTimeoutRef.current) {
              clearTimeout(pendingUpdateTimeoutRef.current);
            }
            pendingUpdateTimeoutRef.current = setTimeout(() => {
              setSelectedNode(updatedNode);
              pendingUpdateTimeoutRef.current = null;
            }, 0);
          }
        }

        return updatedNodes;
      });
    },
    [nodes, edges, setNodes, pushUndo]
  );

  // Sync selectedNode with nodes array when nodes change
  useEffect(() => {
    const currentSelectedId = selectedNodeIdRef.current;
    const previousSelectedNode = selectedNodeRef.current;
    if (!currentSelectedId) return;

    const nodeInArray = nodes.find((n) => n.id === currentSelectedId);

    if (!nodeInArray) {
      queueMicrotask(() => setSelectedNode(null));
      selectedNodeRef.current = null;
    } else if (nodeInArray !== previousSelectedNode) {
      queueMicrotask(() => setSelectedNode(nodeInArray));
      selectedNodeRef.current = nodeInArray;
    }
  }, [nodes]);

  // Build categories dynamically from block registry
  const categories = useMemo(() => {
    const allCategory = {
      id: "all",
      label: "All",
      icon: <LuSquareCheck className="w-4 h-4" />,
    };

    const blockCategories = getCategories();
    const iconRegistry = generateIconRegistry();

    const dynamicCategories = blockCategories.map((cat) => {
      const IconComponent = cat.iconName ? iconRegistry[cat.iconName] : null;
      return {
        id: cat.id,
        label: cat.label,
        icon: IconComponent ? <IconComponent className="w-4 h-4" /> : null,
      };
    });

    // Add Coming Soon category at the end
    const comingSoonCategory = {
      id: "coming-soon",
      label: "Coming Soon",
      icon: <LuClock className="w-4 h-4" />,
    };

    return [allCategory, ...dynamicCategories, comingSoonCategory];
  }, []);

  const contextValue = useMemo<WorkflowContextType>(
    () => ({
      nodes,
      edges,
      selectedNode,
      lastSaved,
      mobileMenuOpen,
      workflowName,
      setWorkflowName,
      workflowDescription,
      setWorkflowDescription,
      workflowTags,
      setWorkflowTags,
      zoomLevel,
      setZoomLevel,
      // Workflow management state
      currentWorkflowId,
      setCurrentWorkflowId,
      currentExecution,
      setCurrentExecution,
      workflowVersion,
      isSaving,
      isLoading,
      isPublic,
      setIsPublic,
      canvasDimensions,
      setNodes,
      setEdges,
      onNodesChange,
      onEdgesChange,
      setSelectedNode,
      handleNodeClick,
      handlePaneClick,
      handleNodeContextMenu,
      handleEdgeContextMenu,
      handlePaneContextMenu,
      handleNodeDataChange,
      deleteNodes,
      onNodesDelete,
      deleteEdge,
      contextMenu,
      closeContextMenu,
      handleZoomIn,
      handleZoomOut,
      handleFitView,
      handleReactFlowInit,
      handleSave,
      handleRun,
      loadWorkflow,
      resetWorkflow,
      applyGeneratedWorkflow,
      handleBlockClick,
      handleBlockDragStart,
      onDragOver,
      onDrop,
      onConnect,
      setMobileMenuOpen,
      undo,
      redo,
      canUndo,
      canRedo,
      isProtectedNode,
      isBlockDisabled,
      isSwapBlockDisabled,
      categories,
      hasUnsavedChanges,
    }),
    [
      nodes,
      edges,
      selectedNode,
      lastSaved,
      mobileMenuOpen,
      workflowName,
      zoomLevel,
      currentWorkflowId,
      currentExecution,
      setCurrentExecution,
      workflowVersion,
      isSaving,
      isLoading,
      canvasDimensions,
      setNodes,
      setEdges,
      onNodesChange,
      onEdgesChange,
      handleNodeClick,
      handlePaneClick,
      handleNodeContextMenu,
      handleEdgeContextMenu,
      handlePaneContextMenu,
      handleNodeDataChange,
      deleteNodes,
      onNodesDelete,
      deleteEdge,
      contextMenu,
      closeContextMenu,
      handleZoomIn,
      handleZoomOut,
      handleFitView,
      handleReactFlowInit,
      handleSave,
      handleRun,
      loadWorkflow,
      resetWorkflow,
      applyGeneratedWorkflow,
      handleBlockClick,
      handleBlockDragStart,
      onDragOver,
      onDrop,
      onConnect,
      undo,
      redo,
      canUndo,
      canRedo,
      isProtectedNode,
      isBlockDisabled,
      isSwapBlockDisabled,
      categories,
      hasUnsavedChanges,
      isPublic,
      workflowDescription,
      workflowTags,
    ]
  );

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
      {showSaveModal && (
        <SaveWorkflowModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveConfirm}
          workflowName={workflowName}
          currentDescription={workflowDescription}
          currentTags={workflowTags}
          isPublic={isPublic}
          nodes={nodes}
          currentVersion={workflowVersion}
          currentWorkflowId={currentWorkflowId}
        />
      )}
    </WorkflowContext.Provider>
  );
};

// Wrap WorkflowProvider with BlockProvider
export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <BlockProvider>
      <WorkflowProviderInner>{children}</WorkflowProviderInner>
    </BlockProvider>
  );
};
