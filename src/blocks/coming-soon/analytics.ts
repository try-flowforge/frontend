/**
 * Analytics & Monitoring Category - Coming Soon
 * Portfolio & Health Tracking
 */

import type { ComingSoonBlockDefinition } from "./types";

export const defillamaBlock: ComingSoonBlockDefinition = {
    id: "defillama",
    label: "DefiLlama",
    iconName: "DefiLlamaLogo",
    description: "DeFi analytics and TVL tracking",
    category: "analytics",
    isComingSoon: true,
    protocolUrl: "https://defillama.com",
    automationCapabilities: [
        "TVL monitoring and alerts",
        "Protocol health tracking",
        "Yield comparison automation",
        "Market trend notifications",
    ],
};

export const zapperBlock: ComingSoonBlockDefinition = {
    id: "zapper",
    label: "Zapper",
    iconName: "ZapperLogo",
    description: "Portfolio aggregator",
    category: "analytics",
    isComingSoon: true,
    protocolUrl: "https://zapper.xyz",
    automationCapabilities: [
        "Portfolio health monitoring",
        "Liquidation alerts for lending positions",
        "APY tracking and notifications",
        "Cross-chain portfolio sync",
    ],
};

export const analyticsBlocks: ComingSoonBlockDefinition[] = [
    defillamaBlock,
    zapperBlock,
];
