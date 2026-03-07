"use client";

import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { LuCheck, LuLoader } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";
import { API_CONFIG, buildApiUrl } from "@/config/api";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";

interface SpendingPolicyStepProps {
  onCompleted: () => void;
}

interface PreparedSafeTx {
  chainId: number;
  network: "testnet" | "mainnet";
  safeTxHash: string;
  safeTxData: {
    to: string;
    value: string;
    data: string;
    operation: number;
  };
}

type Status = "idle" | "preparing" | "signing" | "executing" | "saving" | "done";

export function SpendingPolicyStep({ onCompleted }: SpendingPolicyStepProps) {
  const { getPrivyAccessToken, ethereumProvider, chainId } = usePrivyWallet();
  const [spendLimitUsd, setSpendLimitUsd] = useState("100");
  const [dailyLimitUsd, setDailyLimitUsd] = useState("500");
  const [deadline, setDeadline] = useState(() => {
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return in30Days.toISOString().slice(0, 10);
  });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [policyTxHash, setPolicyTxHash] = useState<string | null>(null);

  const activeChainId = useMemo(() => {
    if (chainId === 42161 || chainId === 421614) return chainId;
    return 421614;
  }, [chainId]);

  const network: "testnet" | "mainnet" = activeChainId === 42161 ? "mainnet" : "testnet";

  const resolveDeadlineIso = (): string => {
    const parsed = new Date(`${deadline}T23:59:59.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid deadline date");
    }
    return parsed.toISOString();
  };

  const savePolicy = async (txHash?: string) => {
    const token = await getPrivyAccessToken();
    if (!token) throw new Error("Please sign in to save spending policy");

    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SPENDING_POLICY.UPSERT), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        network,
        chainId: activeChainId,
        spendLimitUsd: Number(spendLimitUsd),
        dailyLimitUsd: Number(dailyLimitUsd),
        deadline: resolveDeadlineIso(),
        policyTxHash: txHash,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error?.message || payload?.error || "Failed to save spending policy");
    }
  };

  const approvePolicy = async () => {
    try {
      setError(null);
      setStatus("preparing");

      const token = await getPrivyAccessToken();
      if (!token) throw new Error("Please sign in to configure spending policy");
      if (!ethereumProvider) throw new Error("Wallet provider is not available");

      const prepareResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SPENDING_POLICY.PREPARE), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chainId: activeChainId,
          deadline: resolveDeadlineIso(),
        }),
      });

      const preparePayload = (await prepareResponse.json()) as {
        success?: boolean;
        data?: PreparedSafeTx;
        error?: { message?: string } | string;
      };
      if (!prepareResponse.ok || !preparePayload?.success || !preparePayload.data) {
        throw new Error(
          typeof preparePayload?.error === "string"
            ? preparePayload.error
            : preparePayload?.error?.message || "Failed to prepare spending policy transaction"
        );
      }
      const toAddress = preparePayload.data.safeTxData?.to;
      if (!toAddress || !ethers.isAddress(toAddress)) {
        throw new Error(
          "Spending policy contract not configured for this chain. Set SPENDING_POLICY_ADDRESS_42161 (or SPENDING_POLICY_ADDRESS_421614 for testnet) in the backend .env and restart the backend, then try again."
        );
      }

      setStatus("signing");
      try {
        await ethereumProvider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${preparePayload.data.chainId.toString(16)}` }],
        });
      } catch {
        // Signature request can still proceed if user declined auto-switch.
      }

      const provider = new ethers.BrowserProvider(
        ethereumProvider as unknown as ethers.Eip1193Provider
      );
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(ethers.getBytes(preparePayload.data.safeTxHash));

      setStatus("executing");
      const executeResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SPENDING_POLICY.EXECUTE), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          network,
          chainId: preparePayload.data.chainId,
          signature,
          spendLimitUsd: Number(spendLimitUsd),
          dailyLimitUsd: Number(dailyLimitUsd),
          deadline: resolveDeadlineIso(),
          safeTxHash: preparePayload.data.safeTxHash,
          safeTxData: preparePayload.data.safeTxData,
        }),
      });

      const executePayload = (await executeResponse.json().catch(() => ({}))) as {
        success?: boolean;
        error?: { message?: string; details?: Array<{ message?: string }> };
        data?: {
          txHash?: string;
        };
      };
      if (!executeResponse.ok || !executePayload?.success) {
        const msg =
          executePayload?.error?.details?.[0]?.message ||
          (typeof executePayload?.error === "object" && executePayload?.error?.message) ||
          (typeof executePayload?.error === "string" ? executePayload.error : null) ||
          "Failed to execute spending policy transaction";
        throw new Error(msg);
      }

      const txHash = executePayload?.data?.txHash;

      setStatus("saving");
      await savePolicy(txHash);
      setPolicyTxHash(txHash || null);
      setStatus("done");
      onCompleted();
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Failed to set spending policy");
    }
  };

  const isBusy = status !== "idle" && status !== "done";

  return (
    <SimpleCard className="p-6 rounded-2xl border-white/10 space-y-5">
      <div className="space-y-1">
        <Typography variant="bodySmall" className="font-semibold text-foreground">
          Set Spending Permissions
        </Typography>
        <Typography variant="caption" className="text-muted-foreground block">
          Sign once to allow auto-execution for swaps within your configured limits.
        </Typography>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1">
          <Typography variant="caption" className="text-muted-foreground block">
            Max per transaction (USD)
          </Typography>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            type="number"
            min="0"
            step="0.01"
            value={spendLimitUsd}
            onChange={(e) => setSpendLimitUsd(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <Typography variant="caption" className="text-muted-foreground block">
            Max per 24 hours (USD)
          </Typography>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            type="number"
            min="0"
            step="0.01"
            value={dailyLimitUsd}
            onChange={(e) => setDailyLimitUsd(e.target.value)}
          />
        </label>
      </div>

      <label className="space-y-1 block">
        <Typography variant="caption" className="text-muted-foreground block">
          Deadline
        </Typography>
        <input
          className="w-full max-w-xs rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </label>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <Typography variant="caption" className="text-red-300 block">
            {error}
          </Typography>
        </div>
      )}

      {status === "done" && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3">
          <Typography variant="caption" className="text-green-300 block">
            Spending policy configured successfully.
          </Typography>
          {policyTxHash && (
            <Typography variant="caption" className="text-green-200/90 block break-all mt-1">
              Tx hash: {policyTxHash}
            </Typography>
          )}
        </div>
      )}

      <Button onClick={approvePolicy} disabled={isBusy || !spendLimitUsd || !dailyLimitUsd || !deadline}>
        {isBusy ? <LuLoader className="h-4 w-4 animate-spin" /> : status === "done" ? <LuCheck className="h-4 w-4" /> : null}
        {status === "preparing"
          ? "Preparing transaction..."
          : status === "signing"
            ? "Awaiting signature..."
            : status === "executing"
              ? "Executing policy transaction..."
              : status === "saving"
                ? "Saving policy..."
                : status === "done"
                  ? "Permissions Approved"
                  : "Approve Permissions"}
      </Button>
    </SimpleCard>
  );
}
