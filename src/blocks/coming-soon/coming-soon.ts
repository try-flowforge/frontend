/**
 * Coming Soon Module
 * All upcoming protocol integrations grouped by category
 */

import type {
  ComingSoonBlockDefinition,
  ComingSoonCategoryDefinition,
} from "./types";

// Import all category blocks
import { yieldBlocks } from "./yield";
import { bridgeBlocks } from "./bridges";
import { perpetualBlocks } from "./perpetuals";
import { liquidityBlocks } from "./liquidity";
import { stakingBlocks } from "./staking";
import { stablecoinBlocks } from "./stablecoins";
import { gamingBlocks } from "./gaming";
import { governanceBlocks } from "./governance";
import { analyticsBlocks } from "./analytics";
import { insuranceBlocks } from "./insurance";

// Re-export types
export type {
  ComingSoonBlockDefinition,
  ComingSoonCategoryDefinition,
} from "./types";

// Re-export individual blocks for direct access
export * from "./yield";
export * from "./bridges";
export * from "./perpetuals";
export * from "./liquidity";
export * from "./staking";
export * from "./stablecoins";
export * from "./gaming";
export * from "./governance";
export * from "./analytics";
export * from "./insurance";

/**
 * All "Coming Soon" categories with their blocks
 */
export const comingSoonCategories: ComingSoonCategoryDefinition[] = [
  {
    id: "yield",
    label: "Yield & Farming",
    iconName: "TrendingUp",
    description: "Yield Aggregators & Strategies",
    blocks: yieldBlocks,
  },
  {
    id: "bridges",
    label: "Bridges",
    iconName: "ArrowLeftRight",
    description: "Cross-chain Asset Transfer",
    blocks: bridgeBlocks,
  },
  {
    id: "perpetuals",
    label: "Perpetuals",
    iconName: "LineChart",
    description: "Leveraged Trading",
    blocks: perpetualBlocks,
  },
  {
    id: "liquidity",
    label: "Liquidity Provision",
    iconName: "Droplets",
    description: "LP Management & Rebalancing",
    blocks: liquidityBlocks,
  },
  {
    id: "staking",
    label: "Staking",
    iconName: "Layers",
    description: "Liquid Staking & Restaking",
    blocks: stakingBlocks,
  },
  {
    id: "stablecoins",
    label: "Stablecoins",
    iconName: "DollarSign",
    description: "Stable Asset Management",
    blocks: stablecoinBlocks,
  },
  {
    id: "gaming",
    label: "Gaming & NFTs",
    iconName: "Gamepad2",
    description: "GameFi & NFT Utilities",
    blocks: gamingBlocks,
  },
  {
    id: "governance",
    label: "Governance",
    iconName: "Vote",
    description: "DAO Voting & Proposals",
    blocks: governanceBlocks,
  },
  {
    id: "analytics",
    label: "Analytics",
    iconName: "BarChart3",
    description: "Portfolio & Health Tracking",
    blocks: analyticsBlocks,
  },
  {
    id: "insurance",
    label: "Insurance",
    iconName: "Shield",
    description: "Risk Management",
    blocks: insuranceBlocks,
  },
];

/**
 * Get all coming soon blocks
 */
export function getAllComingSoonBlocks(): ComingSoonBlockDefinition[] {
  return comingSoonCategories.flatMap((category) => category.blocks);
}

/**
 * Get coming soon blocks by category ID
 */
export function getComingSoonBlocksByCategory(
  categoryId: string,
): ComingSoonBlockDefinition[] {
  const category = comingSoonCategories.find((cat) => cat.id === categoryId);
  return category?.blocks || [];
}

/**
 * Get coming soon category by ID
 */
export function getComingSoonCategoryById(
  categoryId: string,
): ComingSoonCategoryDefinition | undefined {
  return comingSoonCategories.find((cat) => cat.id === categoryId);
}

/**
 * Total count of upcoming integrations
 */
export const totalComingSoonProtocols = getAllComingSoonBlocks().length;
