import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { useCreateSafeWallet } from "@/web3/hooks/useCreateSafeWallet";
import { API_CONFIG, buildApiUrl } from "@/config/api";
import { ChainInfo, getChain } from "@/web3/config/chain-registry";
import { validateAndGetOnboardingChains } from "../utils/config";
import { ensureChainSelected, waitForChain } from "../utils/chain-switcher";
import { verifyModuleEnabled } from "../utils/safemodule-verifier";

export type OnboardingStepStatus = "idle" | "pending" | "success" | "error";
export type ChainConfig = ChainInfo;
type OnboardingStep = "wallet" | "chain" | "setup" | "complete";
type OverallStatus = "idle" | "in-progress" | "error" | "complete";

// Progress for a single chain
export interface ChainProgress {
    walletCreate: OnboardingStepStatus;
    moduleSign: OnboardingStepStatus;
    moduleEnable: OnboardingStepStatus;
    moduleVerify: OnboardingStepStatus;
    error?: string;
    safeAddress?: string;
}

interface UserData {
    id: string;
    address: string;
    email: string;
    onboarded_at: string;
    safe_wallets?: Record<string, string>;
    selected_chains?: string[];
}

interface OnboardingContextType {
    // State
    needsOnboarding: boolean;
    isOnboarding: boolean;
    isCheckingUser: boolean;
    isModeValid: boolean | null;
    chainsToSetup: ChainConfig[];
    progress: Record<string, ChainProgress>;
    currentSigningChain: string | null;

    // Wizard State
    currentStep: OnboardingStep;
    isMinimized: boolean;
    overallStatus: OverallStatus;
    hasError: boolean;

    walletChoiceCompleted: boolean;
    walletChoiceCompletedByUser: boolean;
    initialCheckDone: boolean;

    isChainSelectionDone: boolean;
    setChainSelectionDone: (value: boolean) => void;
    setSelectedChains: (chains: ChainInfo[]) => void;
    saveUserChains: (chains: string[]) => Promise<void>;

    setWalletChoiceCompleted: (value: boolean) => void;
    startOnboarding: () => Promise<void>;
    retryChain: (identifier: string | number) => Promise<void>;
    dismissOnboarding: () => void;
    toggleMinimize: () => void;
    expandWizard: () => void;

    goToStep: (step: OnboardingStep) => void;
    completeStep: (step: OnboardingStep) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
    undefined
);

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error("useOnboarding must be used within OnboardingProvider");
    }
    return context;
};

