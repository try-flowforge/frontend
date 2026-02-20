"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { FormInput } from "@/components/ui/FormInput";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import {
    LuLoader,
    LuRefreshCw,
    LuCircleAlert,
    LuCircleCheck,
    LuLogIn,
    LuCopy,
    LuCheck,
    LuSearch,
    LuPlay,
    LuExternalLink,
    LuArrowDown,
} from "react-icons/lu";
import { useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { useSafeWalletContext } from "@/context/SafeWalletContext";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import Safe from "@safe-global/protocol-kit";
import { getChain } from "@/web3/config/chain-registry";
import {
    SwapProvider,
    SwapType,
    TokenInfo,
    SwapInputConfig,
    getTokensForChain,
    allowsCustomTokens,
    CUSTOM_TOKEN_OPTION,
} from "@/types/swap";
import { getContractAddress } from "@/web3/config/contract-registry";
import { API_CONFIG, buildApiUrl } from "@/config/api";

interface SwapNodeConfigurationProps {
    nodeData: Record<string, unknown>;
    handleDataChange: (updates: Record<string, unknown>) => void;
    authenticated: boolean;
    login: () => void;
    forcedProvider?: SwapProvider;
}

interface QuoteState {
    loading: boolean;
    error: string | null;
    data: {
        amountOut: string;
        priceImpact: string;
        gasEstimate: string;
    } | null;
}

interface ExecutionState {
    loading: boolean;
    error: string | null;
    txHash: string | null;
    approvalTxHash: string | null;
    success: boolean;
    step: 'idle' | 'checking-allowance' | 'approving' | 'waiting-approval' | 'building-tx' | 'swapping' | 'done';
}

// Chains available for LiFi (same-chain or cross-chain Arbitrum ↔ Base)
const LIFI_CHAINS: string[] = ["ARBITRUM"];


const ERC20_ABI = {
    allowance: {
        name: 'allowance',
        type: 'function',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    approve: {
        name: 'approve',
        type: 'function',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
    },
    balanceOf: {
        name: 'balanceOf',
        type: 'function',
        inputs: [
            { name: 'account', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
} as const;

// Helper function moved outside component for stable reference
function encodeFunctionData(funcName: 'allowance' | 'approve' | 'balanceOf', args: string[]): string {
    const iface = new ethers.Interface([ERC20_ABI[funcName]]);
    return iface.encodeFunctionData(funcName, args);
}

/**
 * SwapNodeConfiguration - Configuration component for swap nodes
 * 
 * Allows users to configure token swaps with:
 * - Network from user menu (read-only, automatically synced)
 * - Provider selection (Uniswap, 1inch, Relay - set by block type)
 * - Token pair selection (source and destination)
 * - Amount input with token decimals handling
 * - Swap type locked to EXACT_INPUT
 * - Slippage tolerance uses backend default (not configurable)
 * - Quote preview before execution
 */
export function SwapNodeConfiguration({
    nodeData,
    handleDataChange,
    authenticated,
    login,
    forcedProvider,
}: SwapNodeConfigurationProps) {
    const { wallets } = useWallets();
    const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
    const walletAddress = embeddedWallet?.address || "";

    const { selection } = useSafeWalletContext();
    const selectedSafe = selection.selectedSafe;

    // Get access token for authenticated API calls
    const { getPrivyAccessToken, chainId, ethereumProvider } = usePrivyWallet();

    // Extract current configuration from node data (needed early for isLiFi / chain logic)
    const swapProvider =
        forcedProvider ||
        (nodeData.swapProvider as SwapProvider) ||
        SwapProvider.UNISWAP;

    // Convert chainId to chain string
    const getChainFromChainId = useCallback((cid: number | null | string): string => {
        const id = typeof cid === 'string' ? parseInt(cid) : cid;
        return getChain(id)?.id || "ARBITRUM";
    }, []);

    const isLiFi = swapProvider === SwapProvider.LIFI;

    // For LiFi: from/to chain from node config (user selects in UI). For other providers: chain from wallet.
    const swapChain: string = isLiFi
        ? ((nodeData.swapChain as string) || "ARBITRUM")
        : (chainId ? getChainFromChainId(chainId) : "ARBITRUM");

    const swapToChain: string | undefined = isLiFi
        ? (nodeData.swapToChain as string | undefined)
        : undefined;

    // Local state for advanced options visibility
    const [quoteState, setQuoteState] = useState<QuoteState>({
        loading: false,
        error: null,
        data: null,
    });
    const [executionState, setExecutionState] = useState<ExecutionState>({
        loading: false,
        error: null,
        txHash: null,
        approvalTxHash: null,
        success: false,
        step: 'idle',
    });
    const [copiedSourceToken, setCopiedSourceToken] = useState(false);
    const [copiedDestToken, setCopiedDestToken] = useState(false);

    // Custom token input state (for mainnet only)
    const [showCustomSourceToken, setShowCustomSourceToken] = useState(false);
    const [showCustomDestToken, setShowCustomDestToken] = useState(false);
    const [customTokenAddress, setCustomTokenAddress] = useState("");
    const [customTokenLoading, setCustomTokenLoading] = useState(false);
    const [customTokenError, setCustomTokenError] = useState<string | null>(null);

    // Source chain tokens (from-chain for LiFi, swapChain for others)
    const availableTokens = useMemo(() => {
        return getTokensForChain(swapChain);
    }, [swapChain]);

    // Destination chain tokens (to-chain for LiFi when cross-chain, else same as source)
    const destChainTokens = useMemo(() => {
        const chain = isLiFi && swapToChain ? swapToChain : swapChain;
        return getTokensForChain(chain);
    }, [isLiFi, swapToChain, swapChain]);

    // Check if custom token input is allowed (per chain)
    const canUseCustomTokens = useMemo(() => {
        return allowsCustomTokens(swapChain);
    }, [swapChain]);

    const sourceTokenAddress = (nodeData.sourceTokenAddress as string) || "";
    const destinationTokenAddress = (nodeData.destinationTokenAddress as string) || "";

    const sourceTokenOptions = useMemo(
        () => [
            { value: "", label: "Select token..." },
            ...availableTokens.map((t: TokenInfo) => ({ value: t.address, label: t.symbol ?? t.address })),
            ...(canUseCustomTokens ? [{ value: CUSTOM_TOKEN_OPTION, label: "+ Custom..." }] : []),
        ],
        [availableTokens, canUseCustomTokens]
    );
    const destTokenOptions = useMemo(
        () => [
            { value: "", label: "Select token..." },
            ...destChainTokens
                .filter((t: TokenInfo) => t.address !== sourceTokenAddress)
                .map((t: TokenInfo) => ({ value: t.address, label: t.symbol ?? t.address })),
            ...(canUseCustomTokens ? [{ value: CUSTOM_TOKEN_OPTION, label: "+ Custom..." }] : []),
        ],
        [destChainTokens, sourceTokenAddress, canUseCustomTokens]
    );

    // Ensure forced provider is persisted into node data so future saves/loads are consistent
    React.useEffect(() => {
        if (forcedProvider && nodeData.swapProvider !== forcedProvider) {
            handleDataChange({ swapProvider: forcedProvider });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [forcedProvider]);
    // Note: swapType is always EXACT_INPUT (locked) - using SwapType.EXACT_INPUT directly
    const sourceTokenSymbol = (nodeData.sourceTokenSymbol as string) || "";
    const sourceTokenDecimals = (nodeData.sourceTokenDecimals as number) || 18;
    const destinationTokenSymbol = (nodeData.destinationTokenSymbol as string) || "";
    const destinationTokenDecimals = (nodeData.destinationTokenDecimals as number) || 18;
    const swapAmount = (nodeData.swapAmount as string) || "";

    // Get the wallet address to use (Safe or EOA)
    const effectiveWalletAddress = selectedSafe || walletAddress;

    // Track previous wallet address to avoid unnecessary updates
    const prevWalletRef = React.useRef<string | null>(null);

    // Update wallet address and chain in node data only when they actually change
    // Using ref to prevent infinite loop
    React.useEffect(() => {
        const updates: Record<string, unknown> = {};

        if (
            effectiveWalletAddress &&
            effectiveWalletAddress !== prevWalletRef.current &&
            effectiveWalletAddress !== nodeData.walletAddress
        ) {
            prevWalletRef.current = effectiveWalletAddress;
            updates.walletAddress = effectiveWalletAddress;
        }

        // Update chain from user menu only for non-LiFi (LiFi uses configurable From/To chain in UI)
        if (!isLiFi && swapChain !== nodeData.swapChain) {
            updates.swapChain = swapChain;
            // Reset token selection when chain changes since addresses differ
            updates.sourceTokenAddress = "";
            updates.sourceTokenSymbol = "";
            updates.destinationTokenAddress = "";
            updates.destinationTokenSymbol = "";
            updates.hasQuote = false;
        }

        // Always ensure swapType is EXACT_INPUT
        if (nodeData.swapType !== SwapType.EXACT_INPUT) {
            updates.swapType = SwapType.EXACT_INPUT;
        }

        if (Object.keys(updates).length > 0) {
            handleDataChange(updates);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveWalletAddress, swapChain, isLiFi]);

    // Fetch token info from chain (for custom token input)
    const fetchTokenInfo = useCallback(async (address: string, isSource: boolean) => {
        if (!address || address.length !== 42 || !address.startsWith("0x")) {
            setCustomTokenError("Invalid token address");
            return;
        }

        setCustomTokenLoading(true);
        setCustomTokenError(null);

        const chainForToken = isSource ? swapChain : (swapToChain ?? swapChain);
        try {
            // Call backend to fetch token info from chain
            const response = await fetch(
                `${buildApiUrl(API_CONFIG.ENDPOINTS.SWAP.PROVIDERS)}/${chainForToken}/token/${address}`
            );

            if (!response.ok) {
                // If backend endpoint doesn't exist, try to get basic info
                // For now, just set address with default decimals
                const tokenData: TokenInfo = {
                    address: address,
                    symbol: "UNKNOWN",
                    decimals: 18,
                    name: "Custom Token",
                };

                if (isSource) {
                    handleDataChange({
                        sourceTokenAddress: tokenData.address,
                        sourceTokenSymbol: tokenData.symbol,
                        sourceTokenDecimals: tokenData.decimals,
                        hasQuote: false,
                    });
                    setShowCustomSourceToken(false);
                } else {
                    handleDataChange({
                        destinationTokenAddress: tokenData.address,
                        destinationTokenSymbol: tokenData.symbol,
                        destinationTokenDecimals: tokenData.decimals,
                        hasQuote: false,
                    });
                    setShowCustomDestToken(false);
                }
                setCustomTokenAddress("");
                return;
            }

            const data = await response.json();
            const tokenData = data.data as TokenInfo;

            if (isSource) {
                handleDataChange({
                    sourceTokenAddress: tokenData.address,
                    sourceTokenSymbol: tokenData.symbol || "UNKNOWN",
                    sourceTokenDecimals: tokenData.decimals || 18,
                    hasQuote: false,
                });
                setShowCustomSourceToken(false);
            } else {
                handleDataChange({
                    destinationTokenAddress: tokenData.address,
                    destinationTokenSymbol: tokenData.symbol || "UNKNOWN",
                    destinationTokenDecimals: tokenData.decimals || 18,
                    hasQuote: false,
                });
                setShowCustomDestToken(false);
            }
            setCustomTokenAddress("");
        } catch (error) {
            setCustomTokenError(
                error instanceof Error ? error.message : "Failed to fetch token info"
            );
        } finally {
            setCustomTokenLoading(false);
        }
    }, [swapChain, swapToChain, handleDataChange]);

    // Handle token selection from dropdown
    const handleSourceTokenChange = useCallback((tokenAddress: string) => {
        if (tokenAddress === CUSTOM_TOKEN_OPTION) {
            setShowCustomSourceToken(true);
            setCustomTokenAddress("");
            setCustomTokenError(null);
            return;
        }

        const token = availableTokens.find((t: TokenInfo) => t.address === tokenAddress);
        if (token) {
            handleDataChange({
                sourceTokenAddress: token.address,
                sourceTokenSymbol: token.symbol,
                sourceTokenDecimals: token.decimals,
                hasQuote: false,
            });
        } else {
            handleDataChange({
                sourceTokenAddress: tokenAddress,
                sourceTokenSymbol: "",
                sourceTokenDecimals: 18,
                hasQuote: false,
            });
        }
        setShowCustomSourceToken(false);
    }, [handleDataChange, availableTokens]);

    const handleDestinationTokenChange = useCallback((tokenAddress: string) => {
        if (tokenAddress === CUSTOM_TOKEN_OPTION) {
            setShowCustomDestToken(true);
            setCustomTokenAddress("");
            setCustomTokenError(null);
            return;
        }

        const token = destChainTokens.find((t: TokenInfo) => t.address === tokenAddress);
        if (token) {
            handleDataChange({
                destinationTokenAddress: token.address,
                destinationTokenSymbol: token.symbol,
                destinationTokenDecimals: token.decimals,
                hasQuote: false,
            });
        } else {
            handleDataChange({
                destinationTokenAddress: tokenAddress,
                destinationTokenSymbol: "",
                destinationTokenDecimals: 18,
                hasQuote: false,
            });
        }
        setShowCustomDestToken(false);
    }, [handleDataChange, destChainTokens]);



    // Check if configuration is valid for getting a quote
    const isValidForQuote = useMemo(() => {
        return (
            sourceTokenAddress &&
            destinationTokenAddress &&
            swapAmount &&
            parseFloat(swapAmount) > 0 &&
            effectiveWalletAddress
        );
    }, [sourceTokenAddress, destinationTokenAddress, swapAmount, effectiveWalletAddress]);

    // Get quote from backend
    const handleGetQuote = useCallback(async () => {
        if (!isValidForQuote || !sourceTokenAddress || !destinationTokenAddress) return;

        setQuoteState({ loading: true, error: null, data: null });

        try {
            // Convert amount to wei/smallest unit based on token decimals
            const amountInWei = (parseFloat(swapAmount) * Math.pow(10, sourceTokenDecimals)).toString();

            // Build swap config without slippageTolerance (backend will use default)
            const swapConfig: SwapInputConfig = {
                sourceToken: {
                    address: sourceTokenAddress,
                    symbol: sourceTokenSymbol,
                    decimals: sourceTokenDecimals,
                },
                destinationToken: {
                    address: destinationTokenAddress,
                    symbol: destinationTokenSymbol,
                    decimals: destinationTokenDecimals,
                },
                amount: amountInWei,
                swapType: SwapType.EXACT_INPUT,
                walletAddress: effectiveWalletAddress,
                ...(isLiFi && swapToChain && swapToChain !== swapChain && { toChain: swapToChain }),
            };

            const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.SWAP.QUOTE)}/${swapProvider}/${swapChain}`;

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

            const quote = data.data;

            // Format amount out for display
            const decimals = destinationTokenDecimals || 18;
            const amountOutFormatted = (
                parseFloat(quote.amountOut) / Math.pow(10, decimals)
            ).toFixed(6);

            setQuoteState({
                loading: false,
                error: null,
                data: {
                    amountOut: amountOutFormatted,
                    priceImpact: quote.priceImpact || "0",
                    gasEstimate: quote.gasEstimate || "0",
                },
            });

            handleDataChange({
                hasQuote: true,
                quoteAmountOut: amountOutFormatted,
                quotePriceImpact: quote.priceImpact || "0",
                quoteGasEstimate: quote.gasEstimate || "0",
            });
        } catch (error) {
            setQuoteState({
                loading: false,
                error: error instanceof Error ? error.message : "Failed to get quote",
                data: null,
            });
        }
    }, [
        isValidForQuote,
        sourceTokenAddress,
        sourceTokenSymbol,
        sourceTokenDecimals,
        destinationTokenAddress,
        destinationTokenSymbol,
        destinationTokenDecimals,
        swapAmount,
        effectiveWalletAddress,
        swapProvider,
        swapChain,
        swapToChain,
        isLiFi,
        handleDataChange,
    ]);

    // Execute swap - uses Safe transaction flow if Safe wallet is selected
    const handleExecuteSwap = useCallback(async () => {
        if (!isValidForQuote || !sourceTokenAddress || !destinationTokenAddress || !embeddedWallet) return;

        // Check if Safe wallet is selected - use Safe transaction flow
        if (selectedSafe && authenticated) {
            //console.log("Using Safe transaction flow for swap", { selectedSafe, authenticated });
            setExecutionState({ loading: true, error: null, txHash: null, approvalTxHash: null, success: false, step: 'building-tx' });

            try {
                // Get access token for authenticated API calls
                const accessToken = await getPrivyAccessToken();
                if (!accessToken) {
                    throw new Error("Please log in to execute swaps");
                }

                // Convert amount to wei/smallest unit based on token decimals
                const amountInWei = ethers.parseUnits(swapAmount || "0", sourceTokenDecimals);

                const swapConfig = {
                    sourceToken: {
                        address: sourceTokenAddress,
                        symbol: sourceTokenSymbol,
                        decimals: sourceTokenDecimals,
                    },
                    destinationToken: {
                        address: destinationTokenAddress,
                        symbol: destinationTokenSymbol,
                        decimals: destinationTokenDecimals,
                    },
                    amount: amountInWei.toString(),
                    swapType: SwapType.EXACT_INPUT,
                    walletAddress: walletAddress, // User's EOA wallet (for identification)
                    ...(isLiFi && swapToChain && swapToChain !== swapChain && { toChain: swapToChain }),
                };

                // Step 1: Build Safe transaction hash
                //console.log("Step 1: Building Safe transaction hash...");
                const buildUrl = `${buildApiUrl(API_CONFIG.ENDPOINTS.SWAP.BUILD_SAFE_TRANSACTION)}/${swapProvider}/${swapChain}`;

                const buildResponse = await fetch(buildUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(swapConfig),
                });

                if (!buildResponse.ok) {
                    const errorData = await buildResponse.json().catch(() => ({ error: { message: "Request failed" } }));
                    throw new Error(errorData.error?.message || `HTTP ${buildResponse.status}`);
                }

                const buildData = await buildResponse.json();
                if (!buildData.success) {
                    throw new Error(buildData.error?.message || "Failed to build Safe transaction");
                }

                const { safeTxHash, safeAddress, safeTxData, needsApproval, nodeExecutionId } = buildData.data;
                //console.log("Safe transaction hash built:", safeTxHash);

                // Step 2: Sign Safe transaction hash using Safe SDK
                //console.log("Step 2: Signing Safe transaction...");
                setExecutionState(prev => ({ ...prev, step: 'approving' }));

                if (!ethereumProvider) {
                    throw new Error("Ethereum provider not available");
                }

                // Initialize Safe SDK
                const safeSdk = await Safe.init({
                    provider: ethereumProvider as unknown as ethers.Eip1193Provider,
                    safeAddress: safeAddress,
                });

                // Create Safe transaction from the data we got from backend
                const safeTransaction = await safeSdk.createTransaction({
                    transactions: [{
                        to: safeTxData.to,
                        value: safeTxData.value,
                        data: safeTxData.data,
                        operation: safeTxData.operation,
                    }],
                });

                // Sign the transaction (triggers EIP-712 signature popup)
                const signedSafeTx = await safeSdk.signTransaction(safeTransaction);
                // Ensure the hash we signed matches what backend built (otherwise signatures will revert on-chain)
                const signedTxHash = await safeSdk.getTransactionHash(signedSafeTx);
                if (signedTxHash.toLowerCase() !== safeTxHash.toLowerCase()) {
                    throw new Error(
                        `Safe tx hash mismatch. Backend=${safeTxHash} Frontend=${signedTxHash}`
                    );
                }

                // Extract signatures in the format backend expects (concatenated bytes)
                // Safe SDK's encodedSignatures() returns signatures in the correct format
                const concatenatedSignatures = signedSafeTx.encodedSignatures();

                if (!concatenatedSignatures || concatenatedSignatures === "0x") {
                    throw new Error("Failed to get signature from Safe transaction");
                }

                //console.log("Transaction signed, executing...");
                setExecutionState(prev => ({ ...prev, step: 'swapping' }));

                // Step 3: Execute swap with signature
                const executeUrl = `${buildApiUrl(API_CONFIG.ENDPOINTS.SWAP.EXECUTE_WITH_SIGNATURE)}/${swapProvider}/${swapChain}`;

                const executeResponse = await fetch(executeUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        config: swapConfig,
                        signature: concatenatedSignatures,
                        nodeExecutionId: nodeExecutionId,
                    }),
                });

                if (!executeResponse.ok) {
                    const errorData = await executeResponse.json().catch(() => ({ error: { message: "Request failed" } }));
                    throw new Error(errorData.error?.message || `HTTP ${executeResponse.status}`);
                }

                const executeData = await executeResponse.json();
                if (!executeData.success) {
                    throw new Error(executeData.error?.message || "Failed to execute swap");
                }

                const result = executeData.data;
                //console.log("Swap executed successfully:", result.txHash);

                setExecutionState({
                    loading: false,
                    error: null,
                    txHash: result.txHash || null,
                    approvalTxHash: needsApproval ? "multicall" : null, // Indicate approval was included
                    success: true,
                    step: 'done',
                });

                handleDataChange({
                    lastTxHash: result.txHash,
                    lastExecutedAt: new Date().toISOString(),
                });

            } catch (error) {
                //console.error("Safe swap execution failed:", error);
                setExecutionState({
                    loading: false,
                    error: error instanceof Error ? error.message : "Failed to execute swap",
                    txHash: null,
                    approvalTxHash: null,
                    success: false,
                    step: 'idle',
                });
            }
            return;
        }

        // Fallback to old direct EOA flow (for backwards compatibility when no Safe selected)
        // Warn user if Safe wallet should be used
        if (!selectedSafe) {
            //console.warn("No Safe wallet selected - using direct EOA flow. This requires gas funds in your wallet.");
        }
        if (!authenticated) {
            //console.warn("User not authenticated - using direct EOA flow. Please log in to use Safe wallet.");
        }

        setExecutionState({ loading: true, error: null, txHash: null, approvalTxHash: null, success: false, step: 'checking-allowance' });

        try {
            // Get the wallet provider
            const provider = await embeddedWallet.getEthereumProvider();
            // Uniswap V4: first approval is token -> Permit2; others use router for allowance
            const routerAddress =
                swapProvider === SwapProvider.UNISWAP_V4
                    ? getContractAddress(swapChain, "permit2") ?? ""
                    : getContractAddress(swapChain, "uniswapRouter") ?? "";

            // Convert amount to wei/smallest unit based on token decimals
            const amountInWei = ethers.parseUnits(swapAmount || "0", sourceTokenDecimals);

            // Step 0: Check token balance first
            //console.log("Step 0: Checking token balance...");
            const balanceData = encodeFunctionData('balanceOf', [effectiveWalletAddress]);

            const balanceResult = await provider.request({
                method: 'eth_call',
                params: [{
                    to: sourceTokenAddress,
                    data: balanceData,
                }, 'latest'],
            });

            const currentBalance = BigInt(balanceResult as string);
            const formattedBalance = (Number(currentBalance) / Math.pow(10, sourceTokenDecimals)).toFixed(6);
            //console.log("Current balance:", currentBalance.toString(), `(${formattedBalance} ${sourceTokenSymbol})`, "Required:", amountInWei.toString());

            if (currentBalance < amountInWei) {
                const requiredFormatted = (Number(amountInWei) / Math.pow(10, sourceTokenDecimals)).toFixed(6);
                throw new Error(
                    `Insufficient ${sourceTokenSymbol} balance. You have ${formattedBalance} but need ${requiredFormatted} ${sourceTokenSymbol}. ` +
                    `Please get testnet tokens from a faucet.`
                );
            }

            // Step 1: Check current allowance
            //console.log("Step 1: Checking allowance...");
            const allowanceData = encodeFunctionData('allowance', [effectiveWalletAddress, routerAddress]);

            const allowanceResult = await provider.request({
                method: 'eth_call',
                params: [{
                    to: sourceTokenAddress,
                    data: allowanceData,
                }, 'latest'],
            });

            const currentAllowance = BigInt(allowanceResult as string);
            //console.log("Current allowance:", currentAllowance.toString(), "Required:", amountInWei.toString());

            // Step 2: If allowance is insufficient, request approval
            if (currentAllowance < amountInWei) {
                //console.log("Step 2: Requesting token approval...");
                setExecutionState(prev => ({ ...prev, step: 'approving' }));

                // Approve max uint256 for convenience (or you could approve exact amount)
                const maxApproval = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
                const approveData = encodeFunctionData('approve', [routerAddress, maxApproval]);

                // Send approval transaction
                const approveTxHash = await provider.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: effectiveWalletAddress,
                        to: sourceTokenAddress,
                        data: approveData,
                    }],
                });

                //console.log("Approval tx sent:", approveTxHash);
                setExecutionState(prev => ({ ...prev, step: 'waiting-approval', approvalTxHash: approveTxHash as string }));

                // Wait for approval confirmation
                //console.log("Waiting for approval confirmation...");
                let approvalConfirmed = false;
                let attempts = 0;
                const maxAttempts = 60; // 60 seconds timeout

                while (!approvalConfirmed && attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    try {
                        const receipt = await provider.request({
                            method: 'eth_getTransactionReceipt',
                            params: [approveTxHash],
                        });

                        if (receipt && (receipt as { status?: string }).status === '0x1') {
                            approvalConfirmed = true;
                            //console.log("Approval confirmed!");
                        } else if (receipt && (receipt as { status?: string }).status === '0x0') {
                            throw new Error("Approval transaction failed");
                        }
                    } catch {
                        // Transaction not yet mined, continue waiting
                    }

                    attempts++;
                }

                if (!approvalConfirmed) {
                    throw new Error("Approval transaction timeout. Please try again.");
                }
            } else {
                //console.log("Sufficient allowance exists, skipping approval step.");
            }

            // Uniswap V4 only: Permit2 must allow Universal Router to pull the token
            if (swapProvider === SwapProvider.UNISWAP_V4) {
                const universalRouter = getContractAddress(swapChain, "universalRouter") ?? "";
                const maxUint160 = BigInt("0xffffffffffffffffffffffffffffffffffffffff");
                const amount160 = amountInWei > maxUint160 ? maxUint160 : amountInWei;
                const expiration = Math.floor(Date.now() / 1000) + 3600;
                const permit2ApproveIface = new ethers.Interface([
                    "function approve(address token, address spender, uint160 amount, uint48 expiration)",
                ]);
                const permit2ApproveData = permit2ApproveIface.encodeFunctionData("approve", [
                    sourceTokenAddress,
                    universalRouter,
                    amount160.toString(),
                    expiration,
                ]);
                setExecutionState(prev => ({ ...prev, step: "approving" }));
                const permit2TxHash = await provider.request({
                    method: "eth_sendTransaction",
                    params: [{
                        from: effectiveWalletAddress,
                        to: getContractAddress(swapChain, "permit2") ?? "",
                        data: permit2ApproveData,
                    }],
                });
                setExecutionState(prev => ({ ...prev, step: "waiting-approval", approvalTxHash: permit2TxHash as string }));
                let permit2Confirmed = false;
                let permit2Attempts = 0;
                while (!permit2Confirmed && permit2Attempts < 60) {
                    await new Promise(r => setTimeout(r, 1000));
                    try {
                        const receipt = await provider.request({
                            method: "eth_getTransactionReceipt",
                            params: [permit2TxHash],
                        }) as { status?: string } | null;
                        if (receipt?.status === "0x1") permit2Confirmed = true;
                        else if (receipt?.status === "0x0") throw new Error("Permit2 approval failed");
                    } catch {
                        // keep waiting
                    }
                    permit2Attempts++;
                }
                if (!permit2Confirmed) throw new Error("Permit2 approval timeout. Please try again.");
            }

            // Step 3: Build and send swap transaction
            //console.log("Step 3: Building swap transaction...");
            setExecutionState(prev => ({ ...prev, step: 'building-tx' }));

            const swapConfig = {
                sourceToken: {
                    address: sourceTokenAddress,
                    symbol: sourceTokenSymbol,
                    decimals: sourceTokenDecimals,
                },
                destinationToken: {
                    address: destinationTokenAddress,
                    symbol: destinationTokenSymbol,
                    decimals: destinationTokenDecimals,
                },
                amount: amountInWei.toString(),
                swapType: SwapType.EXACT_INPUT,
                walletAddress: effectiveWalletAddress,
                simulateFirst: false, // Skip simulation since we've handled approval
                ...(isLiFi && swapToChain && swapToChain !== swapChain && { toChain: swapToChain }),
            };

            const url = `${buildApiUrl(API_CONFIG.ENDPOINTS.SWAP.BUILD_TRANSACTION)}/${swapProvider}/${swapChain}`;

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
                throw new Error(data.error?.message || "Failed to build transaction");
            }

            const { transaction } = data.data;

            // Step 4: Send swap transaction
            //console.log("Step 4: Sending swap transaction...");
            setExecutionState(prev => ({ ...prev, step: 'swapping' }));
            const txHash = await provider.request({
                method: "eth_sendTransaction",
                params: [{
                    from: effectiveWalletAddress,
                    to: transaction.to,
                    data: transaction.data,
                    value: transaction.value ? `0x${BigInt(transaction.value).toString(16)}` : "0x0",
                    gas: transaction.gasLimit ? `0x${BigInt(transaction.gasLimit).toString(16)}` : undefined,
                }],
            });

            //console.log("Swap tx sent:", txHash);

            setExecutionState({
                loading: false,
                error: null,
                txHash: txHash as string,
                approvalTxHash: null,
                success: true,
                step: 'done',
            });

            handleDataChange({
                lastTxHash: txHash,
                lastExecutedAt: new Date().toISOString(),
            });

        } catch (error) {
            //console.error("Swap execution failed:", error);
            setExecutionState({
                loading: false,
                error: error instanceof Error ? error.message : "Failed to execute swap",
                txHash: null,
                approvalTxHash: null,
                success: false,
                step: 'idle',
            });
        }
    }, [
        isValidForQuote,
        sourceTokenAddress,
        sourceTokenSymbol,
        sourceTokenDecimals,
        destinationTokenAddress,
        destinationTokenSymbol,
        destinationTokenDecimals,
        swapAmount,
        effectiveWalletAddress,
        swapProvider,
        swapChain,
        swapToChain,
        isLiFi,
        embeddedWallet,
        handleDataChange,
        selectedSafe,
        authenticated,
        getPrivyAccessToken,
        ethereumProvider,
        walletAddress,
    ]);

    // Show login prompt if not authenticated
    if (!authenticated) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <SimpleCard className="p-6 w-full max-w-md space-y-4">
                    <div className="space-y-4 text-center">
                        <div className="flex justify-center">
                            <div className="p-3 rounded-full bg-primary/10">
                                <LuLogIn className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Typography variant="h4" className="text-foreground">
                                Login Required
                            </Typography>
                            <Typography variant="bodySmall" className="text-muted-foreground">
                                Please login to configure swap settings
                            </Typography>
                        </div>
                        <Button onClick={login} className="w-full gap-2">
                            <LuLogIn className="w-4 h-4" />
                            Login to Continue
                        </Button>
                    </div>
                </SimpleCard>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* LiFi: From chain / To chain */}
            {isLiFi && (
                <SimpleCard className="p-5">
                    <Typography variant="h5" className="font-semibold text-foreground mb-4">
                        Chains
                    </Typography>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Typography variant="caption" className="text-muted-foreground block mb-2 font-medium">
                                From chain
                            </Typography>
                            <Dropdown
                                value={swapChain}
                                onChange={(e) => {
                                    const next = e.target.value as string;
                                    handleDataChange({
                                        swapChain: next,
                                        sourceTokenAddress: "",
                                        sourceTokenSymbol: "",
                                        sourceTokenDecimals: 18,
                                        destinationTokenAddress: "",
                                        destinationTokenSymbol: "",
                                        destinationTokenDecimals: 18,
                                        hasQuote: false,
                                    });
                                }}
                                options={LIFI_CHAINS.map((c) => ({ value: c, label: getChain(c)?.name || c }))}
                                placeholder="From"
                            />
                        </div>
                        <div>
                            <Typography variant="caption" className="text-muted-foreground block mb-2 font-medium">
                                To chain
                            </Typography>
                            <Dropdown
                                value={swapToChain ?? "__SAME__"}
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    const next = raw === "__SAME__" ? undefined : (raw as string);
                                    handleDataChange({
                                        swapToChain: next,
                                        destinationTokenAddress: "",
                                        destinationTokenSymbol: "",
                                        destinationTokenDecimals: 18,
                                        hasQuote: false,
                                    });
                                }}
                                options={[
                                    { value: "__SAME__", label: "Same as from" },
                                    ...LIFI_CHAINS.map((c) => ({ value: c, label: getChain(c)?.name || c })),
                                ]}
                                placeholder="To"
                            />
                        </div>
                    </div>
                </SimpleCard>
            )}

            {/* Section 1: Token Selection — swap-style layout */}
            <SimpleCard className="p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <Typography variant="h5" className="font-semibold text-foreground">
                        {isLiFi ? "1. Select Tokens" : "1. Select Tokens"}
                    </Typography>
                    {!isLiFi && (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${swapChain === "ARBITRUM_SEPOLIA" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                            {swapChain === "ARBITRUM_SEPOLIA" ? "Testnet" : "Mainnet"}
                        </span>
                    )}
                    {isLiFi && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0 bg-white/10 text-foreground">
                            {getChain(swapChain)?.name || swapChain} → {swapToChain ? (getChain(swapToChain)?.name || swapToChain) : (getChain(swapChain)?.name || swapChain)}
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-0">
                    {/* From — you pay */}
                    <div className="rounded-t-xl border border-white/15 bg-black/20 p-3.5">
                        <Typography variant="caption" className="text-muted-foreground block mb-2 font-medium">
                            From
                        </Typography>
                        {showCustomSourceToken ? (
                            <div className="space-y-2">
                                <FormInput
                                    label="Token address"
                                    type="text"
                                    value={customTokenAddress}
                                    onChange={(e) => setCustomTokenAddress(e.target.value)}
                                    placeholder="0x..."
                                    error={customTokenError || undefined}
                                />
                                <div className="flex gap-2">
                                    <Button onClick={() => fetchTokenInfo(customTokenAddress, true)} disabled={customTokenLoading || !customTokenAddress} className="h-8 text-xs gap-1.5">
                                        {customTokenLoading ? <LuLoader className="w-3.5 h-3.5 animate-spin" /> : <LuSearch className="w-3.5 h-3.5" />}
                                        Fetch
                                    </Button>
                                    <Button onClick={() => setShowCustomSourceToken(false)} className="h-8 text-xs">Back</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Dropdown
                                    value={sourceTokenAddress}
                                    onChange={(e) => handleSourceTokenChange(e.target.value)}
                                    options={sourceTokenOptions}
                                    placeholder="Select token"
                                />
                                {sourceTokenAddress && sourceTokenAddress !== CUSTOM_TOKEN_OPTION && (
                                    <div className="flex items-center gap-2 mt-2 min-w-0">
                                        <span className="text-[11px] font-mono text-muted-foreground truncate flex-1 min-w-0">{sourceTokenAddress}</span>
                                        <Button onClick={async () => { await navigator.clipboard.writeText(sourceTokenAddress); setCopiedSourceToken(true); setTimeout(() => setCopiedSourceToken(false), 2000); }} className="shrink-0 h-6 w-6 p-0" title="Copy">
                                            {copiedSourceToken ? <LuCheck className="w-3 h-3 text-green-500" /> : <LuCopy className="w-3 h-3 text-muted-foreground" />}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex justify-center -my-px relative z-10">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-sm">
                            <LuArrowDown className="w-3.5 h-3.5 text-muted-foreground" />
                        </span>
                    </div>

                    {/* To — you receive */}
                    <div className="rounded-b-xl border border-white/15 bg-black/20 p-3.5 border-t-0 pt-3.5">
                        <Typography variant="caption" className="text-muted-foreground block mb-2 font-medium">
                            To
                        </Typography>
                        {showCustomDestToken ? (
                            <div className="space-y-2">
                                <FormInput
                                    label="Token address"
                                    type="text"
                                    value={customTokenAddress}
                                    onChange={(e) => setCustomTokenAddress(e.target.value)}
                                    placeholder="0x..."
                                    error={customTokenError || undefined}
                                />
                                <div className="flex gap-2">
                                    <Button onClick={() => fetchTokenInfo(customTokenAddress, false)} disabled={customTokenLoading || !customTokenAddress} className="h-8 text-xs gap-1.5">
                                        {customTokenLoading ? <LuLoader className="w-3.5 h-3.5 animate-spin" /> : <LuSearch className="w-3.5 h-3.5" />}
                                        Fetch
                                    </Button>
                                    <Button onClick={() => setShowCustomDestToken(false)} className="h-8 text-xs">Back</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Dropdown
                                    value={destinationTokenAddress}
                                    onChange={(e) => handleDestinationTokenChange(e.target.value)}
                                    options={destTokenOptions}
                                    placeholder="Select token"
                                />
                                {destinationTokenAddress && destinationTokenAddress !== CUSTOM_TOKEN_OPTION && (
                                    <div className="flex items-center gap-2 mt-2 min-w-0">
                                        <span className="text-[11px] font-mono text-muted-foreground truncate flex-1 min-w-0">{destinationTokenAddress}</span>
                                        <Button onClick={async () => { await navigator.clipboard.writeText(destinationTokenAddress); setCopiedDestToken(true); setTimeout(() => setCopiedDestToken(false), 2000); }} className="shrink-0 h-6 w-6 p-0" title="Copy">
                                            {copiedDestToken ? <LuCheck className="w-3 h-3 text-green-500" /> : <LuCopy className="w-3 h-3 text-muted-foreground" />}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </SimpleCard>

            {/* Section 2: Enter Amount — same style as Section 1 */}
            <SimpleCard className="p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <Typography variant="h5" className="font-semibold text-foreground">
                        2. Enter Amount
                    </Typography>
                    {sourceTokenSymbol && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0 bg-white/10 text-foreground">
                            {sourceTokenSymbol}
                        </span>
                    )}
                </div>
                <div className="rounded-xl border border-white/15 bg-black/20 p-3.5">
                    <div className="flex items-center gap-3">
                        <FormInput
                            label="Amount to swap"
                            type="text"
                            value={swapAmount}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.]/g, "");
                                handleDataChange({ swapAmount: value, hasQuote: false });
                            }}
                            placeholder="0.0"
                            className="flex-1 min-w-0"
                        />
                        {sourceTokenSymbol && (
                            <span className="text-sm font-medium text-foreground shrink-0">
                                {sourceTokenSymbol}
                            </span>
                        )}
                    </div>
                </div>
            </SimpleCard>

            {/* Section 3: Quote Preview — same style as Section 1 & 2 */}
            <SimpleCard className="p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <Typography variant="h5" className="font-semibold text-foreground">
                        3. Preview
                    </Typography>
                    <Button
                        onClick={handleGetQuote}
                        disabled={!isValidForQuote || quoteState.loading}
                        className="h-8 text-xs gap-1.5 shrink-0"
                    >
                        {quoteState.loading ? (
                            <>
                                <LuLoader className="w-3.5 h-3.5 animate-spin" />
                                Getting Data...
                            </>
                        ) : (
                            <>
                                <LuRefreshCw className="w-3.5 h-3.5" />
                                Get Data
                            </>
                        )}
                    </Button>
                </div>

                <div className="rounded-xl border border-white/15 bg-black/20 p-3.5 space-y-3">
                    {quoteState.error && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                            <LuCircleAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                            <Typography variant="caption" className="text-destructive">
                                {quoteState.error}
                            </Typography>
                        </div>
                    )}

                    {quoteState.data && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Est. Receive</span>
                                <span className="text-sm font-medium text-foreground">
                                    {parseFloat(quoteState.data.amountOut).toFixed(3)} {destinationTokenSymbol}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Price Impact</span>
                                <span className={`text-sm font-medium ${parseFloat(quoteState.data.priceImpact) > 1 ? "text-amber-500" : "text-foreground"}`}>
                                    {quoteState.data.priceImpact}%
                                </span>
                            </div>
                        </div>
                    )}

                    {!quoteState.error && !quoteState.data && (
                        <Typography variant="bodySmall" className="text-muted-foreground">
                            Get quote and estimated receive amount
                        </Typography>
                    )}
                </div>
            </SimpleCard>

            {/* Section 4: Execute Swap (Test) */}
            {quoteState.data && (
                <SimpleCard className="space-y-4 p-5">
                    <div className="space-y-1 mb-4">
                        <Typography variant="h5" className="font-semibold text-foreground">
                            Execute Swap (Test)
                        </Typography>
                        <Typography variant="bodySmall" className="text-muted-foreground">
                            Run swap on {swapChain === "ARBITRUM_SEPOLIA" ? "Sepolia" : "Mainnet"} with your embedded wallet
                        </Typography>
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={handleExecuteSwap}
                            disabled={!quoteState.data || executionState.loading || !embeddedWallet}
                            className="w-full gap-2"
                        >
                            {executionState.loading ? (
                                <>
                                    <LuLoader className="w-4 h-4 animate-spin" />
                                    {executionState.step === 'checking-allowance' && 'Checking allowance...'}
                                    {executionState.step === 'approving' && 'Approve token in wallet...'}
                                    {executionState.step === 'waiting-approval' && 'Waiting for approval...'}
                                    {executionState.step === 'building-tx' && 'Building transaction...'}
                                    {executionState.step === 'swapping' && 'Confirm swap in wallet...'}
                                </>
                            ) : (
                                <>
                                    <LuPlay className="w-4 h-4" />
                                    Execute Swap on {swapChain === "ARBITRUM_SEPOLIA" ? "Sepolia" : "Mainnet"}
                                </>
                            )}
                        </Button>

                        {executionState.loading && executionState.step === 'waiting-approval' && executionState.approvalTxHash && (
                            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-white/10">
                                <LuLoader className="w-4 h-4 animate-spin text-amber-500" />
                                <div className="flex-1 min-w-0">
                                    <Typography variant="caption" className="text-foreground">
                                        Waiting for approval confirmation...
                                    </Typography>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Typography variant="caption" className="text-muted-foreground font-mono text-xs truncate flex-1">
                                            {executionState.approvalTxHash}
                                        </Typography>
                                        <a
                                            href={`https://${swapChain === "ARBITRUM_SEPOLIA" ? "sepolia." : ""}arbiscan.io/tx/${executionState.approvalTxHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-amber-500 hover:text-amber-400 flex items-center gap-1 shrink-0"
                                        >
                                            <LuExternalLink className="w-3.5 h-3.5" />
                                            <span className="text-xs">View</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!embeddedWallet && (
                            <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                                <LuCircleAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                <Typography variant="caption" className="text-amber-500">
                                    No embedded wallet found. Please ensure you are logged in with Privy.
                                </Typography>
                            </div>
                        )}

                        {executionState.error && (
                            <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
                                <LuCircleAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                                <Typography variant="caption" className="text-destructive">
                                    {executionState.error}
                                </Typography>
                            </div>
                        )}

                        {executionState.success && executionState.txHash && (
                            <div className="space-y-2 p-3 rounded-md bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center gap-2">
                                    <LuCircleCheck className="w-4 h-4 text-green-500" />
                                    <Typography variant="caption" className="text-green-500 font-medium">
                                        Swap executed successfully!
                                    </Typography>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Typography variant="caption" className="text-muted-foreground font-mono text-xs truncate flex-1">
                                        {executionState.txHash}
                                    </Typography>
                                    <a
                                        href={`https://${swapChain === "ARBITRUM_SEPOLIA" ? "sepolia." : ""}arbiscan.io/tx/${executionState.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-amber-500 hover:text-amber-400 flex items-center gap-1"
                                    >
                                        <LuExternalLink className="w-3.5 h-3.5" />
                                        <span className="text-xs">View</span>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </SimpleCard>
            )}
        </div>
    );
}

export default SwapNodeConfiguration;
