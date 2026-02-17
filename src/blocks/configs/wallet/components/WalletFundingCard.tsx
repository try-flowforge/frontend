"use client";

import { useFundWallet } from "@privy-io/react-auth";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { useState, useMemo } from "react";
import { TOKEN_REGISTRY } from "@/web3/config/token-registry";
import { LuCreditCard, LuWallet } from "react-icons/lu";
import { SafeWalletSelection } from "@/context/SafeWalletContext";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { getChain } from "@/web3/config/chain-registry";

interface WalletFundingCardProps {
    selection: SafeWalletSelection;
}

export function WalletFundingCard({ selection }: WalletFundingCardProps) {
    const { fundWallet } = useFundWallet();
    const { chainId } = usePrivyWallet();
    const [amount, setAmount] = useState("10");
    const [isFunding, setIsFunding] = useState(false);

    const safeAddress = selection.selectedSafe;

    const currentViemChain = useMemo(() => {
        if (!chainId) return undefined;
        return getChain(chainId)?.viemChain;
    }, [chainId]);

    const fundableTokens = useMemo(() => {
        // Filter specified tokens "A, B, C" (e.g., USDC, USDT, ARB)
        const symbols = ["USDC", "USDT", "ARB", "WBTC"];
        return TOKEN_REGISTRY.filter(t => symbols.includes(t.symbol));
    }, []);

    const handleFund = async (asset: 'native-currency' | 'USDC' | { erc20: string }) => {
        if (!safeAddress) return;

        setIsFunding(true);
        try {
            await fundWallet({
                address: safeAddress as `0x${string}`,
                options: {
                    amount: amount,
                    asset: typeof asset === 'object' ? { erc20: asset.erc20 as `0x${string}` } : asset,
                    chain: currentViemChain,
                },
            });
        } catch (error) {
            console.error("Funding failed", error);
        } finally {
            setIsFunding(false);
        }
    };

    return (
        <SimpleCard className="p-5">
            <div className="flex items-center space-x-2 mb-4">
                <LuCreditCard className="w-5 h-5 text-primary" />
                <Typography variant="h5" className="font-semibold text-foreground">
                    Fund Safe Wallet
                </Typography>
            </div>

            <Typography variant="bodySmall" className="text-muted-foreground mb-4">
                Buy crypto directly into your Safe. This wallet is used for all automated actions.
            </Typography>

            <div className="space-y-4">
                {!safeAddress ? (
                    <div className="p-3 rounded-lg bg-secondary/20 border border-border text-center">
                        <Typography variant="caption" className="text-muted-foreground">
                            Please select or create a Safe wallet first to enable funding.
                        </Typography>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col space-y-2">
                            <Typography variant="caption" className="text-muted-foreground">
                                Destination Safe
                            </Typography>
                            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 flex items-center">
                                <LuWallet className="w-3.5 h-3.5 mr-2 text-primary" />
                                <Typography variant="caption" className="text-foreground font-mono truncate">
                                    {safeAddress}
                                </Typography>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Typography variant="caption" className="text-muted-foreground">
                                Amount (USD/Units)
                            </Typography>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-secondary/20 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Amount"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                border
                                onClick={() => handleFund('native-currency')}
                                className="h-10 px-4 text-xs"
                                loading={isFunding}
                            >
                                Buy ETH
                            </Button>
                            <Button
                                border
                                onClick={() => handleFund('USDC')}
                                className="h-10 px-4 text-xs"
                                loading={isFunding}
                            >
                                Buy USDC
                            </Button>
                            {fundableTokens.filter(t => t.symbol !== "USDC").slice(0, 2).map(token => (
                                <Button
                                    key={token.symbol}
                                    border
                                    onClick={() => handleFund({ erc20: token.address })}
                                    className="h-10 px-4 text-xs"
                                    loading={isFunding}
                                >
                                    Buy {token.symbol}
                                </Button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </SimpleCard>
    );
}
