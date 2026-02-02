/**
 * Bridges Category - Coming Soon
 * Cross-chain Asset Transfer
 */

import type { ComingSoonBlockDefinition } from "./types";

export const stargateBlock: ComingSoonBlockDefinition = {
    id: "stargate",
    label: "Stargate",
    iconName: "StargateLogo",
    description: "Native asset bridging (LayerZero)",
    category: "bridges",
    isComingSoon: true,
    protocolUrl: "https://stargate.finance",
    automationCapabilities: [
        "Auto-bridge when specific conditions are met",
        "Cross-chain arbitrage automation",
        "Multi-chain portfolio rebalancing",
        "Gas-optimized bridging timing",
    ],
};

export const acrossBlock: ComingSoonBlockDefinition = {
    id: "across",
    label: "Across Protocol",
    iconName: "AcrossLogo",
    description: "Fast & cheap bridging with intents",
    category: "bridges",
    isComingSoon: true,
    protocolUrl: "https://across.to",
    automationCapabilities: [
        "Intent-based fast bridging",
        "Optimal route selection",
        "Fee optimization across chains",
        "Bridge completion notifications",
    ],
};

export const bridgeBlocks: ComingSoonBlockDefinition[] = [
    stargateBlock,
    acrossBlock,
];