// Initialize progress for chains
const initializeProgress = (chains: ChainConfig[]): Record<string, ChainProgress> => {
    const progress: Record<string, ChainProgress> = {};
    for (const chain of chains) {
        progress[chain.id] = {
            walletCreate: "idle",
            moduleSign: "idle",
            moduleEnable: "idle",
            moduleVerify: "idle",
        };
    }
    return progress;
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { authenticated, ready } = usePrivy();
    const { wallets } = useWallets();
    const {
        walletAddress,
        ethereumProvider,
        wallet,
        chainId,
        getPrivyAccessToken
    } = usePrivyWallet();
    const { signEnableModule, submitEnableModule, createSafeWallet } = useCreateSafeWallet();

    // Mode validation state
    const [isModeValid, setIsModeValid] = useState<boolean | null>(null);
    const [chainsToSetup, setChainsToSetup] = useState<ChainConfig[]>([]);

    const [isCheckingUser, setIsCheckingUser] = useState(false);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [isOnboarding, setIsOnboarding] = useState(false);
    const [progress, setProgress] = useState<Record<string, ChainProgress>>({});
    const [currentSigningChain, setCurrentSigningChain] = useState<string | null>(null);

    // Wizard State
    const [currentStep, setCurrentStep] = useState<OnboardingStep>("wallet");
    const [isMinimized, setIsMinimized] = useState(false);

    // Wallet choice: false until the user explicitly acts OR the early check auto-completes it
    const [walletChoiceCompleted, setWalletChoiceCompletedState] = useState(false);
    // Chain selection: false until user selects chains OR early check auto-completes it
    const [isChainSelectionDone, setChainSelectionDone] = useState(false);

    // True once the early "does user exist?" check has finished
    const [initialCheckDone, setInitialCheckDone] = useState(false);

    const prevAuthRef = useRef(false);

    const hasError = useMemo(() => {
        return Object.values(progress).some(
            (p) => p.walletCreate === "error" || p.moduleSign === "error" || p.moduleEnable === "error" || p.moduleVerify === "error"
        );
    }, [progress]);

    const overallStatus: OverallStatus = useMemo(() => {
        if (currentStep === "complete") return "complete";
        if (hasError) return "error";
        if (isOnboarding) return "in-progress";
        return "idle";
    }, [currentStep, hasError, isOnboarding]);

    const checkStepProgression = useCallback(() => {
        if (!initialCheckDone) return;

        // Determine the correct step based on state
        if (!walletChoiceCompleted) {
            setCurrentStep("wallet");
        } else if (!isChainSelectionDone) {
            setCurrentStep("chain");
        } else {
            setCurrentStep("setup");
        }
    }, [initialCheckDone, walletChoiceCompleted, isChainSelectionDone]);

    // Update step when flags change
    useEffect(() => {
        checkStepProgression();
    }, [checkStepProgression]);

    const setWalletChoiceCompleted = useCallback((value: boolean) => {
        setWalletChoiceCompletedState(value);
        if (value) setCurrentStep("chain");
    }, []);

    const completeStep = useCallback((step: OnboardingStep) => {
        switch (step) {
            case "wallet":
                setWalletChoiceCompleted(true);
                break;
            case "chain":
                setChainSelectionDone(true);
                setCurrentStep("setup");
                break;
            case "setup":
                setNeedsOnboarding(false);
                setCurrentStep("complete");
                break;
        }
    }, [setWalletChoiceCompleted]);

    const goToStep = useCallback((step: OnboardingStep) => {
        setCurrentStep(step);
    }, []);

    const setSelectedChains = useCallback((chains: ChainInfo[]) => {
        setChainsToSetup(chains);
        // Re-initialize progress for the new set of chains
        setProgress(initializeProgress(chains));
    }, []);

    // Fetch user data by authenticated user ID
    const fetchUserData = useCallback(async (): Promise<UserData | null> => {
        if (!authenticated) return null;

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return null;

            const response = await fetch(
                `${API_CONFIG.BASE_URL}/users/me`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            return data.success ? data.data : null;
        } catch {
            return null;
        }
    }, [authenticated, getPrivyAccessToken]);

    const saveUserChains = useCallback(async (chains: string[]) => {
        if (!authenticated) return;
        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return;

            await fetch(`${API_CONFIG.BASE_URL}/users/chains`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ chains }),
            });
        } catch (error) {
            console.error("Failed to save user chains", error);
        }
    }, [authenticated, getPrivyAccessToken]);


    // Early user-existence check
    useEffect(() => {
        const justLoggedOut = !authenticated && prevAuthRef.current;
        prevAuthRef.current = authenticated;

        console.log("[OnboardingContext] Auth state change:", { authenticated, ready, justLoggedOut });

        if (justLoggedOut || !authenticated) {
            console.log("[OnboardingContext] Resetting state (logout/not-auth)");
            setWalletChoiceCompletedState(false);
            setChainSelectionDone(false);
            setInitialCheckDone(false);
            setNeedsOnboarding(false);
            setIsOnboarding(false);
            setCurrentStep("wallet");
            return;
        }

        if (!ready) return;

        let cancelled = false;

        (async () => {
            console.log("[OnboardingContext] Starting initial user check...");
            try {
                const user = await fetchUserData();
                if (cancelled) return;

                console.log("[OnboardingContext] Initial check result:", user ? "Found User" : "No User (New)");

                if (user) {
                    // Returning user with a backend record → skip wallet choice
                    setWalletChoiceCompletedState(true);

                    // Restore selected chains if available
                    if (user.selected_chains && user.selected_chains.length > 0) {
                        // selected_chains are string IDs (e.g. "ARBITRUM_SEPOLIA")
                        const allChains = await validateAndGetOnboardingChains().then(res => res.chains).catch(() => []);
                        const restoredChains = allChains.filter(c => user.selected_chains?.includes(c.id));

                        if (restoredChains.length > 0) {
                            setChainsToSetup(restoredChains);
                            setProgress(initializeProgress(restoredChains));
                            setChainSelectionDone(true);
                        } else {
                            // Fallback if mismatch
                            setChainSelectionDone(false);
                        }
                    } else {
                        // New schema user but hasn't selected chains, or old user
                        setChainSelectionDone(false);
                    }
                }
                // null → new user, walletChoiceCompleted stays false
            } catch (err) {
                console.error("[OnboardingContext] Initial check error:", err);
            } finally {
                if (!cancelled) setInitialCheckDone(true);
            }
        })();

        return () => { cancelled = true; };
    }, [ready, authenticated, fetchUserData]);

    // Validate mode on mount
    useEffect(() => {
        const validateMode = async () => {
            try {
                const { chains } = await validateAndGetOnboardingChains();
                setIsModeValid(true);
                setChainsToSetup(chains);
                setProgress(initializeProgress(chains));
            } catch {
                setIsModeValid(false);
                setChainsToSetup([]);
            }
        };

        validateMode();
    }, []);

    // Process a single chain: create wallet + switch chain + sign + enable + verify module
    const processChain = useCallback(
        async (chain: ChainConfig): Promise<boolean> => {
            const chainKey = chain.id;
            const numericChainId = chain.chainId;

            // Utility to get the latest wallet from the wallets array
            // This avoids stale closure issues if the wallet object updates during async steps
            const getLatestWallet = () => {
                const linked = wallets.filter((w) => w.linked || w.walletClientType === "privy");
                return linked.find((w) => w.walletClientType !== "privy") || linked.find((w) => w.walletClientType === "privy") || null;
            };

            // Phase 0: Ensure we have a wallet before starting
            let currentWallet = getLatestWallet();
            if (!currentWallet) {
                // Wait up to 5 seconds for a wallet to appear
                const startTime = Date.now();
                while (!currentWallet && Date.now() - startTime < 5000) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    currentWallet = getLatestWallet();
                }

                if (!currentWallet) {
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: { ...prev[chainKey], error: "Wallet not connected. Please ensure your wallet is ready." },
                    }));
                    return false;
                }
            }

            try {
                // Step 1: Create wallet
                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], walletCreate: "pending", error: undefined },
                }));

                // Use the updated createSafeWallet hook with targetChainId
                const createResult = await createSafeWallet(walletAddress || "", numericChainId);

                if (!createResult.success) {
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: { ...prev[chainKey], walletCreate: "error", error: createResult.error },
                    }));
                    return false;
                }

                const safeAddress = createResult.safeAddress!;
                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], walletCreate: "success", safeAddress },
                }));

                // Step 2: Switch to target chain before signing
                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], moduleSign: "pending" },
                }));
                setCurrentSigningChain(String(chainKey));

                try {
                    // Refresh wallet before switching
                    const walletToUse = getLatestWallet();
                    await ensureChainSelected(walletToUse, numericChainId);
                    // Wait for chain to be active by checking the provider directly
                    await waitForChain(async () => {
                        try {
                            const p = await walletToUse?.getEthereumProvider();
                            if (!p) return null;
                            const hex = await p.request({ method: "eth_chainId" });
                            return parseInt(hex as string, 16);
                        } catch {
                            return null;
                        }
                    }, numericChainId, 15000);
                } catch (switchError) {
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: {
                            ...prev[chainKey],
                            moduleSign: "error",
                            error: `Failed to switch to ${chain.name}: ${switchError instanceof Error ? switchError.message : String(switchError)}`,
                        },
                    }));
                    setCurrentSigningChain(null);
                    return false;
                }

                // Step 3: Sign enable module transaction (now on correct chain)
                const signResult = await signEnableModule(safeAddress, numericChainId);

                if (!signResult.success) {
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: { ...prev[chainKey], moduleSign: "error", error: signResult.error },
                    }));
                    setCurrentSigningChain(null);
                    return false;
                }

                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], moduleSign: "success" },
                }));
                setCurrentSigningChain(null);

                // Check if module was already enabled (signResult.data.safeTxHash will be empty)
                if (signResult.data && !signResult.data.safeTxHash) {
                    // Module already enabled
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: { ...prev[chainKey], moduleEnable: "success", moduleVerify: "success" },
                    }));
                    return true;
                }

                // Step 4: Submit enable module transaction
                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], moduleEnable: "pending" },
                }));

                const submitResult = await submitEnableModule();

                if (!submitResult.success) {
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: { ...prev[chainKey], moduleEnable: "error", error: submitResult.error },
                    }));
                    return false;
                }

                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], moduleEnable: "success" },
                }));

                // Step 5: Verify module is enabled on-chain
                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: { ...prev[chainKey], moduleVerify: "pending" },
                }));

                try {
                    if (!ethereumProvider) {
                        throw new Error("Ethereum provider not available");
                    }

                    const isEnabled = await verifyModuleEnabled(
                        safeAddress,
                        numericChainId,
                        ethereumProvider,
                        10, // maxRetries
                        3000 // delayMs
                    );

                    if (!isEnabled) {
                        setProgress((prev) => ({
                            ...prev,
                            [chainKey]: {
                                ...prev[chainKey],
                                moduleVerify: "error",
                                error: "Module not enabled after transaction",
                            },
                        }));
                        return false;
                    }

                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: { ...prev[chainKey], moduleVerify: "success" },
                    }));

                    return true;
                } catch (verifyError) {
                    setProgress((prev) => ({
                        ...prev,
                        [chainKey]: {
                            ...prev[chainKey],
                            moduleVerify: "error",
                            error: `Verification failed: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`,
                        },
                    }));
                    return false;
                }
            } catch (error) {
                setProgress((prev) => ({
                    ...prev,
                    [chainKey]: {
                        ...prev[chainKey],
                        error: error instanceof Error ? error.message : "Unknown error",
                    },
                }));
                return false;
            }
        },
        [
            createSafeWallet,
            signEnableModule,
            submitEnableModule,
            wallet,
            ethereumProvider,
            walletAddress,
            chainId,
            wallets,
        ]
    );

    // Check if user needs onboarding
    useEffect(() => {
        console.log("[OnboardingContext] checking needsOnboarding dependencies:", {
            ready, authenticated, walletAddress, isModeValid
        });

        if (
            !ready ||
            !authenticated ||
            isModeValid !== true
        ) {

            // Only force reset if logged out
            if (!authenticated) {
                setNeedsOnboarding(false);
            }
            return;
        }

        const checkUser = async () => {
            setIsCheckingUser(true);
            console.log("[OnboardingContext] Checking if onboarding needed...");
            try {
                const user = await fetchUserData();
                console.log("[OnboardingContext] NeedsOnboarding check user result:", user);

                // New user (no backend record yet) → needs onboarding
                if (user === null) {
                    console.log("[OnboardingContext] User is null -> Needs onboarding");
                    setNeedsOnboarding(true);
                    return;
                }

                // Existing user – check which chains still need Safe/module setup
                const chainsNeedingSetup = chainsToSetup.filter((chain) => {
                    const c = getChain(chain.chainId);
                    if (!c) return true;
                    // Check if wallet exists for this chain
                    return !user?.safe_wallets?.[String(c.chainId)];
                });

                console.log("[OnboardingContext] Chains needing setup:", chainsNeedingSetup.length);

                if (chainsNeedingSetup.length > 0) {
                    setNeedsOnboarding(true);
                    // Pre-fill progress for existing wallets
                    setProgress((prev) => {
                        const updated = { ...prev };
                        for (const chain of chainsToSetup) {
                            const c = getChain(chain.chainId);
                            // Check if wallet exists for this chain
                            const hasWallet = user?.safe_wallets?.[String(c?.chainId || chain.chainId)];

                            if (hasWallet) {
                                updated[chain.id] = {
                                    walletCreate: "success",
                                    moduleSign: "success",
                                    moduleEnable: "success",
                                    moduleVerify: "success",
                                };
                            }
                        }
                        return updated;
                    });
                } else {
                    setNeedsOnboarding(false);
                }
            } catch (err) {
                console.error("[OnboardingContext] NeedsOnboarding check error:", err);
                setNeedsOnboarding(true);
            } finally {
                setIsCheckingUser(false);
            }
        };

        checkUser();
    }, [
        ready,
        authenticated,
        fetchUserData,
        chainsToSetup,
        isModeValid,
    ]);

    // Start the onboarding process (one run per click; use Retry on a chain to retry that chain only)
    const startOnboarding = useCallback(async () => {
        if (isOnboarding) return;
        setIsOnboarding(true);

        let allSuccessful = true;

        // Process each chain that needs setup
        for (const chain of chainsToSetup) {
            const chainProgress = progress[chain.id];

            // Skip if already complete (all steps success)
            if (
                chainProgress?.walletCreate === "success" &&
                chainProgress?.moduleSign === "success" &&
                chainProgress?.moduleEnable === "success" &&
                chainProgress?.moduleVerify === "success"
            ) {
                continue;
            }

            const success = await processChain(chain);
            if (!success) {
                allSuccessful = false;
                // Don't break - continue with other chains
            }
        }

        // Refresh user data
        await fetchUserData();

        // Check if all chains are complete
        if (allSuccessful) {
            setNeedsOnboarding(false);
            completeStep("setup");
        }

        setIsOnboarding(false);
    }, [isOnboarding, chainsToSetup, progress, processChain, fetchUserData, completeStep]);

    const retryChain = useCallback(
        async (identifier: string | number) => {
            const chain = chainsToSetup.find((c) => c.id === identifier || c.chainId === identifier);
            if (!chain) return;

            const success = await processChain(chain);

            if (success) {
                // Refresh user data
                await fetchUserData();

                // Check if all chains are now complete
                const allComplete = chainsToSetup.every((c) => {
                    const identifierMatch = c.id === identifier || c.chainId === identifier;
                    if (identifierMatch) return true;
                    // For other chains, check progress by mapping their string ID from the chain object
                    const p = progress[c.id];
                    return p?.moduleVerify === "success";
                });

                if (allComplete) {
                    setNeedsOnboarding(false);
                    setIsOnboarding(false);
                    completeStep("setup");
                }
            }
        },
        [chainsToSetup, processChain, progress, fetchUserData, completeStep]
    );

    // Dismiss onboarding (user can resume later)
    const dismissOnboarding = useCallback(() => {
        setNeedsOnboarding(false);
        setIsOnboarding(false);
        setIsMinimized(false);
    }, []);

    const toggleMinimize = useCallback(() => {
        setIsMinimized((prev) => !prev);
    }, []);

    const expandWizard = useCallback(() => {
        setIsMinimized(false);
    }, []);

    const contextValue = useMemo<OnboardingContextType>(
        () => ({
            needsOnboarding,
            isOnboarding,
            isCheckingUser,
            isModeValid,
            chainsToSetup,
            progress,
            currentSigningChain,
            walletChoiceCompleted,
            walletChoiceCompletedByUser: walletChoiceCompleted,
            initialCheckDone,
            setWalletChoiceCompleted,
            startOnboarding,
            retryChain,
            dismissOnboarding,
            isChainSelectionDone,
            setChainSelectionDone,
            setSelectedChains,
            saveUserChains,
            isMinimized,
            overallStatus,
            hasError,
            toggleMinimize,
            expandWizard,

            // Wizard
            currentStep,
            goToStep,
            completeStep
        }),
        [
            needsOnboarding,
            isOnboarding,
            isCheckingUser,
            isModeValid,
            chainsToSetup,
            progress,
            currentSigningChain,
            walletChoiceCompleted,
            initialCheckDone,
            isChainSelectionDone,
            isMinimized,
            overallStatus,
            hasError,
            setWalletChoiceCompleted,
            startOnboarding,
            retryChain,
            dismissOnboarding,
            toggleMinimize,
            expandWizard,
            setChainSelectionDone,
            setSelectedChains,
            saveUserChains,
            currentStep,
            goToStep,
            completeStep
        ]
    );

    return (
        <OnboardingContext.Provider value={contextValue}>
            {children}
        </OnboardingContext.Provider>
    );
};
