/**
 * Liquidity Provision Category - Coming Soon
 * LP Management & Rebalancing
 */

import type { ComingSoonBlockDefinition } from "./types";

export const camelotBlock: ComingSoonBlockDefinition = {
    id: "camelot",
    label: "Camelot",
    iconName: "CamelotLogo",
    description: "Arbitrum-native DEX with concentrated liquidity",
    category: "liquidity",
    isComingSoon: true,
    protocolUrl: "https://camelot.exchange",
    automationCapabilities: [
        "Concentrated liquidity management",
        "Auto-rebalance LP positions",
        "Harvest and compound LP rewards",
        "Exit positions on impermanent loss threshold",
    ],
};

export const gammaBlock: ComingSoonBlockDefinition = {
    id: "gamma",
    label: "Gamma Strategies",
    iconName: "GammaLogo",
    description: "Active LP management for Uniswap V3",
    category: "liquidity",
    isComingSoon: true,
    protocolUrl: "https://gamma.xyz",
    automationCapabilities: [
        "Automated range rebalancing",
        "Fee optimization strategies",
        "Multi-pool LP management",
        "Performance tracking and alerts",
    ],
};

export const liquidityBlocks: ComingSoonBlockDefinition[] = [
    camelotBlock,
    gammaBlock,
];
