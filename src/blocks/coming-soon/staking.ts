/**
 * Staking Category - Coming Soon
 * Liquid Staking & Restaking
 */

import type { ComingSoonBlockDefinition } from "./types";

export const lidoBlock: ComingSoonBlockDefinition = {
    id: "lido",
    label: "Lido",
    iconName: "LidoLogo",
    description: "Liquid staking (stETH on Arbitrum)",
    category: "staking",
    isComingSoon: true,
    protocolUrl: "https://lido.fi",
    automationCapabilities: [
        "Auto-stake on reward distribution",
        "Reinvest staking rewards",
        "stETH/ETH ratio monitoring",
        "Yield compounding automation",
    ],
};

export const pendleBlock: ComingSoonBlockDefinition = {
    id: "pendle",
    label: "Pendle",
    iconName: "PendleLogo",
    description: "Yield tokenization & trading",
    category: "staking",
    isComingSoon: true,
    protocolUrl: "https://pendle.finance",
    automationCapabilities: [
        "Sell yield tokens at optimal times",
        "Principal-yield separation strategies",
        "Fixed yield locking automation",
        "Maturity date management",
    ],
};

export const stakingBlocks: ComingSoonBlockDefinition[] = [
    lidoBlock,
    pendleBlock,
];
