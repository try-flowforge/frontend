/**
 * Gaming & NFTs Category - Coming Soon
 * GameFi & NFT Utilities
 */

import type { ComingSoonBlockDefinition } from "./types";

export const treasureBlock: ComingSoonBlockDefinition = {
    id: "treasure",
    label: "Treasure DAO",
    iconName: "TreasureLogo",
    description: "Arbitrum gaming ecosystem",
    category: "gaming",
    isComingSoon: true,
    protocolUrl: "https://treasure.lol",
    automationCapabilities: [
        "Auto-claim gaming rewards",
        "MAGIC token staking automation",
        "Cross-game asset management",
        "NFT marketplace automation",
    ],
};

export const openseaBlock: ComingSoonBlockDefinition = {
    id: "opensea",
    label: "OpenSea",
    iconName: "OpenSeaLogo",
    description: "NFT marketplace",
    category: "gaming",
    isComingSoon: true,
    protocolUrl: "https://opensea.io",
    automationCapabilities: [
        "NFT floor price tracking & alerts",
        "Automated NFT buying (sniping)",
        "Collection monitoring",
        "Bulk listing automation",
    ],
};

export const gamingBlocks: ComingSoonBlockDefinition[] = [
    treasureBlock,
    openseaBlock,
];
