/**
 * Token Registry — Single source of truth for all token lists in the frontend.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  To ADD tokens for a new chain:  add entries below with chain ID.  │
 * │  To REMOVE a chain's tokens:    delete entries with that chain ID. │
 * │  Tokens are tagged with which protocols support them.              │
 * └─────────────────────────────────────────────────────────────────────┘
 */

import type { TokenInfo } from "@/types/swap";
import type { LendingTokenInfo } from "@/types/lending";

export interface TokenDefinition {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
    /** Chain ID from chain-registry (e.g. "ARBITRUM") */
    chain: string;
    /** Which protocols/blocks support this token */
    protocols: string[];
}

// ─── THE Token Registry ──────────────────────────────────────────────
// All tokens in one place.  Each token is tagged with its chain and
// which protocol categories it belongs to.

export const TOKEN_REGISTRY: TokenDefinition[] = [
    // ═══════════════════════════════════════════════════════════════════
    // ARBITRUM MAINNET
    // ═══════════════════════════════════════════════════════════════════
    {
        address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        symbol: "WETH",
        decimals: 18,
        name: "Wrapped Ether",
        chain: "ARBITRUM",
        protocols: ["swap", "lending-aave"],
    },
    {
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        symbol: "USDC",
        decimals: 6,
        name: "USD Coin",
        chain: "ARBITRUM",
        protocols: ["swap", "lending-aave", "lending-compound"],
    },
    {
        address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        symbol: "USDT",
        decimals: 6,
        name: "Tether USD",
        chain: "ARBITRUM",
        protocols: ["swap", "lending-aave"],
    },
    {
        address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
        symbol: "WBTC",
        decimals: 8,
        name: "Wrapped BTC",
        chain: "ARBITRUM",
        protocols: ["swap", "lending-aave", "lending-compound"],
    },
    {
        address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        symbol: "DAI",
        decimals: 18,
        name: "Dai Stablecoin",
        chain: "ARBITRUM",
        protocols: ["swap", "lending-aave"],
    },
    {
        address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
        symbol: "ARB",
        decimals: 18,
        name: "Arbitrum",
        chain: "ARBITRUM",
        protocols: ["swap", "lending-aave", "lending-compound"],
    },
    {
        address: "0x5979D7b546E38E414F7E9822514be443A4800529",
        symbol: "wstETH",
        decimals: 18,
        name: "Wrapped stETH",
        chain: "ARBITRUM",
        protocols: ["lending-aave"],
    },

    // ═══════════════════════════════════════════════════════════════════
    // ARBITRUM SEPOLIA (Testnet)
    // ═══════════════════════════════════════════════════════════════════
    {
        address: "0x980B62Da83eFf3D4576C647993b0c1D7faf17c73",
        symbol: "WETH",
        decimals: 18,
        name: "Wrapped Ether",
        chain: "ARBITRUM_SEPOLIA",
        protocols: ["swap"],
    },
    {
        address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
        symbol: "USDC",
        decimals: 6,
        name: "USD Coin",
        chain: "ARBITRUM_SEPOLIA",
        protocols: ["swap"],
    },
    {
        address: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
        symbol: "LINK",
        decimals: 18,
        name: "Chainlink Token",
        chain: "ARBITRUM_SEPOLIA",
        protocols: ["swap"],
    }
];

// ─── Derived Helpers ─────────────────────────────────────────────────

/**
 * Get all tokens for a specific chain (for swap blocks).
 * Returns TokenInfo[] shape for backward compatibility.
 */
export function getSwapTokensForChain(chain: string): TokenInfo[] {
    return TOKEN_REGISTRY.filter(
        (t) => t.chain === chain && t.protocols.includes("swap"),
    ).map(toTokenInfo);
}

/**
 * Get lending tokens for a specific provider and chain.
 * Returns LendingTokenInfo[] shape for backward compatibility.
 */
export function getLendingTokens(
    provider: string,
    chain: string,
): LendingTokenInfo[] {
    const protocolTag =
        provider === "AAVE" ? "lending-aave" : "lending-compound";
    return TOKEN_REGISTRY.filter(
        (t) => t.chain === chain && t.protocols.includes(protocolTag),
    ).map(toLendingTokenInfo);
}

/**
 * Get all tokens for a chain regardless of protocol.
 */
export function getAllTokensForChain(chain: string): TokenDefinition[] {
    return TOKEN_REGISTRY.filter((t) => t.chain === chain);
}

/**
 * Get tokens for a specific chain and protocol.
 */
export function getTokensForProtocol(
    chain: string,
    protocol: string,
): TokenDefinition[] {
    return TOKEN_REGISTRY.filter(
        (t) => t.chain === chain && t.protocols.includes(protocol),
    );
}

// ─── Conversion Helpers ──────────────────────────────────────────────
// Convert TokenDefinition to the legacy interfaces used throughout the app.

function toTokenInfo(t: TokenDefinition): TokenInfo {
    return {
        address: t.address,
        symbol: t.symbol,
        decimals: t.decimals,
        name: t.name,
    };
}

function toLendingTokenInfo(t: TokenDefinition): LendingTokenInfo {
    return {
        address: t.address,
        symbol: t.symbol,
        decimals: t.decimals,
        name: t.name,
    };
}
