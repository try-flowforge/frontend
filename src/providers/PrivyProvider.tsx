"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { SUPPORTED_VIEM_CHAINS } from "@/web3/config/chain-registry";

export default function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
    // Get Privy App ID from environment variable
    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

    // Get chain configuration from centralized module
    const supportedChains = SUPPORTED_VIEM_CHAINS;
    const defaultChain = supportedChains[0];

    return (
        <PrivyProvider
            appId={privyAppId}
            config={{
                loginMethods: ["email", "wallet"],
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: "off",
                    },
                },
                appearance: {
                    theme: "dark",
                    logo: "/logo.svg",
                    landingHeader: 'Welcome to FlowForge',
                    loginMessage: 'Login to continue',
                    walletList: [
                        "metamask",
                        "wallet_connect_qr",
                        "wallet_connect",
                        "detected_ethereum_wallets",
                    ],
                },
                defaultChain: defaultChain,
                supportedChains: supportedChains,
            }}
        >
            {children}
        </PrivyProvider>
    );
}
