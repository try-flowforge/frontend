"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Button } from "@/components/ui/Button";
import { LuCheck, LuLoader } from "react-icons/lu";
import { buildApiUrl } from "@/config/api";

interface SafeTxData {
    to: string;
    value: string;
    data: string;
    operation: number;
}

interface TransactionIntent {
    id: string;
    userId: string;
    agentUserId: string;
    safeAddress: string;
    chainId: number;
    to: string;
    value: string;
    data: string;
    description: string | null;
    safeTxHash: string | null;
    safeTxData: SafeTxData | null;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    txHash: string | null;
    createdAt: string;
}

export function TransactionSigner({ intentId }: { intentId: string }) {
    const { ready, authenticated, login } = usePrivy();
    const { getPrivyAccessToken, ethereumProvider } = usePrivyWallet();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [intent, setIntent] = useState<TransactionIntent | null>(null);
    const [signingStep, setSigningStep] = useState<'idle' | 'signing' | 'completing' | 'done'>('idle');

    const fetchIntent = useCallback(async () => {
        if (!intentId) return;
        try {
            setLoading(true);
            setError(null);

            const token = authenticated ? await getPrivyAccessToken() : null;
            const headers: Record<string, string> = { 'content-type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${buildApiUrl('/intents')}/${intentId}`, { headers });
            let data: any = null;
            try { data = await response.json(); } catch (_) { /* not json */ }

            if (!response.ok) throw new Error(data?.error || "Failed to load transaction details.");
            if (!data?.success) throw new Error(data?.error || "Failed to load transaction details.");

            setIntent(data.data as TransactionIntent);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    }, [intentId, authenticated, getPrivyAccessToken]);

    useEffect(() => { fetchIntent(); }, [fetchIntent]);

    const handleSignTransaction = async () => {
        if (!intent || !authenticated || !ethereumProvider) return;
        if (!intent.safeTxHash) {
            setError("This intent does not have a pre-built transaction hash. Please contact support.");
            return;
        }

        try {
            setSigningStep('signing');
            setError(null);

            // Ensure the user's wallet is on the correct chain
            try {
                await (ethereumProvider as any)?.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${intent.chainId.toString(16)}` }],
                });
            } catch (e) {
                console.warn("Failed to switch chain", e);
            }

            // Sign the pre-built Safe transaction hash — this is all the frontend needs to do
            const provider = new (await import('ethers')).ethers.BrowserProvider(
                ethereumProvider as unknown as any
            );
            const signer = await provider.getSigner();
            const signature = await signer.signMessage(
                (await import('ethers')).ethers.getBytes(intent.safeTxHash)
            );

            setSigningStep('completing');

            // Submit signature to backend — relayer broadcasts the tx
            const token = await getPrivyAccessToken();
            const completeRes = await fetch(`${buildApiUrl('/intents')}/${intent.id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ signature }),
            });

            const completeData = await completeRes.json();
            if (!completeRes.ok || !completeData.success) {
                throw new Error(completeData.error || "Failed to complete transaction on the server.");
            }

            setIntent(prev => prev ? { ...prev, ...completeData.data } : null);
            setSigningStep('done');

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to sign or submit transaction.");
            setSigningStep('idle');
        }
    };

    if (!ready) return (
        <SimpleCard className="p-8 flex justify-center border-white/10">
            <LuLoader className="animate-spin w-6 h-6 text-muted-foreground" />
        </SimpleCard>
    );

    if (loading) return (
        <SimpleCard className="p-6 border-white/10">
            <div className="space-y-4">
                <Typography variant="h4">Loading Transaction</Typography>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <LuLoader className="animate-spin w-4 h-4" />
                    <Typography variant="bodySmall">Retrieving transaction details securely...</Typography>
                </div>
            </div>
        </SimpleCard>
    );

    if (error || !intent) return (
        <SimpleCard className="p-6 border-red-500/20 bg-red-500/5">
            <div className="flex gap-3 text-red-400">
                <div className="space-y-1">
                    <Typography variant="bodySmall" className="font-semibold text-red-300">Error</Typography>
                    <Typography variant="caption">{error || "Transaction intent not found."}</Typography>
                </div>
            </div>
        </SimpleCard>
    );

    if (intent.status === 'COMPLETED') return (
        <SimpleCard className="p-6 border-green-500/20 bg-green-500/5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto text-green-400">
                <LuCheck className="w-6 h-6" />
            </div>
            <div>
                <Typography variant="h4" className="text-green-300">Transaction Complete</Typography>
                <Typography variant="caption" className="text-green-500/80 block mt-1">
                    This transaction has been signed and broadcasted by the relayer.
                </Typography>
                {intent.txHash && (
                    <div className="mt-4 pt-4 border-t border-green-500/20 text-sm break-all">
                        <span className="text-green-500/60 mr-2">Tx Hash:</span>
                        <a href={`https://arbiscan.io/tx/${intent.txHash}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 underline underline-offset-2">
                            {intent.txHash}
                        </a>
                    </div>
                )}
            </div>
            <Button className="w-full mt-4 bg-transparent border border-white/20 text-white hover:bg-white/5" onClick={() => window.close()}>
                Close Window
            </Button>
        </SimpleCard>
    );

    return (
        <SimpleCard className="p-6 space-y-6 border-white/10">
            <div className="space-y-1">
                <Typography variant="h4" className="text-foreground">Approve Transaction</Typography>
                <Typography variant="caption" className="text-muted-foreground block">
                    Your AI agent has prepared the following transaction. Review and sign it with your wallet.
                </Typography>
            </div>

            <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                {intent.description && (
                    <div className="pb-3 border-b border-white/10">
                        <Typography variant="bodySmall" className="text-muted-foreground mb-1">What this does</Typography>
                        <Typography variant="body" className="font-medium">{intent.description}</Typography>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Typography variant="caption" className="text-muted-foreground">Chain</Typography>
                        <Typography variant="bodySmall" className="font-medium block">{intent.chainId}</Typography>
                    </div>
                    <div>
                        <Typography variant="caption" className="text-muted-foreground">Value</Typography>
                        <Typography variant="bodySmall" className="font-medium block">{intent.value === '0' ? 'None (ERC-20 only)' : intent.value}</Typography>
                    </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                    <Typography variant="caption" className="text-muted-foreground">Safe Tx Hash (what you sign)</Typography>
                    <Typography variant="bodySmall" className="font-mono text-xs opacity-70 block mt-1 break-all">
                        {intent.safeTxHash ?? 'Not available'}
                    </Typography>
                </div>
                <div className="pt-2 border-t border-white/10 break-all">
                    <Typography variant="caption" className="text-muted-foreground">Calldata Preview</Typography>
                    <Typography variant="bodySmall" className="font-mono text-xs opacity-70 block mt-1 max-h-16 overflow-y-auto">
                        {intent.data}
                    </Typography>
                </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-sm text-blue-300">
                ℹ️ Gas fees are covered by the FlowForge relayer. You only need to sign — no ETH required.
            </div>

            {!authenticated ? (
                <div className="space-y-3">
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl text-sm">
                        You must be signed in to sign this transaction.
                    </div>
                    <Button onClick={() => login()} className="w-full">Sign In to Continue</Button>
                </div>
            ) : (
                <Button
                    className="w-full font-medium"
                    onClick={handleSignTransaction}
                    disabled={signingStep !== 'idle' || !intent.safeTxHash}
                >
                    {signingStep === 'signing' ? (
                        <><LuLoader className="animate-spin mr-2" /> Waiting for Signature...</>
                    ) : signingStep === 'completing' ? (
                        <><LuLoader className="animate-spin mr-2" /> Sending via Relayer...</>
                    ) : signingStep === 'done' ? (
                        <><LuCheck className="mr-2" /> Done</>
                    ) : (
                        'Sign & Approve Transaction'
                    )}
                </Button>
            )}
        </SimpleCard>
    );
}
