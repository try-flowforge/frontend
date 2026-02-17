/**
 * useSwapNode Hook
 * Handles swap-related operations including quoting and configuration
 */

import { useState, useCallback, useMemo } from "react";
import { API_CONFIG, buildApiUrl } from "@/config/api";
import {
    SwapProvider,
    SwapType,
    SwapQuote,
    SwapInputConfig,
    TokenInfo,
} from "@/types/swap";

interface SwapQuoteState {
    loading: boolean;
    error: string | null;
    quote: SwapQuote | null;
}

interface UseSwapNodeOptions {
    provider: SwapProvider;
    chain: string;
    sourceToken: TokenInfo | null;
    destinationToken: TokenInfo | null;
    amount: string;
    swapType: SwapType;
    walletAddress: string;
    slippageTolerance?: number; // Optional - backend uses default 0.5% if not provided
}

interface UseSwapNodeReturn {
    quoteState: SwapQuoteState;
    getQuote: () => Promise<void>;
    clearQuote: () => void;
    isValidForQuote: boolean;
    formattedQuote: {
        amountOut: string;
        priceImpact: string;
        gasEstimate: string;
    } | null;
}

export function useSwapNode(options: UseSwapNodeOptions): UseSwapNodeReturn {
    const {
        provider,
        chain,
        sourceToken,
        destinationToken,
        amount,
        swapType,
        walletAddress,
        slippageTolerance,
    } = options;

    const [quoteState, setQuoteState] = useState<SwapQuoteState>({
        loading: false,
        error: null,
        quote: null,
    });

    // Check if configuration is valid for getting a quote
    const isValidForQuote = useMemo((): boolean => {
        return Boolean(
            sourceToken?.address &&
            destinationToken?.address &&
            amount &&
            parseFloat(amount) > 0 &&
            walletAddress
        );
    }, [sourceToken?.address, destinationToken?.address, amount, walletAddress]);

    // Get quote from backend
    const getQuote = useCallback(async () => {
        if (!isValidForQuote || !sourceToken || !destinationToken) return;

        setQuoteState({ loading: true, error: null, quote: null });

        try {
            // Convert amount to wei/smallest unit based on token decimals
            const decimals = sourceToken.decimals || 18;
            const amountInWei = (parseFloat(amount) * Math.pow(10, decimals)).toString();

            const swapConfig: SwapInputConfig = {
                sourceToken,
                destinationToken,
                amount: amountInWei,
                swapType,
                walletAddress,
                // Only include slippageTolerance if provided, backend uses default 0.5% otherwise
                ...(slippageTolerance !== undefined && { slippageTolerance }),
            };

            const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.SWAP.QUOTE)}/${provider}/${chain}`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(swapConfig),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: "Request failed" } }));
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || "Failed to get quote");
            }

            setQuoteState({
                loading: false,
                error: null,
                quote: data.data as SwapQuote,
            });
        } catch (error) {
            setQuoteState({
                loading: false,
                error: error instanceof Error ? error.message : "Failed to get quote",
                quote: null,
            });
        }
    }, [
        isValidForQuote,
        sourceToken,
        destinationToken,
        amount,
        swapType,
        walletAddress,
        slippageTolerance,
        provider,
        chain,
    ]);

    // Clear quote
    const clearQuote = useCallback(() => {
        setQuoteState({ loading: false, error: null, quote: null });
    }, []);

    // Format quote for display
    const formattedQuote = useMemo(() => {
        if (!quoteState.quote || !destinationToken) return null;

        const decimals = destinationToken.decimals || 18;
        const amountOutFormatted = (
            parseFloat(quoteState.quote.amountOut) / Math.pow(10, decimals)
        ).toFixed(6);

        return {
            amountOut: amountOutFormatted,
            priceImpact: quoteState.quote.priceImpact,
            gasEstimate: quoteState.quote.gasEstimate,
        };
    }, [quoteState.quote, destinationToken]);

    return {
        quoteState,
        getQuote,
        clearQuote,
        isValidForQuote,
        formattedQuote,
    };
}

export default useSwapNode;
