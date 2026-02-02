import type { BlockDefinition } from "../../types";
import { OracleProvider, OracleChain } from "@/types/oracle";

/**
 * Chainlink Oracle Block Definition
 * Allows users to fetch price data and other oracle services from Chainlink
 */
export const chainlinkBlock: BlockDefinition = {
    id: "chainlink",
    label: "Chainlink",
    iconName: "ChainlinkLogo",
    description: "Industry-standard price feeds, VRF, and automation",
    category: "oracle",
    nodeType: "chainlink",
    backendType: "CHAINLINK_PRICE_ORACLE",
    sharedConfigComponent: "oracle",
    configComponentProps: {
        requiresAuth: true,
    },
    defaultData: {
        label: "Chainlink Oracle",
        description: "Fetch price data from Chainlink",
        status: "idle" as const,
        // Oracle configuration
        oracleProvider: OracleProvider.CHAINLINK,
        oracleChain: OracleChain.ARBITRUM_SEPOLIA,
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
        decimals: undefined,
        // Execution settings
        simulateFirst: true,
        lastFetchedAt: "",
    },
};

export default chainlinkBlock;
