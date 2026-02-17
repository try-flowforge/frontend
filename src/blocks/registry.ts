/**
 * Block Registry
 * Convention-based registry for blocks.
 */

import type { ComponentType } from "react";
import type { NodeProps, NodeTypes } from "reactflow";
import type { BlockDefinition, CategoryDefinition, IconRegistry } from "./types";

// Import all block definitions (convention: filename = blockId) - static fallback
import { aiBlocks } from "./definitions/ai/ai-transform";
import { ifBlock } from "./definitions/control/if";
import { switchBlock } from "./definitions/control/switch";
import { aaveBlock } from "./definitions/defi/aave";
import { compoundBlock } from "./definitions/defi/compound";
import { lifiBlock } from "./definitions/defi/lifi";
import { oneInchBlock } from "./definitions/defi/oneinch";
import { relayBlock } from "./definitions/defi/relay";
import { uniswapBlock } from "./definitions/defi/uniswap";
import { chainlinkBlock } from "./definitions/oracle/chainlink";
import { pythBlock } from "./definitions/oracle/pyth";
import { mailBlock } from "./definitions/social/mail";
import { slackBlock } from "./definitions/social/slack";
import { telegramBlock } from "./definitions/social/telegram";
import { startBlock } from "./definitions/triggers/start";
import { timeBlock } from "./definitions/triggers/time-block";
import { walletBlock } from "./definitions/wallet/wallet";
import { apiBlock } from "./definitions/general/api";

// Import icons from assets
import * as logos from "./assets/logos";

// Type definition for Webpack's require.context
interface RequireContext {
  keys(): string[];
  (id: string): unknown;
  id: string;
}

interface WebpackRequire {
  (id: string): unknown;
  context(
    directory: string,
    useSubdirectories?: boolean,
    regExp?: RegExp,
    mode?: string
  ): RequireContext;
}

// Declare require as WebpackRequire to avoid using any
declare const require: WebpackRequire;

// Define the shape of a loaded module
interface BlockModule {
  default?: BlockDefinition;
  [key: string]: unknown;
}

interface NodeComponentModule {
  default?: ComponentType<unknown>;
  [key: string]: ComponentType<unknown> | unknown;
}

/**
 * Convention-based filename / component name parsers
 */

/**
 * Convert filename to blockId
 * Example: "telegram.ts" -> "telegram"
 */
export function filenameToBlockId(filename: string): string {
  return filename.replace(/\.(ts|tsx)$/, "").toLowerCase();
}

/**
 * Convert component name to blockId
 * Example: "TelegramConfig" -> "telegram"
 */
export function componentNameToBlockId(componentName: string): string {
  return componentName
    .replace(/(?:Node)?(?:Configuration|Config)$/, "")
    .replace(/Node$/, "")
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
}

/**
 * Convert component name to nodeType
 * Example: "TelegramNode" -> "telegram"
 */
export function componentNameToNodeType(componentName: string): string {
  return componentName
    .replace(/Node$/, "")
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
}

/**
 * Convert blockId to backendType (uppercase, with underscores)
 * Example: "ai-transform" -> "AI_TRANSFORM"
 */
export function blockIdToBackendType(blockId: string): string {
  return blockId.toUpperCase().replace(/-/g, "_");
}

/**
 * Runtime type guard to detect BlockDefinition-like objects.
 * Used by the (optional) auto-discovery helper below.
 */
function isBlockDefinition(value: unknown): value is BlockDefinition {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.category === "string"
  );
}

/**
 * Static fallback list of all known blocks.
 */
const STATIC_BLOCKS: BlockDefinition[] = [
  // Social blocks
  telegramBlock,
  slackBlock,
  mailBlock,
  // Control blocks
  ifBlock,
  switchBlock,
  // Trigger blocks
  startBlock,
  timeBlock,
  // Wallet blocks
  walletBlock,
  // General blocks
  apiBlock,
  // DeFi blocks
  uniswapBlock,
  relayBlock,
  oneInchBlock,
  lifiBlock,
  aaveBlock,
  compoundBlock,
  // Oracle blocks
  chainlinkBlock,
  pythBlock,
  // AI blocks
  ...aiBlocks,
];

/**
 * Auto-discover block definitions using Webpack's require.context when available.
 */
