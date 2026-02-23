"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { LuCheck, LuLoader } from "react-icons/lu";
import { buildApiUrl } from "@/config/api";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { Button } from "@/components/ui/Button";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";

interface SafeTxData {
  to: string;
  value: string;
  data: string;
  operation: number;
}

interface ExecutionDetails {
  id: string;
  status: string;
  safe_tx_hash?: string | null;
  safe_tx_data?: SafeTxData | null;
  workflow_name?: string;
  error?: { message?: string };
}

type SigningState = "idle" | "signing" | "submitting" | "done";

export function ExecutionTransactionSigner({ executionId }: { executionId: string }) {
  const { ready, authenticated, login } = usePrivy();
  const { getPrivyAccessToken, ethereumProvider } = usePrivyWallet();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [execution, setExecution] = useState<ExecutionDetails | null>(null);
  const [signingState, setSigningState] = useState<SigningState>("idle");

  const fetchExecution = useCallback(async () => {
    if (!executionId) return;
    try {
      setLoading(true);
      setError(null);

      const token = authenticated ? await getPrivyAccessToken() : null;
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${buildApiUrl("/workflows/executions")}/${executionId}`, {
        headers,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message || payload?.error || "Failed to fetch execution details.");
      }

      setExecution(payload.data as ExecutionDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load execution details.");
    } finally {
      setLoading(false);
    }
  }, [executionId, authenticated, getPrivyAccessToken]);

  useEffect(() => {
    void fetchExecution();
  }, [fetchExecution]);

  const handleSign = async () => {
    if (!execution || !execution.safe_tx_hash || !authenticated || !ethereumProvider) return;
    try {
      setSigningState("signing");
      setError(null);

      const provider = new (await import("ethers")).ethers.BrowserProvider(
        ethereumProvider as unknown as import("ethers").Eip1193Provider,
      );
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(
        (await import("ethers")).ethers.getBytes(execution.safe_tx_hash),
      );

      setSigningState("submitting");

      const token = await getPrivyAccessToken();
      if (!token) {
        throw new Error("Unable to get access token");
      }

      const response = await fetch(`${buildApiUrl("/executions")}/${execution.id}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ signature }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Failed to submit signature.");
      }

      // Mainnet: backend returned payload for client submission (user pays gas)
      if (payload?.data?.submitOnClient && payload?.data?.payload && ethereumProvider) {
        const { payload: txPayload } = payload.data;
        try {
          await ethereumProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${Number(txPayload.chainId).toString(16)}` }],
          });
        } catch (e) {
          console.warn("Chain switch failed", e);
        }
        const txHash = (await ethereumProvider.request({
          method: "eth_sendTransaction",
          params: [{
            to: txPayload.to,
            data: txPayload.data,
            value: txPayload.value || "0x0",
          }],
        })) as string;
        if (txHash && payload.data.executionId) {
          const token2 = await getPrivyAccessToken();
          if (token2) {
            await fetch(`${buildApiUrl("/executions")}/${payload.data.executionId}/report-client-tx`, {
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

      setExecution((prev) =>
        prev
          ? {
            ...prev,
            status: payload?.data?.status || "SUCCESS",
          }
          : prev,
      );
      setSigningState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign transaction.");
      setSigningState("idle");
    }
  };

  if (!ready) {
    return (
      <SimpleCard className="p-8 flex justify-center border-white/10">
        <LuLoader className="animate-spin w-6 h-6 text-muted-foreground" />
      </SimpleCard>
    );
  }

  if (loading) {
    return (
      <SimpleCard className="p-6 border-white/10">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LuLoader className="animate-spin w-4 h-4" />
          <Typography variant="bodySmall">Loading execution details...</Typography>
        </div>
      </SimpleCard>
    );
  }

  if (error || !execution) {
    return (
      <SimpleCard className="p-6 border-red-500/20 bg-red-500/5">
        <Typography variant="bodySmall" className="font-semibold text-red-300">
          {error || "Execution details not found."}
        </Typography>
      </SimpleCard>
    );
  }

  if (execution.status === "SUCCESS") {
    return (
      <SimpleCard className="p-6 border-green-500/20 bg-green-500/5 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto text-green-400">
          <LuCheck className="w-6 h-6" />
        </div>
        <div>
          <Typography variant="h4" className="text-green-300">
            Signature Submitted
          </Typography>
          <Typography variant="caption" className="text-green-500/80 block mt-1">
            The execution has been resumed on the backend.
          </Typography>
        </div>
      </SimpleCard>
    );
  }

  const safeTxHash = execution.safe_tx_hash ?? null;

  return (
    <SimpleCard className="p-6 space-y-6 border-white/10">
      <div className="space-y-1">
        <Typography variant="h4" className="text-foreground">
          Approve Transaction
        </Typography>
        <Typography variant="caption" className="text-muted-foreground block">
          Sign this transaction hash to resume your paused workflow execution.
        </Typography>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
        {execution.workflow_name && (
          <div>
            <Typography variant="caption" className="text-muted-foreground">
              Workflow
            </Typography>
            <Typography variant="bodySmall" className="font-medium block">
              {execution.workflow_name}
            </Typography>
          </div>
        )}
        <div className="pt-2 border-t border-white/10">
          <Typography variant="caption" className="text-muted-foreground">
            Safe Tx Hash (what you sign)
          </Typography>
          <Typography variant="bodySmall" className="font-mono text-xs opacity-70 block mt-1 break-all">
            {safeTxHash ?? "Not available"}
          </Typography>
        </div>
      </div>

      {!authenticated ? (
        <div className="space-y-3">
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl text-sm">
            You must be signed in to sign this transaction.
          </div>
          <Button onClick={() => login()} className="w-full">
            Sign In to Continue
          </Button>
        </div>
      ) : (
        <Button className="w-full font-medium" onClick={handleSign} disabled={signingState !== "idle" || !safeTxHash}>
          {signingState === "signing" ? (
            <>
              <LuLoader className="animate-spin mr-2" /> Waiting for Signature...
            </>
          ) : signingState === "submitting" ? (
            <>
              <LuLoader className="animate-spin mr-2" /> Submitting Signature...
            </>
          ) : signingState === "done" ? (
            <>
              <LuCheck className="mr-2" /> Done
            </>
          ) : (
            "Sign and Resume Execution"
          )}
        </Button>
      )}
    </SimpleCard>
  );
}
