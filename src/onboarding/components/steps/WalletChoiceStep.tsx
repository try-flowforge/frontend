import { useState } from "react";
import { useWallets, useLinkAccount, useCreateWallet } from "@privy-io/react-auth";
import { Button } from "@/components/ui/Button";
import { FaWallet, FaPlus } from "react-icons/fa";
import { useOnboarding } from "@/onboarding/context/OnboardingContext";
import { StepHelpSection } from "../StepHelpSection";

export function WalletChoiceStep() {
    const { wallets = [], ready: walletsReady } = useWallets();
    const { completeStep } = useOnboarding();
    const [connectError, setConnectError] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const { linkWallet } = useLinkAccount({
        onSuccess: () => {
            setConnectError(null);
            completeStep("wallet");
        },
        onError: (error) => setConnectError(typeof error === "string" ? error : String(error)),
    });

    const { createWallet } = useCreateWallet();

    const handleYesConnect = () => {
        setConnectError(null);
        linkWallet();
    };

    const handleNoUseEmbedded = async () => {
        setCreateError(null);
        const hasEmbeddedWallet = wallets.some((w) => w.walletClientType === "privy");

        if (!hasEmbeddedWallet) {
            setIsCreating(true);
            try {
                await createWallet();
                await new Promise((r) => setTimeout(r, 1500));
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                if (!message.toLowerCase().includes("already")) {
                    setCreateError(message);
                    setIsCreating(false);
                    return;
                }
            }
            setIsCreating(false);
        }
        completeStep("wallet");
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <FaWallet className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                    Select your wallet choice
                </h3>
                <p className="text-sm text-muted-foreground max-w-lg">
                    Choose how you want to interact with the platform. You can connect your external wallet or create a new embedded wallet.
                </p>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-4">
                <Button
                    onClick={handleYesConnect}
                    className="w-full gap-3 h-12 text-base"
                    disabled={!walletsReady}
                >
                    <FaWallet className="w-4 h-4" />
                    {walletsReady ? "Connect External Wallet" : "Loading..."}
                </Button>

                {connectError && (
                    <p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">
                        {connectError}
                    </p>
                )}

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-white/20"></div>
                    <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase tracking-wider">Or</span>
                    <div className="flex-grow border-t border-white/20"></div>
                </div>

                <Button
                    onClick={handleNoUseEmbedded}
                    disabled={!walletsReady || isCreating}
                    className="w-full gap-3 h-12 text-base bg-transparent hover:bg-white/5"
                >
                    {isCreating ? (
                        <>Creating Wallet...</>
                    ) : !walletsReady ? (
                        <>Loading...</>
                    ) : (
                        <>
                            <FaPlus className="w-4 h-4" />
                            Create Embedded Wallet
                        </>
                    )}
                </Button>

                {createError && (
                    <p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">
                        {createError}
                    </p>
                )}

                <StepHelpSection
                    items={[
                        { text: "You will need funds and gas fees in your choosen wallet to perform any on-chain action.", type: "warning" },
                        { text: "External wallet gives you full control over your keys and funds." },
                        { text: "The embedded wallet is created and securely managed by Privy." },
                        { text: "For embedded wallets, we use Privy’s infrastructure to enable crypto purchases with supported currency." },
                    ]}
                />
            </div>
        </div>
    );
}
