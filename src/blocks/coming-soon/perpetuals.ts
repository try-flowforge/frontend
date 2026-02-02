/**
 * Perpetuals & Derivatives Category - Coming Soon
 * Leveraged Trading Platforms
 */

import type { ComingSoonBlockDefinition } from "./types";

export const gmxBlock: ComingSoonBlockDefinition = {
    id: "gmx",
    label: "GMX",
    iconName: "GMXLogo",
    description: "Decentralized perpetual exchange",
    category: "perpetuals",
    isComingSoon: true,
    protocolUrl: "https://gmx.io",
    automationCapabilities: [
        "Automated stop-loss/take-profit",
        "Position management based on price feeds",
        "Copy trading automation",
        "Leverage adjustment on volatility",
    ],
};

export const hyperliquidBlock: ComingSoonBlockDefinition = {
    id: "hyperliquid",
    label: "Hyperliquid",
    iconName: "HyperliquidLogo",
    description: "High-performance perpetual DEX with orderbook",
    category: "perpetuals",
    isComingSoon: true,
    protocolUrl: "https://hyperliquid.xyz",
    automationCapabilities: [
        "Orderbook-based trading strategies",
        "High-frequency trading automation",
        "Limit order management",
        "Cross-margin position automation",
    ],
};

export const ostiumBlock: ComingSoonBlockDefinition = {
    id: "ostium",
    label: "Ostium",
    iconName: "OstiumLogo",
    description: "RWA perpetuals for forex & commodities",
    category: "perpetuals",
    isComingSoon: true,
    protocolUrl: "https://ostium.io",
    automationCapabilities: [
        "Real-world asset trading automation",
        "Forex strategy execution",
        "Commodity price tracking",
        "Multi-asset portfolio automation",
    ],
};

export const perpetualBlocks: ComingSoonBlockDefinition[] = [
    gmxBlock,
    hyperliquidBlock,
    ostiumBlock,
];
