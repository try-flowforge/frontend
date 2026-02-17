"use client";

import React, { useEffect, useState } from "react";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { useEnsSubdomain } from "@/hooks/useEnsSubdomain";
import { ENS_PARENT_NAME, getConfiguredEnsChains } from "@/config/ens";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatEther, formatUnits } from "viem";

const DURATION_OPTIONS = [
  { label: "1 week", seconds: 7 * 24 * 3600 },
  { label: "4 weeks", seconds: 4 * 7 * 24 * 3600 },
  { label: "1 year", seconds: 52 * 7 * 24 * 3600 },
] as const;

export interface ClaimEnsSubdomainModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ClaimEnsSubdomainModal({
  open,
  onClose,
  onSuccess,
}: ClaimEnsSubdomainModalProps) {
  const { walletAddress, getPrivyAccessToken, wallet } = usePrivyWallet();
  const {
    getPrice,
    registerSubdomain,
    configuredChains,
  } = useEnsSubdomain();

  const [label, setLabel] = useState("");
  const [durationOption, setDurationOption] = useState<(typeof DURATION_OPTIONS)[number]>(DURATION_OPTIONS[0]);
  const [paymentToken, setPaymentToken] = useState<"eth" | "usdc">("eth");
  const [ensChainId, setEnsChainId] = useState<string | number>(getConfiguredEnsChains()[0]?.chainId ?? 1);
  const [priceWei, setPriceWei] = useState<bigint | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const configuredChain = configuredChains.find((c) => c.chainId === ensChainId) ?? configuredChains[0];
  const durationSeconds = durationOption.seconds;

  useEffect(() => {
    if (!open || !label.trim()) {
      setPriceWei(null);
      return;
    }
    let cancelled = false;
    setPriceLoading(true);
    setPriceWei(null);
    getPrice(ensChainId, label.trim().toLowerCase(), durationSeconds, paymentToken)
      .then((p) => {
        if (!cancelled) setPriceWei(p);
      })
      .catch(() => {
        if (!cancelled) setPriceWei(null);
      })
      .finally(() => {
        if (!cancelled) setPriceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, label, durationSeconds, paymentToken, ensChainId, getPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !wallet) {
      setError("Connect your wallet first.");
      return;
    }
    const token = await getPrivyAccessToken();
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    const provider = await wallet.getEthereumProvider();
    if (!provider) {
      setError("Wallet provider not available.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await registerSubdomain({
        identifier: ensChainId,
        label: label.trim().toLowerCase(),
        durationSeconds,
        paymentToken,
        ownerAddress: walletAddress,
        accessToken: token,
        walletProvider: provider,
      });
      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.error ?? "Registration failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const fullName = label.trim() ? `${label.trim().toLowerCase()}.${ENS_PARENT_NAME}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/20 bg-black/95 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Claim ENS subdomain</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="mb-4 text-sm text-white/70">
          Get <strong className="text-white">{ENS_PARENT_NAME}</strong> subdomain and sponsored mainnet gas txs (3 per 0.5 USDC per week).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">Subdomain label</label>
            <div className="flex items-center gap-2 rounded-md border border-white/20 bg-white/5 px-3 py-2">
              <Input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="alice"
                className="border-none bg-transparent text-white placeholder:text-white/40"
                autoComplete="off"
              />
              <span className="shrink-0 text-white/50">.{ENS_PARENT_NAME}</span>
            </div>
            {fullName && (
              <p className="mt-1 text-xs text-white/50">Full name: {fullName}</p>
            )}
          </div>

          {configuredChains.length > 1 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">Network</label>
              <select
                value={ensChainId}
                onChange={(e) => setEnsChainId(Number(e.target.value))}
                className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white"
              >
                {configuredChains.map((c) => (
                  <option key={c.chainId} value={c.chainId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">Duration</label>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.seconds}
                  type="button"
                  onClick={() => setDurationOption(opt)}
                  className={`rounded-md border px-3 py-2 text-sm ${durationOption.seconds === opt.seconds
                    ? "border-primary bg-primary/20 text-white"
                    : "border-white/20 text-white/70 hover:border-white/40"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-white/70">Pay with</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentToken("eth")}
                className={`rounded-md border px-3 py-2 text-sm ${paymentToken === "eth"
                  ? "border-primary bg-primary/20 text-white"
                  : "border-white/20 text-white/70 hover:border-white/40"
                  }`}
              >
                ETH
              </button>
              <button
                type="button"
                onClick={() => setPaymentToken("usdc")}
                className={`rounded-md border px-3 py-2 text-sm ${paymentToken === "usdc"
                  ? "border-primary bg-primary/20 text-white"
                  : "border-white/20 text-white/70 hover:border-white/40"
                  }`}
              >
                USDC
              </button>
            </div>
          </div>

          {priceWei !== null && (
            <div className="rounded-md bg-white/10 px-3 py-2 text-sm text-white/90">
              {paymentToken === "eth"
                ? `Price: ${formatEther(priceWei)} ETH`
                : `Price: ${formatUnits(priceWei, 6)} USDC`}
            </div>
          )}
          {priceLoading && (
            <div className="text-sm text-white/50">Loading price…</div>
          )}

          {error && (
            <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="default" border onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={!label.trim() || priceLoading}
              className="flex-1"
            >
              {submitting ? "Registering…" : "Claim subdomain"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
