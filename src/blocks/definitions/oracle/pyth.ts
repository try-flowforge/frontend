import type { BlockDefinition } from "../../types";
import { OracleProvider, OracleChain } from "@/types/oracle";

/**
 * Pyth Network Oracle Block Definition
 * Allows users to fetch low-latency price data from Pyth Network
 */
export const pythBlock: BlockDefinition = {
    id: "pyth",
    label: "Pyth Network",
    iconName: "PythLogo",
    description: "Low-latency price oracles for DeFi",
    category: "oracle",
    nodeType: "pyth",
    backendType: "PYTH_PRICE_ORACLE",
    sharedConfigComponent: "oracle",
    configComponentProps: {
        requiresAuth: true,
    },
    defaultData: {
        label: "Pyth Oracle",
        description: "Fetch price data from Pyth Network",
        status: "idle" as const,
        // Oracle configuration
        oracleProvider: OracleProvider.PYTH,
        oracleChain: OracleChain.ARBITRUM_SEPOLIA,
        // Pyth specific
        priceFeedId: "",
        selectedPriceFeed: "",
        // Optional configuration
        staleAfterSeconds: undefined,
        outputMapping: {},
        // Output data
        priceData: "",
        formattedPrice: "",
        confidence: "",
        timestamp: "",
        // Execution settings
        simulateFirst: true,
        lastFetchedAt: "",
    },
};

export default pythBlock;
