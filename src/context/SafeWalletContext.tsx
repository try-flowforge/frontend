"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from "react";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { useSafeWallets } from "@/web3/hooks/useSafeWallets";
import { useCreateSafeWallet } from "@/web3/hooks/useCreateSafeWallet";
import { useSafeModuleStatus } from "@/web3/hooks/useSafeModuleStatus";
import { verifyModuleEnabled } from "@/onboarding/utils/safemodule-verifier";
import { useOnboarding } from "@/onboarding/context/OnboardingContext";

// Placeholder types - will be properly typed when we port the hooks
export interface SafeWalletSelection {
    selectedSafe: string | null;
    safeWallets: string[];
    isLoading: boolean;
    error: string | null;
    selectSafe: (safe: string | null) => void;
    refreshSafeList: () => Promise<void>;
    moduleEnabled: boolean | null;
    checkingModule: boolean;
    refreshModuleStatus: () => Promise<void>;
}

export interface SafeWalletCreation {
    showCreateFlow: boolean;
    createStep: "idle" | "pending" | "success" | "error";
    signStep: "idle" | "pending" | "success" | "error";
    enableStep: "idle" | "pending" | "success" | "error";
    createError?: string;
    signError?: string;
    enableError?: string;
    currentSafeAddress: string | null;
    isCreating: boolean;
    isSigningEnableModule: boolean;
    isExecutingEnableModule: boolean;
    handleCreateNewSafe: () => Promise<void>;
    handleRetryCreate: () => Promise<void>;
    handleRetrySign: () => Promise<void>;
    handleRetryEnable: () => Promise<void>;
    closeCreateFlow: () => void;
}

// Split contexts
const SafeWalletSelectionContext = createContext<SafeWalletSelection | undefined>(undefined);
const SafeWalletCreationContext = createContext<SafeWalletCreation | undefined>(undefined);

// Hook for consuming selection context
export const useSafeWalletSelection = () => {
    const context = useContext(SafeWalletSelectionContext);
    if (!context) {
        throw new Error("useSafeWalletSelection must be used within SafeWalletProvider");
    }
    return context;
};

// Hook for consuming creation context
export const useSafeWalletCreation = () => {
    const context = useContext(SafeWalletCreationContext);
    if (!context) {
        throw new Error("useSafeWalletCreation must be used within SafeWalletProvider");
    }
    return context;
};

// Deprecated hook for backward compatibility (if needed temporarily, though we aim to replace usage)
export const useSafeWalletContext = () => {
    const selection = useSafeWalletSelection();
    const creation = useSafeWalletCreation();

    return {
        selection,
        creation,
    };
};

