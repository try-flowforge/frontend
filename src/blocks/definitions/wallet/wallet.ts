import type { BlockDefinition } from "../../types";

/**
 * Wallet Block Definition
 * Allows users to connect their wallet and manage Safe wallets
 */
export const walletBlock: BlockDefinition = {
  id: "wallet",
  label: "Wallet",
  iconName: "WalletLogo",
  description: "Login and manage Safe wallet",
  category: "wallet",
  nodeType: "wallet-node",
  backendType: "WALLET",
  defaultData: {
    label: "Wallet",
    description: "Login and manage Safe wallet",
    status: "idle",
  },
};

export default walletBlock;