function discoverBlockDefinitions(): BlockDefinition[] {
  try {
    if (
      typeof require === "function" &&
      typeof require.context === "function"
    ) {
      const context = require.context("./definitions", true, /\.(ts|tsx)$/);

      const discovered = new Map<string, BlockDefinition>();

      context.keys().forEach((key: string) => {
        const mod = context(key) as BlockModule;

        const candidates: unknown[] = [];
        if (mod.default) {
          candidates.push(mod.default);
        }
        for (const exported of Object.values(mod)) {
          candidates.push(exported);
        }

        for (const candidate of candidates) {
          if (isBlockDefinition(candidate)) {
            const id = candidate.id;
            if (!discovered.has(id)) {
              discovered.set(id, candidate);
            }
          }
        }
      });

      if (discovered.size > 0) {
        // Merge discovered blocks with static ones (discovered wins on conflicts)
        const merged = new Map<string, BlockDefinition>();
        for (const [id, block] of discovered.entries()) {
          merged.set(id, block);
        }
        for (const block of STATIC_BLOCKS) {
          if (!merged.has(block.id)) {
            merged.set(block.id, block);
          }
        }
        return Array.from(merged.values());
      }
    }
  } catch {
    // If anything goes wrong, fall back to the explicit static list
  }

  return STATIC_BLOCKS;
}

/**
 * Registry caches for O(1) lookups
 */
class BlockRegistry {
  private blockCache = new Map<string, BlockDefinition>();
  private blockByNodeTypeCache = new Map<string, BlockDefinition>();
  private categoryCache = new Map<string, CategoryDefinition>();
  private initialized = false;

  /**
   * Initialize registry with all discovered blocks
   */
  private initialize() {
    if (this.initialized) return;

    // Discover all block definitions (auto-discovery with static fallback)
    const allBlocks: BlockDefinition[] = discoverBlockDefinitions();

    // Populate caches
    for (const block of allBlocks) {
      this.blockCache.set(block.id, block);
      if (block.nodeType) {
        this.blockByNodeTypeCache.set(block.nodeType, block);
      }
    }

    this.initialized = true;
  }

  /**
   * Get block by ID
   */
  getBlockById(id: string): BlockDefinition | undefined {
    this.initialize();
    return this.blockCache.get(id);
  }

  /**
   * Get block by nodeType
   */
  getBlockByNodeType(nodeType: string): BlockDefinition | undefined {
    this.initialize();
    return this.blockByNodeTypeCache.get(nodeType);
  }

  /**
   * Get all blocks
   */
  getAllBlocks(): BlockDefinition[] {
    this.initialize();
    return Array.from(this.blockCache.values());
  }

  /**
   * Get blocks by category
   */
  getBlocksByCategory(category: string): BlockDefinition[] {
    this.initialize();
    return Array.from(this.blockCache.values()).filter(
      (block) => block.category === category
    );
  }

  /**
   * Get all categories
   */
  getCategories(): CategoryDefinition[] {
    this.initialize();
    const categoryMap = new Map<string, BlockDefinition[]>();

    // Group blocks by category
    for (const block of this.getAllBlocks()) {
      if (block.hidden) continue;

      if (!categoryMap.has(block.category)) {
        categoryMap.set(block.category, []);
      }
      categoryMap.get(block.category)!.push(block);
    }

    // Convert to CategoryDefinition array
    const categories: CategoryDefinition[] = [];
    for (const [categoryId, blocks] of categoryMap.entries()) {
      categories.push({
        id: categoryId,
        label: this.getCategoryLabel(categoryId),
        blocks,
      });
    }

    return categories;
  }

  /**
   * Get category label (human-readable)
   */
  private getCategoryLabel(categoryId: string): string {
    const labels: Record<string, string> = {
      social: "Social",
      defi: "DeFi",
      oracle: "Oracle",
      control: "Control",
      ai: "AI",
      wallet: "Wallet",
      triggers: "Triggers",
      general: "General",
    };
    return labels[categoryId] || categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: string): CategoryDefinition | undefined {
    return this.getCategories().find((cat) => cat.id === id);
  }
}

// Singleton instance
const registry = new BlockRegistry();

/**
 * Public API - Block discovery functions
 */
export function getBlockById(id: string): BlockDefinition | undefined {
  return registry.getBlockById(id);
}

export function getBlockByNodeType(nodeType: string): BlockDefinition | undefined {
  return registry.getBlockByNodeType(nodeType);
}

export function getAllBlocks(): BlockDefinition[] {
  return registry.getAllBlocks();
}