export const SafeWalletProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { walletAddress, chainId, ethereumProvider, wallet: embeddedWallet } = usePrivyWallet();

    // Get onboarding state to detect when onboarding completes
    const { needsOnboarding: onboardingNeeded } = useOnboarding();

    // Core hooks
    const { safeWallets, isLoading, error, refetch } = useSafeWallets();
    const {
        createSafeWallet,
        signEnableModule,
        submitEnableModule,
        isCreating,
        isSigningEnableModule,
        isExecutingEnableModule,
    } = useCreateSafeWallet();

    // Selection State
    const [selectedSafe, setSelectedSafe] = useState<string | null>(null);
    const [moduleEnabled, refreshModuleStatus, checkingModule] =
        useSafeModuleStatus(selectedSafe || undefined);

    // Creation State
    const [showCreateFlow, setShowCreateFlow] = useState(false);
    const [createStep, setCreateStep] = useState<
        "idle" | "pending" | "success" | "error"
    >("idle");
    const [signStep, setSignStep] = useState<
        "idle" | "pending" | "success" | "error"
    >("idle");
    const [enableStep, setEnableStep] = useState<
        "idle" | "pending" | "success" | "error"
    >("idle");
    const [createError, setCreateError] = useState<string | undefined>(undefined);
    const [signError, setSignError] = useState<string | undefined>(undefined);
    const [enableError, setEnableError] = useState<string | undefined>(undefined);
    const [currentSafeAddress, setCurrentSafeAddress] = useState<string | null>(
        null
    );

    // Clear selection when chain switches
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedSafe(null);
    }, [chainId]);

    // Track previous onboarding state to detect completion
    const prevOnboardingNeededRef = useRef<boolean | undefined>(undefined);

    // Refresh safe wallets after onboarding completes
    useEffect(() => {
        // Detect when onboarding transitions from needed to not needed (completion)
        const wasOnboarding = prevOnboardingNeededRef.current;
        const isOnboarding = onboardingNeeded;

        // If onboarding just completed (was true, now false), refresh safe wallets
        if (wasOnboarding === true && isOnboarding === false) {
            // Wait a bit for blockchain state to propagate, then refetch
            const timer = setTimeout(async () => {
                await refetch();
            }, 2000);

            return () => clearTimeout(timer);
        }

        prevOnboardingNeededRef.current = isOnboarding;
    }, [onboardingNeeded, refetch]);

    // Auto-select first safe wallet if none is selected and wallets are available
    useEffect(() => {
        if (!selectedSafe && safeWallets.length > 0 && !isLoading) {
            const timer = setTimeout(() => {
                setSelectedSafe(safeWallets[0]);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [selectedSafe, safeWallets, isLoading]);

    // Refresh module status after selection
    const selectSafe = useCallback(
        async (safe: string | null) => {
            setSelectedSafe(safe);
            if (safe) {
                setTimeout(async () => {
                    await refreshModuleStatus();
                }, 100);
            }
        },
        [refreshModuleStatus]
    );

    const handleEnableStep = useCallback(
        async (safeAddress: string) => {
            setEnableStep("pending");
            setEnableError(undefined);

            const submitResult = await submitEnableModule();

            if (!submitResult.success) {
                setEnableStep("error");
                setEnableError(submitResult.error || "Failed to submit transaction");
            } else {
                setEnableStep("success");

                // Verify module is actually enabled on-chain
                if (chainId && ethereumProvider) {
                    try {
                        const isEnabled = await verifyModuleEnabled(
                            safeAddress,
                            chainId,
                            ethereumProvider,
                            5,
                            2000
                        );

                        if (!isEnabled) {
                            setEnableError("Module not verified on-chain");
                        }
                    } catch {
                        // Failed to verify module
                    }
                }

                setTimeout(async () => {
                    setSelectedSafe(safeAddress);
                    await refetch();

                    setTimeout(async () => {
                        await refreshModuleStatus();
                    }, 200);

                    setTimeout(() => {
                        setShowCreateFlow(false);
                    }, 500);
                }, 2000);
            }
        },
        [submitEnableModule, refetch, refreshModuleStatus, chainId, ethereumProvider]
    );

    const handleSignStep = useCallback(
        async (safeAddress: string) => {
            setSignStep("pending");
            setSignError(undefined);

            // Ensure we're on the correct chain before signing
            if (!chainId || !embeddedWallet) {
                setSignStep("error");
                setSignError("Wallet not ready");
                return;
            }

            try {
                // No need to switch chain here as user is already on it (manual Safe creation)
                // But we pass chainId explicitly to signEnableModule for safety
                const signResult = await signEnableModule(safeAddress, chainId);

                if (!signResult.success) {
                    setSignStep("error");
                    setSignError(signResult.error || "Failed to sign transaction");
                    setTimeout(async () => {
                        await refetch();
                        setSelectedSafe(safeAddress);
                    }, 3000);
                    return;
                }

                setSignStep("success");
                await handleEnableStep(safeAddress);
            } catch (error) {
                setSignStep("error");
                setSignError(error instanceof Error ? error.message : "Failed to sign");
            }
        },
        [signEnableModule, refetch, handleEnableStep, chainId, embeddedWallet]
    );

    const handleCreateNewSafe = useCallback(async () => {
        if (!walletAddress) return;

        // Defensive guard: prevent creation if user already has a Safe
        if (safeWallets.length > 0) {
            // Attempted to create Safe when user already has one
            setShowCreateFlow(true);
            setCreateStep("error");
            setCreateError("You already have a Safe wallet for this address");
            return;
        }

        setShowCreateFlow(true);
        setCreateStep("pending");
        setSignStep("idle");
        setEnableStep("idle");
        setCreateError(undefined);
        setSignError(undefined);
        setEnableError(undefined);
        setCurrentSafeAddress(null);

        const createResult = await createSafeWallet(walletAddress);

        if (!createResult.success || !createResult.safeAddress) {
            setCreateStep("error");
            setCreateError(createResult.error || "Failed to create Safe wallet");
            return;
        }

        const newSafe = createResult.safeAddress;
        setCurrentSafeAddress(newSafe);
        setCreateStep("success");

        await handleSignStep(newSafe);
    }, [walletAddress, safeWallets, createSafeWallet, handleSignStep]);

    const handleRetryCreate = useCallback(async () => {
        if (!walletAddress) return;
        setCreateStep("pending");
        setCreateError(undefined);

        const createResult = await createSafeWallet(walletAddress);
        if (!createResult.success || !createResult.safeAddress) {
            setCreateStep("error");
            setCreateError(createResult.error || "Failed to create Safe wallet");
            return;
        }

        const newSafe = createResult.safeAddress;
        setCurrentSafeAddress(newSafe);
        setCreateStep("success");

        await handleSignStep(newSafe);
    }, [walletAddress, createSafeWallet, handleSignStep]);

    const handleRetrySign = useCallback(async () => {
        if (!currentSafeAddress) return;
        await handleSignStep(currentSafeAddress);
    }, [currentSafeAddress, handleSignStep]);

    const handleRetryEnable = useCallback(async () => {
        if (!currentSafeAddress) return;
        await handleEnableStep(currentSafeAddress);
    }, [currentSafeAddress, handleEnableStep]);

    const closeCreateFlow = useCallback(() => {
        setShowCreateFlow(false);
        if (selectedSafe) {
            setTimeout(async () => {
                await refreshModuleStatus();
            }, 1000);
        }
    }, [selectedSafe, refreshModuleStatus]);

    const selection = useMemo<SafeWalletSelection>(
        () => ({
            selectedSafe,
            safeWallets,
            isLoading,
            error,
            selectSafe,
            refreshSafeList: refetch,
            moduleEnabled,
            checkingModule,
            refreshModuleStatus,
        }),
        [
            selectedSafe,
            safeWallets,
            isLoading,
            error,
            selectSafe,
            refetch,
            moduleEnabled,
            checkingModule,
            refreshModuleStatus,
        ]
    );

    const creation = useMemo<SafeWalletCreation>(
        () => ({
            showCreateFlow,
            createStep,
            signStep,
            enableStep,
            createError,
            signError,
            enableError,
            currentSafeAddress,
            isCreating,
            isSigningEnableModule,
            isExecutingEnableModule,
            handleCreateNewSafe,
            handleRetryCreate,
            handleRetrySign,
            handleRetryEnable,
            closeCreateFlow,
        }),
        [
            showCreateFlow,
            createStep,
            signStep,
            enableStep,
            createError,
            signError,
            enableError,
            currentSafeAddress,
            isCreating,
            isSigningEnableModule,
            isExecutingEnableModule,
            handleCreateNewSafe,
            handleRetryCreate,
            handleRetrySign,
            handleRetryEnable,
            closeCreateFlow,
        ]
    );

    return (
        <SafeWalletSelectionContext.Provider value={selection}>
            <SafeWalletCreationContext.Provider value={creation}>
                {children}
            </SafeWalletCreationContext.Provider>
        </SafeWalletSelectionContext.Provider>
    );
};
