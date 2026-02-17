/**
 * Oracle API Client
 * Functions to interact with the oracle backend API
 *
 * Chain-related types are now plain strings — chain labels
 * come from the centralized chain-registry.
 */

import { api } from "@/lib/api-client";
import { API_CONFIG } from "@/config/api";
import { getChain } from "@/web3/config/chain-registry";

export type OracleProvider = "CHAINLINK" | "PYTH";
export type FeedCategory = "crypto" | "forex" | "commodities";

export interface PriceFeed {
  symbol: string;
  name: string;
  category: FeedCategory;
}

export interface PriceFeedListResponse {
  feeds: PriceFeed[];
  total: number;
}

export interface ChainlinkConfig {
  symbol: string;
  name: string;
  category: FeedCategory;
  provider: "CHAINLINK";
  chain: string;
  aggregatorAddress: string;
}

export interface PythConfig {
  symbol: string;
  name: string;
  category: FeedCategory;
  provider: "PYTH";
  chain: string;
  priceFeedId: string;
}

export type OracleConfig = ChainlinkConfig | PythConfig;

/**
 * Fetch available price feeds for a provider and chain
 */
export async function fetchAvailableFeeds(
  provider: OracleProvider,
  chain: string,
): Promise<PriceFeedListResponse | null> {
  try {
    const url = `${API_CONFIG.ENDPOINTS.ORACLE.FEEDS}?provider=${provider}&chain=${chain}`;
    const response = await api.get<{ data: PriceFeedListResponse }>(url);

    if (response.ok && response.data) {
      return response.data.data;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch complete configuration for a specific price feed
 */
export async function fetchOracleConfig(
  symbol: string,
  provider: OracleProvider,
  chain: string,
): Promise<OracleConfig | null> {
  try {
    const encodedSymbol = encodeURIComponent(symbol);
    const url = `${API_CONFIG.ENDPOINTS.ORACLE.CONFIG}?symbol=${encodedSymbol}&provider=${provider}&chain=${chain}`;
    const response = await api.get<{ data: OracleConfig }>(url);

    if (response.ok && response.data) {
      return response.data.data;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Group feeds by category
 */
export function groupFeedsByCategory(
  feeds: PriceFeed[],
): Record<FeedCategory, PriceFeed[]> {
  return feeds.reduce(
    (acc, feed) => {
      if (!acc[feed.category]) {
        acc[feed.category] = [];
      }
      acc[feed.category].push(feed);
      return acc;
    },
    {} as Record<FeedCategory, PriceFeed[]>,
  );
}

/**
 * Get chain label for display.
 * Uses centralized CHAIN_LABELS from chain-registry.
 */
export function getChainLabel(chain: string): string {
  return getChain(chain)?.name ?? chain;
}

/**
 * Get provider label for display
 */
export function getProviderLabel(provider: OracleProvider): string {
  return provider === "CHAINLINK" ? "Chainlink" : "Pyth Network";
}

/**
 * Get category label for display
 */
export function getCategoryLabel(category: FeedCategory): string {
  const labels: Record<FeedCategory, string> = {
    crypto: "Cryptocurrency",
    forex: "Foreign Exchange",
    commodities: "Commodities",
  };
  return labels[category];
}
