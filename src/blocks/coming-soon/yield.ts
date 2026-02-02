/**
 * Yield & Farming Category - Coming Soon
 * Yield Aggregators & Strategies
 */

import type { ComingSoonBlockDefinition } from "./types";

export const yearnBlock: ComingSoonBlockDefinition = {
    id: "yearn",
    label: "Yearn Finance",
    iconName: "YearnLogo",
    description: "Auto-compounding yield optimizer",
    category: "yield",
    isComingSoon: true,
    protocolUrl: "https://yearn.fi",
    automationCapabilities: [
        "Auto-deposit into highest APY vaults",
        "Auto-compound rewards at optimal intervals",
        "Vault strategy monitoring and alerts",
        "Harvest timing optimization",
    ],
};

export const beefyBlock: ComingSoonBlockDefinition = {
    id: "beefy",
    label: "Beefy Finance",
    iconName: "BeefyLogo",
    description: "Multi-chain yield optimizer",
    category: "yield",
    isComingSoon: true,
    protocolUrl: "https://beefy.com",
    automationCapabilities: [
        "Cross-chain yield optimization",
        "Auto-compound across vaults",
        "Rebalance between strategies based on yields",
        "APY tracking and notifications",
    ],
};

export const yieldBlocks: ComingSoonBlockDefinition[] = [
    yearnBlock,
    beefyBlock,
];
