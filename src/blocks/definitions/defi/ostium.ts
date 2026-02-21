import type { BlockDefinition } from "../../types";

/**
 * Ostium Perps Block Definition
 * Executable PERPS block backed by backend Ostium integration.
 */
export const ostiumBlock: BlockDefinition = {
  id: "ostium",
  label: "Ostium",
  iconName: "OstiumLogo",
  description: "Trade perpetuals on Ostium",
  category: "defi",
  nodeType: "ostium",
  backendType: "PERPS",
  sharedConfigComponent: "ostium",
  supportedChains: ["ARBITRUM", "ARBITRUM_SEPOLIA"],
  configComponentProps: {
    requiresAuth: true,
  },
  defaultData: {
    label: "Ostium Perps",
    description: "Trade perpetuals on Ostium",
    status: "idle" as const,
    provider: "OSTIUM",
    network: "testnet",
    action: "MARKETS",
    market: "",
    base: "",
    quote: "USD",
    side: "long",
    collateral: "",
    leverage: "",
    pairId: "",
    tradeIndex: "",
    slPrice: "",
    tpPrice: "",
    idempotencyKey: "",
  },
};

export default ostiumBlock;
