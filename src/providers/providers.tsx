"use client";

import { useState } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SafeWalletProvider } from "@/context/SafeWalletContext";
import { OnboardingProvider } from "@/onboarding/context/OnboardingContext";
import { ToastProvider } from "@/context/ToastContext";
import { OnboardingWizard } from "@/onboarding/components/OnboardingWizard";
import { LenisProvider } from "./LenisProvider";
import PrivyAuthProvider from "./PrivyProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    // Create QueryClient inside the component to prevent re-initialization
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            })
    );

    return (
        <PrivyAuthProvider>
            <QueryClientProvider client={queryClient}>
                <OnboardingProvider>
                    <SafeWalletProvider>
                        <ToastProvider>
                            <LenisProvider>
                                {children}
                                <OnboardingWizard />
                            </LenisProvider>
                        </ToastProvider>
                    </SafeWalletProvider>
                </OnboardingProvider>
            </QueryClientProvider>
        </PrivyAuthProvider>
    );
}