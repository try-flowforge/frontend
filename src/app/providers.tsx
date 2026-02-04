"use client";

import { useState } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { getSupportedChainsForPrivy, getDefaultChainForPrivy } from "@/web3/chains";
import { SafeWalletProvider } from "@/context/SafeWalletContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { ToastProvider } from "@/context/ToastContext";
import { OnboardingSetupModal } from "@/components/onboard/OnboardingSetupModal";
import { LenisProvider } from "./LenisProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    // Create QueryClient inside the component to prevent re-initialization
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        refetchOnWindowFocus: false,
                        retry: false,
                    },
                },
            })
    );

    // Get Privy App ID from environment variable
    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

    // Get chain configuration from centralized module
    const supportedChains = getSupportedChainsForPrivy();
    const defaultChain = getDefaultChainForPrivy();

    return (
        <ToastProvider>
            <LenisProvider>
                <PrivyProvider
                    appId={privyAppId}
                    config={{
                        loginMethods: ["email"],
                        embeddedWallets: {
                            ethereum: {
                                createOnLogin: "users-without-wallets",
                            },
                        },
                        appearance: {
                            theme: "dark",
                            accentColor: "#FF6500",
                        },
                        defaultChain: defaultChain,
                        supportedChains: supportedChains,
                    }}
                >
                    <QueryClientProvider client={queryClient}>
                        <OnboardingProvider>
                            <SafeWalletProvider>
                                {children}
                                <OnboardingSetupModal />
                            </SafeWalletProvider>
                        </OnboardingProvider>
                    </QueryClientProvider>
                </PrivyProvider>
            </LenisProvider>
        </ToastProvider>
    );
}