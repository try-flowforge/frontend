/**
 * Security & Insurance Category - Coming Soon
 * Risk Management
 */

import type { ComingSoonBlockDefinition } from "./types";

export const nexusMutualBlock: ComingSoonBlockDefinition = {
    id: "nexusmutual",
    label: "Nexus Mutual",
    iconName: "NexusMutualLogo",
    description: "DeFi insurance coverage",
    category: "insurance",
    isComingSoon: true,
    protocolUrl: "https://nexusmutual.io",
    automationCapabilities: [
        "Auto-buy insurance for positions",
        "Monitor smart contract risks",
        "Auto-claim insurance on exploit",
        "Coverage optimization",
    ],
};

export const insuraceBlock: ComingSoonBlockDefinition = {
    id: "insurace",
    label: "InsurAce",
    iconName: "InsurAceLogo",
    description: "Multi-chain insurance",
    category: "insurance",
    isComingSoon: true,
    protocolUrl: "https://insurace.io",
    automationCapabilities: [
        "Cross-chain coverage automation",
        "Risk-based premium optimization",
        "Portfolio insurance management",
        "Claim status tracking",
    ],
};

export const insuranceBlocks: ComingSoonBlockDefinition[] = [
    nexusMutualBlock,
    insuraceBlock,
];
