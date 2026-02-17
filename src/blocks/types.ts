import type { IconType } from "react-icons/lib";
import type { ComponentType } from "react";
import type { Node } from "reactflow";

/**
 * Branded types for type safety
 */
export type BlockId = string & { readonly __brand: "BlockId" };
export type NodeType = string & { readonly __brand: "NodeType" };

/**
 * Backend node type
 * Compatible with both blocks system and workflow API types
 */
export interface BackendNode {
  id: string;
  type: string;
  name: string | null;
  description?: string | null;
  config?: Record<string, unknown>;
  position?: { x: number; y: number };
  metadata?: Record<string, unknown>;
}

/**
 * Configuration component props interface
 */
export interface NodeConfigurationProps {
  nodeData: Record<string, unknown>;
  handleDataChange: (updates: Record<string, unknown>) => void;
  nodeId?: string;
  authenticated?: boolean;
  login?: () => void;
  forcedProvider?: unknown;
  [key: string]: unknown;
}

/**
 * Base interface for all block definitions
 */
export interface BlockDefinition {
  id: string;
  label: string;
  iconName: string;
  description?: string;
  category: string;
  nodeType?: string;
  defaultData?: Record<string, unknown>;

  /**
   * Backend processor type mapping
   * If not specified, will be auto-generated from nodeType (uppercase)
   */
  backendType?: string;

  /**
   * Optional path/name to configuration component
   * If not specified, will be auto-discovered from configs/ folder
   */
  configComponent?: string;

  /**
   * Optional custom node component (defaults to BaseNode)
   * If not specified, will be auto-discovered from nodes/ folder
   */
  nodeComponent?: string;

  /**
   * Optional function to extract config for backend
   * If not specified, will use default extraction logic
   */
  configExtractor?: (node: Node) => Record<string, unknown>;

  /**
   * Optional function to transform backend config to frontend
   * If not specified, will use default transformation logic
   */
  configTransformer?: (backendNode: BackendNode) => Record<string, unknown>;

  /**
   * Optional props configuration for config component
   */
  configComponentProps?: {
    requiresAuth?: boolean;
    requiresForcedProvider?: boolean;
    customProps?: Record<string, unknown>;
  };

  /**
   * Optional shared config component (if multiple blocks share same config)
   */
  sharedConfigComponent?: string;

  /**
   * Whether the block should be hidden from the UI (e.g. block picker)
   */
  hidden?: boolean;

  /**
   * Chains this block supports.
   * If undefined or empty, the block is chain-agnostic (e.g. Telegram, Slack).
   * Values must match chain IDs from getAllChains() (e.g. "ARBITRUM", "BASE").
   * The UI will auto-filter chain dropdowns based on this field.
   */
  supportedChains?: string[];
}

/**
 * Category definition interface
 */
export interface CategoryDefinition {
  id: string;
  label: string;
  iconName?: string;
  blocks: BlockDefinition[];
}

/**
 * Icon registry type - accepts both Lucide icons and custom React components
 */
export type IconRegistry = Record<
  string,
  IconType | ComponentType<{ className?: string }>
>;
