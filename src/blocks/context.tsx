/**
 * Block Context
 * Unified context for all block-related state and logic
 */

"use client";

import React, { createContext, useContext, useMemo, useCallback } from "react";
import type { ComponentType } from "react";
import type { NodeTypes, Node } from "reactflow";
import type {
  BlockDefinition,
  CategoryDefinition,
  IconRegistry,
  BackendNode,
} from "./types";
import {
  getBlockById as registryGetBlockById,
  getBlockByNodeType as registryGetBlockByNodeType,
  getAllBlocks as registryGetAllBlocks,
  getBlocksByCategory as registryGetBlocksByCategory,
  getCategories as registryGetCategories,
  getCategoryById as registryGetCategoryById,
  getIcon as registryGetIcon,
  generateIconRegistry,
  discoverNodeComponents,
} from "./registry";
import {
  getConfigComponent as registryGetConfigComponent,
  resolveConfigProps as registryResolveConfigProps,
} from "./configs/registry";
import {
  extractNodeConfig,
  transformNodeToCanvas,
  normalizeNodeType,
} from "./utils/backend-mapping";
import { BaseNode } from "./nodes/BaseNode";
import { StartNode } from "./nodes/StartNode";
import { IfNode } from "./nodes/IfNode";
import { SwitchNode } from "./nodes/SwitchNode";
import { WalletNode } from "./nodes/WalletNode";

/**
 * Block Context Value
 */
export interface BlockContextValue {
  // Block definitions
  getBlockById: (id: string) => BlockDefinition | undefined;
  getBlockByNodeType: (nodeType: string) => BlockDefinition | undefined;
  getAllBlocks: () => BlockDefinition[];
  getBlocksByCategory: (category: string) => BlockDefinition[];
  getCategories: () => CategoryDefinition[];
  getCategoryById: (id: string) => CategoryDefinition | undefined;

  // Configuration components
  getConfigComponent: (
    nodeType: string,
    blockId?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => ComponentType<any> | null;
  resolveConfigProps: (
    nodeType: string,
    blockId: string | undefined,
    context: {
      nodeData: Record<string, unknown>;
      handleDataChange: (updates: Record<string, unknown>) => void;
      authenticated?: boolean;
      login?: () => void;
      forcedProvider?: unknown;
      nodeId?: string;
      [key: string]: unknown;
    }
  ) => Record<string, unknown>;

  // Node components (for React Flow)
  getNodeComponent: (
    nodeType: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => ComponentType<any>;
  nodeTypes: NodeTypes;

  // Icons
  getIcon: (iconName: string) => ComponentType<{ className?: string }> | undefined;
  iconRegistry: IconRegistry;

  // Backend mappings
  normalizeNodeType: (frontendType: string) => string;
  extractNodeConfig: (node: Node) => Record<string, unknown>;
  transformNodeToCanvas: (backendNode: BackendNode) => Node;
}

const BlockContext = createContext<BlockContextValue | null>(null);

/**
 * Block Provider Component
 */
export function BlockProvider({ children }: { children: React.ReactNode }) {
  // Generate node types mapping for React Flow
  const nodeTypes = useMemo<NodeTypes>(() => {
    // Start with discovered node components (auto-discovered from nodes/ folder)
    const discoveredNodes = discoverNodeComponents();

    const types: NodeTypes = {
      // Default fallback
      base: BaseNode,
    };

    // Add discovered node components first (these override defaults)
    for (const [nodeType, component] of discoveredNodes.entries()) {
      types[nodeType] = component;
    }

    // Explicit overrides for special nodes (ensure they're always correct)
    types.start = StartNode;
    types.if = IfNode;
    types.switch = SwitchNode;
    types["wallet-node"] = WalletNode;

    // Auto-generate node types for all blocks (default to BaseNode if not discovered)
    const allBlocks = registryGetAllBlocks();
    for (const block of allBlocks) {
      if (block.nodeType && !types[block.nodeType]) {
        // Default to BaseNode for blocks without custom node components
        types[block.nodeType] = BaseNode;
      }
    }

    return types;
  }, []);

  // Generate icon registry
  const iconRegistry = useMemo<IconRegistry>(() => {
    return generateIconRegistry();
  }, []);

  // Get node component
  const getNodeComponent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (nodeType: string): ComponentType<any> => {
      return nodeTypes[nodeType] || BaseNode;
    },
    [nodeTypes]
  );

  const value: BlockContextValue = useMemo(
    () => ({
      // Block definitions
      getBlockById: registryGetBlockById,
      getBlockByNodeType: registryGetBlockByNodeType,
      getAllBlocks: registryGetAllBlocks,
      getBlocksByCategory: registryGetBlocksByCategory,
      getCategories: registryGetCategories,
      getCategoryById: registryGetCategoryById,

      // Configuration components
      getConfigComponent: registryGetConfigComponent,
      resolveConfigProps: registryResolveConfigProps,

      // Node components
      getNodeComponent,
      nodeTypes,

      // Icons
      getIcon: registryGetIcon,
      iconRegistry,

      // Backend mappings
      normalizeNodeType,
      extractNodeConfig,
      transformNodeToCanvas,
    }),
    [nodeTypes, iconRegistry, getNodeComponent]
  );

  return <BlockContext.Provider value={value}>{children}</BlockContext.Provider>;
}

/**
 * useBlock Hook
 * Access block context from any component
 */
export function useBlock(): BlockContextValue {
  const context = useContext(BlockContext);
  if (!context) {
    throw new Error("useBlock must be used within BlockProvider");
  }
  return context;
}
