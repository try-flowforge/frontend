"use client";

import { useState } from "react";
import { LuX, LuPen, LuCheck, LuLoader } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { buildApiUrl } from "@/config/api";

interface TransactionSigningModalProps {
    isOpen: boolean;
    onClose: () => void;
    executionId: string;
    safeTxHash: string;
    safeTxData: {
        to: string;
        value: string;
        data: string;
        operation: number;
    };
    nodeId: string;
    nodeType: string;
}

type SigningState = "idle" | "signing" | "submitting" | "success" | "error";

export function TransactionSigningModal({
    isOpen,
    onClose,
    executionId,
    safeTxHash,
    safeTxData,
    nodeId,
    nodeType,
}: TransactionSigningModalProps) {
    const { ethereumProvider, getPrivyAccessToken } = usePrivyWallet();
    const [state, setState] = useState<SigningState>("idle");
    const [error, setError] = useState<string | null>(null);

    const handleSign = async () => {
        try {
            if (!ethereumProvider) {
                setError("Wallet not connected. Please connect your wallet.");
                setState("error");
                return;
            }

            setState("signing");
            setError(null);

            // Sign the Safe transaction hash using EIP-712 personal_sign
            // The safeTxHash is the EIP-712 hash that the Safe contract expects
            const accounts = await ethereumProvider.request({
                method: "eth_requestAccounts",
            }) as string[];

            const signerAddress = accounts[0];

            const signature = await ethereumProvider.request({
                method: "personal_sign",
                params: [safeTxHash, signerAddress],
            }) as string;

            // Submit signature to the backend
            setState("submitting");

            const token = await getPrivyAccessToken();
            if (!token) {
                throw new Error("Unable to get access token");
            }

            const res = await fetch(
                `${buildApiUrl("/executions")}/${executionId}/sign`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ signature }),
                }
            );

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to submit signature");
            }
            // Mainnet: backend returned payload for client submission (user pays gas)
            if (data?.data?.submitOnClient && data?.data?.payload && ethereumProvider) {
                const { payload } = data.data;
                try {
                    await ethereumProvider.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: `0x${Number(payload.chainId).toString(16)}` }],
                    });
                } catch (e) {
                    console.warn("Chain switch failed", e);
                }
                const txHash = (await ethereumProvider.request({
                    method: "eth_sendTransaction",
                    params: [{
                        to: payload.to,
                        data: payload.data,
                        value: payload.value || "0x0",
                    }],
                })) as string;
                if (txHash && data.data.executionId) {
                    const token2 = await getPrivyAccessToken();
                    if (token2) {
                        await fetch(`${buildApiUrl("/executions")}/${data.data.executionId}/report-client-tx`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token2}`,
                            },
                            body: JSON.stringify({ txHash }),
                        });
                    }
                }
            }

            setState("success");

            // Auto-close after success
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            setState("error");
        }
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && state !== "signing" && state !== "submitting") {
            onClose();
        }
    };

    // Format value to human-readable ETH
    const formattedValue =
        safeTxData.value && safeTxData.value !== "0"
            ? `${(Number(BigInt(safeTxData.value)) / 1e18).toFixed(6)} ETH`
            : "0 ETH";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-tx-title"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleBackdropClick}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="relative z-50 w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                {state !== "signing" && state !== "submitting" && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 rounded-lg p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
                        aria-label="Close"
                    >
                        <LuX className="h-5 w-5" />
                    </button>
                )}

                {/* Header */}
                <div className="px-6 pt-5 pb-4">
                    <h2
                        id="sign-tx-title"
                        className="text-xl font-semibold text-zinc-100 text-center py-2"
                    >
                        ✍️ Sign Transaction
                    </h2>
                    <p className="text-sm text-zinc-400 text-center">
                        Your workflow requires a signature to proceed
                    </p>
                </div>

                {/* Body */}
                <div className="px-6 pb-5 space-y-4">
                    {/* Node info */}
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">Node Type</span>
                            <span className="text-amber-400 font-medium">{nodeType}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">Node ID</span>
                            <span className="text-zinc-300 font-mono text-xs truncate max-w-[200px]">{nodeId}</span>
                        </div>
                    </div>

                    {/* Transaction details */}
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">To</span>
                            <span className="text-zinc-300 font-mono text-xs truncate max-w-[200px]">
                                {safeTxData.to}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">Value</span>
                            <span className="text-zinc-300">{formattedValue}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">Data</span>
                            <span className="text-zinc-500 font-mono text-xs truncate max-w-[200px]">
                                {safeTxData.data.length > 10
                                    ? `${safeTxData.data.slice(0, 10)}...${safeTxData.data.slice(-8)}`
                                    : safeTxData.data}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">Safe Tx Hash</span>
                            <span className="text-zinc-500 font-mono text-xs truncate max-w-[200px]">
                                {safeTxHash.slice(0, 10)}...{safeTxHash.slice(-8)}
                            </span>
                        </div>
                    </div>

                    {/* Status */}
                    {state === "success" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                            <LuCheck className="w-5 h-5 shrink-0" />
                            <span className="text-sm">Signature submitted! Workflow resuming...</span>
                        </div>
                    )}

                    {state === "error" && error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-900/30 border-t border-zinc-800">
                    {state !== "success" && (
                        <Button
                            onClick={onClose}
                            className="flex-1"
                            disabled={state === "signing" || state === "submitting"}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        onClick={state === "success" ? onClose : handleSign}
                        className="flex-1"
                        disabled={state === "signing" || state === "submitting"}
                    >
                        {state === "signing" && (
                            <>
                                <LuLoader className="h-4 w-4 mr-1.5 inline animate-spin" />
                                Signing...
                            </>
                        )}
                        {state === "submitting" && (
                            <>
                                <LuLoader className="h-4 w-4 mr-1.5 inline animate-spin" />
                                Submitting...
                            </>
                        )}
                        {state === "idle" && (
                            <>
                                <LuPen className="h-4 w-4 mr-1.5 inline" />
                                Sign Transaction
                            </>
                        )}
                        {state === "error" && (
                            <>
                                <LuPen className="h-4 w-4 mr-1.5 inline" />
                                Retry
                            </>
                        )}
                        {state === "success" && (
                            <>
                                <LuCheck className="h-4 w-4 mr-1.5 inline" />
                                Done
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
