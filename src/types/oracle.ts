/**
 * Oracle Type Definitions
 * Types for Chainlink and Pyth Network oracle integrations
 *
 * Chain-related data has been moved to:
 *   - config/chain-registry.ts (chain metadata, labels)
 *
 * Note: OracleChain enum has been removed. Use string chain IDs
 * from chain-registry (e.g. "ARBITRUM", "ARBITRUM_SEPOLIA").
 */



export enum OracleProvider {
    CHAINLINK = "CHAINLINK",
    PYTH = "PYTH",
}

/**
 * Chainlink Price Feed Presets
 */
export interface ChainlinkPriceFeed {
    symbol: string;
    address: string;
    /** Chain ID from chain-registry (e.g. "ARBITRUM", "ARBITRUM_SEPOLIA") */
    chain: string;
    description: string;
}

export const CHAINLINK_PRICE_FEEDS: ChainlinkPriceFeed[] = [
    {
        symbol: "ETH/USD",
        address: "0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165",
        chain: "ARBITRUM_SEPOLIA",
        description: "Ethereum / US Dollar",
    },
    {
        symbol: "ARB/USD",
        address: "0xD1092a65338d049DB68D7Be6bD89d17a0929945e",
        chain: "ARBITRUM_SEPOLIA",
        description: "Arbitrum / US Dollar",
    },
    {
        symbol: "AAVE/USD",
        address: "0x20b1061Acd37302925D9A8c3fD94eb765039dBd5",
        chain: "ARBITRUM_SEPOLIA",
        description: "Aave / US Dollar",
    },
    {
        symbol: "ETH/USD",
        address: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
        chain: "ARBITRUM",
        description: "Ethereum / US Dollar",
    },
];

/**
 * Pyth Price Feed Presets
 */
export interface PythPriceFeed {
    symbol: string;
    feedId: string;
    description: string;
}

export const PYTH_PRICE_FEEDS: PythPriceFeed[] = [
    {
        symbol: "ETH/USD",
        feedId: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
        description: "Ethereum / US Dollar",
    },
    {
        symbol: "BTC/USD",
        feedId: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
        description: "Bitcoin / US Dollar",
    },
    {
        symbol: "ARB/USD",
        feedId: "0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5",
        description: "Arbitrum / US Dollar",
    },
    {
        symbol: "USDC/USD",
        feedId: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
        description: "USD Coin / US Dollar",
    },
    {
        symbol: "USDT/USD",
        feedId: "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
        description: "Tether / US Dollar",
    },
];

/**
 * Helper function to get Chainlink feeds for a specific chain
 */
export function getChainlinkFeedsForChain(chain: string): ChainlinkPriceFeed[] {
    return CHAINLINK_PRICE_FEEDS.filter(feed => feed.chain === chain);
}

/**
 * Helper function to validate Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Helper function to validate Pyth feed ID
 */
export function isValidPythFeedId(feedId: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(feedId);
}