export function getBlocksByCategory(category: string): BlockDefinition[] {
  return registry.getBlocksByCategory(category);
}

export function getCategories(): CategoryDefinition[] {
  return registry.getCategories();
}

export function getCategoryById(id: string): CategoryDefinition | undefined {
  return registry.getCategoryById(id);
}

/**
 * Generate icon registry from logos
 */
export function generateIconRegistry(): IconRegistry {
  // Map logo exports to icon registry
  // Convention: Logo component name matches iconName from block definition
  const logoMap: Record<string, ComponentType<{ className?: string }>> = {
    TelegramLogo: logos.TelegramLogo,
    MailLogo: logos.MailLogo,
    WalletLogo: logos.WalletLogo,
    SlackLogo: logos.SlackLogo,
    StartLogo: logos.StartLogo,
    IfElseLogo: logos.IfElseLogo,
    SwitchLogo: logos.SwitchLogo,
    UniswapLogo: logos.UniswapLogo,
    RelayLogo: logos.RelayLogo,
    OneInchLogo: logos.OneInchLogo,
    LiFiLogo: logos.LiFiLogo,
    AaveLogo: logos.AaveLogo,
    CompoundLogo: logos.CompoundLogo,
    ChainlinkLogo: logos.ChainlinkLogo,
    PythLogo: logos.PythLogo,
    QwenLogo: logos.QwenLogo,
    GLMLogo: logos.GLMLogo,
    DeepSeekLogo: logos.DeepSeekLogo,
    ChatGPTLogo: logos.ChatGPTLogo,
    ApiLogo: logos.ApiLogo,
  };

  return logoMap;
}

/**
 * Get icon by name
 */
export function getIcon(iconName: string): ComponentType<{ className?: string }> | undefined {
  const iconRegistry = generateIconRegistry();
  return iconRegistry[iconName];
}

/**
 * Auto-discover node components from nodes/ folder
 * Scans for {Name}Node.tsx files and maps them to nodeType
 *
// Convention: TelegramNode.tsx → nodeType: "telegram"
 * Convention: IfNode.tsx → nodeType: "if"
 */
export function discoverNodeComponents(): Map<string, ComponentType<NodeProps>> {
  const nodeComponentMap = new Map<string, ComponentType<NodeProps>>();

  try {
    if (
      typeof require === "function" &&
      typeof require.context === "function"
    ) {
      const context = require.context("../nodes", false, /[A-Za-z0-9]+Node\.tsx$/);

      context.keys().forEach((key: string) => {
        const mod = context(key) as NodeComponentModule;

        const fileNameWithExt = key.split("/").pop() || "";
        const fileName = fileNameWithExt.replace(/\.tsx$/, "");

        // Extract nodeType from filename (e.g., "TelegramNode" → "telegram")
        const nodeType = componentNameToNodeType(fileName);

        // Prefer default export, then named export matching filename
        const component: ComponentType<NodeProps> | undefined =
          (mod.default as ComponentType<NodeProps>) || (mod[fileName] as ComponentType<NodeProps>);

        if (component && nodeType) {
          nodeComponentMap.set(nodeType, component);
        }
      });
    }
  } catch {
    // If require.context is not available, return empty map
  }

  return nodeComponentMap;
}

/**
 * Generate node type registry for React Flow
 */
export function generateNodeTypeRegistry(): Partial<NodeTypes> {
  // Discover custom node components
  const discoveredNodes = discoverNodeComponents();

  const nodeTypes: Partial<NodeTypes> = {};

  // Add discovered node components
  for (const [nodeType, component] of discoveredNodes.entries()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nodeTypes[nodeType] = component as any;
  }

  return nodeTypes;
}

/**
 * Generate backend type mapping
 * Maps frontend nodeType to backend processor type
 */
export function generateBackendMappings(): Record<string, string> {
  const mappings: Record<string, string> = {};

  for (const block of getAllBlocks()) {
    if (block.nodeType) {
      const backendType = block.backendType || blockIdToBackendType(block.nodeType);
      mappings[block.nodeType] = backendType;
    }
  }

  return mappings;
}

/**
 * Normalize frontend node type to backend type
 */
export function normalizeNodeType(frontendType: string): string {
  const mappings = generateBackendMappings();
  return mappings[frontendType] || blockIdToBackendType(frontendType);
}

// Export registry instance for advanced usage
export { registry };

/**
 * Export icon registry for direct usage
 */
export const iconRegistry = generateIconRegistry();
