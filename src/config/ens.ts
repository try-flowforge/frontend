/**
 * ENS subdomain config: parent name and registry/pricer per chain.
 * Chain 1 = Ethereum mainnet.
 */

export const ENS_PARENT_NAME =
  process.env.NEXT_PUBLIC_ENS_PARENT_NAME || "flowforge.eth";

export const ENS_CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,

} as const;

export type EnsChainId =
  | (typeof ENS_CHAIN_IDS)[keyof typeof ENS_CHAIN_IDS];

export interface EnsChainConfig {
  chainId: EnsChainId;
  registryAddress: string;
  pricerAddress: string;
  name: string;
}

const ensChainConfigs: Partial<Record<EnsChainId, EnsChainConfig>> = {
  [ENS_CHAIN_IDS.ETHEREUM_MAINNET]: {
    chainId: ENS_CHAIN_IDS.ETHEREUM_MAINNET,
    registryAddress:
      process.env.NEXT_PUBLIC_SUBDOMAIN_REGISTRY_ADDRESS_1 || "",
    pricerAddress: process.env.NEXT_PUBLIC_PRICER_ADDRESS_1 || "",
    name: "Ethereum Mainnet",
  },

};

export function getEnsConfig(identifier: string | number): EnsChainConfig | null {
  const numericId = typeof identifier === "string" ? parseInt(identifier) : identifier;
  if (numericId !== ENS_CHAIN_IDS.ETHEREUM_MAINNET) {
    return null;
  }
  const cfg = ensChainConfigs[numericId as EnsChainId];
  if (!cfg?.registryAddress || !cfg?.pricerAddress) return null;
  return cfg;
}

/** ENS chains that have registry configured (for UI) */
export function getConfiguredEnsChains(): EnsChainConfig[] {
  return [ENS_CHAIN_IDS.ETHEREUM_MAINNET]
    .map((id) => getEnsConfig(id))
    .filter((c): c is EnsChainConfig => c != null);
}
