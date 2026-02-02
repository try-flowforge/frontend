/**
 * Stablecoins Category - Coming Soon
 * Stable Asset Management
 */

import type { ComingSoonBlockDefinition } from "./types";

export const fraxBlock: ComingSoonBlockDefinition = {
    id: "frax",
    label: "Frax Finance",
    iconName: "FraxLogo",
    description: "Algorithmic stablecoin + yield",
    category: "stablecoins",
    isComingSoon: true,
    protocolUrl: "https://frax.finance",
    automationCapabilities: [
        "Auto-mint/redeem stablecoins",
        "Stablecoin yield optimization",
        "De-peg alerts and emergency exits",
        "FRAX/sFRAX conversion automation",
    ],
};

export const radiantBlock: ComingSoonBlockDefinition = {
    id: "radiant",
    label: "Radiant Capital",
    iconName: "RadiantLogo",
    description: "Multi-chain money market",
    category: "stablecoins",
    isComingSoon: true,
    protocolUrl: "https://radiant.capital",
    automationCapabilities: [
        "Cross-chain lending automation",
        "Health factor monitoring",
        "Auto-repay on liquidation risk",
        "Yield optimization across chains",
    ],
};

export const stablecoinBlocks: ComingSoonBlockDefinition[] = [
    fraxBlock,
    radiantBlock,
];
