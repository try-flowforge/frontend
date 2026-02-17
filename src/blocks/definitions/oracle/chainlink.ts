import type { BlockDefinition } from "../../types";
import { OracleProvider } from "@/types/oracle";

/**
 * Chainlink Oracle Block Definition
 * Allows users to fetch verifiable price data from Chainlink Data Feeds
 * Supports: Arbitrum, Arbitrum Sepolia
 */
export const chainlinkBlock: BlockDefinition = {
    id: "chainlink",
    label: "Chainlink",
    iconName: "ChainlinkLogo",
    description: "Decentralized oracle price feeds",
    category: "oracle",
    nodeType: "chainlink",
    backendType: "PRICE_ORACLE",
    sharedConfigComponent: "oracle",
    supportedChains: ["ARBITRUM", "ARBITRUM_SEPOLIA"],
    configComponentProps: {
        requiresAuth: true,
    },
    defaultData: {
        label: "Chainlink Oracle",
        description: "Fetch price data from Chainlink",
        status: "idle" as const,
        // Oracle configuration
        oracleProvider: OracleProvider.CHAINLINK,
        oracleChain: "ARBITRUM_SEPOLIA",
        // Chainlink specific
        aggregatorAddress: "",
        selectedPriceFeed: "",
        // Optional configuration
        staleAfterSeconds: undefined,
        outputMapping: {},
        // Output data
        priceData: "",
        formattedPrice: "",
        timestamp: "",
        // Execution settings
        simulateFirst: true,
        lastFetchedAt: "",
    },
};

export default chainlinkBlock;
