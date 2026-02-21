"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Dropdown } from "@/components/ui/Dropdown";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ethers } from "ethers";
import Safe from "@safe-global/protocol-kit";
import {
  LuCircleAlert,
  LuCircleCheck,
  LuLoader,
  LuRefreshCw,
  LuShield,
  LuShieldAlert,
  LuShieldCheck,
} from "react-icons/lu";
import { useWallets } from "@privy-io/react-auth";
import { useSafeWalletContext } from "@/context/SafeWalletContext";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { API_CONFIG, buildApiUrl } from "@/config/api";
import { getChain } from "@/web3/config/chain-registry";
import {
  actionRequiresAllowance,
  actionRequiresDelegation,
  OSTIUM_ACTION_LABELS,
  OSTIUM_ACTIONS,
  OSTIUM_NETWORK_LABELS,
  OstiumAction,
  OstiumNetwork,
  OstiumReadiness,
} from "@/types/ostium";

interface OstiumNodeConfigurationProps {
  nodeData: Record<string, unknown>;
  handleDataChange: (updates: Record<string, unknown>) => void;
  authenticated: boolean;
  login: () => void;
}

interface MarketItem {
  pairId: number;
  symbol: string;
  pair: string;
  status: string;
}

interface DelegationStatus {
  status: "PENDING" | "ACTIVE" | "REVOKED" | "FAILED";
  safeAddress?: string;
  approvalTxHash?: string | null;
  revokeTxHash?: string | null;
  safeTxHash?: string | null;
}

interface SafeTxData {
  to: string;
  value: string;
  data: string;
  operation: number;
}

type ReadinessKey = keyof OstiumReadiness["checks"];

function toTrimmedString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function toNetwork(value: unknown): OstiumNetwork {
  return value === "mainnet" ? "mainnet" : "testnet";
}

function toAction(value: unknown): OstiumAction {
  return OSTIUM_ACTIONS.includes(value as OstiumAction)
    ? (value as OstiumAction)
    : "MARKETS";
}

function getDelegationStatusVisual(status: string | null): {
  label: string;
  className: string;
  icon: React.ReactNode;
} {
  if (status === "ACTIVE") {
    return {
      label: "Active",
      className: "text-green-400 bg-green-500/10 border-green-500/30",
      icon: <LuShieldCheck className="w-4 h-4" />,
    };
  }
  if (status === "PENDING") {
    return {
      label: "Pending",
      className: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      icon: <LuShield className="w-4 h-4" />,
    };
  }
  if (status === "REVOKED") {
    return {
      label: "Revoked",
      className: "text-zinc-300 bg-zinc-500/10 border-zinc-500/30",
      icon: <LuShieldAlert className="w-4 h-4" />,
    };
  }
  if (status === "FAILED") {
    return {
      label: "Failed",
      className: "text-red-400 bg-red-500/10 border-red-500/30",
      icon: <LuShieldAlert className="w-4 h-4" />,
    };
  }
  return {
    label: "Unknown",
    className: "text-zinc-300 bg-white/5 border-white/10",
    icon: <LuShield className="w-4 h-4" />,
  };
}

function getReadinessCheckVisual(ok: boolean): {
  className: string;
  label: string;
  icon: React.ReactNode;
} {
  if (ok) {
    return {
      className: "text-green-300 bg-green-500/10 border-green-500/20",
      label: "Ready",
      icon: <LuCircleCheck className="w-4 h-4" />,
    };
  }
  return {
    className: "text-amber-200 bg-amber-500/10 border-amber-500/20",
    label: "Action Required",
    icon: <LuCircleAlert className="w-4 h-4" />,
  };
}

function OstiumNodeConfigurationInner({
  nodeData,
  handleDataChange,
  authenticated,
  login,
}: OstiumNodeConfigurationProps) {
  const { wallets } = useWallets();
  const { selection } = useSafeWalletContext();
  const { getPrivyAccessToken, ethereumProvider } = usePrivyWallet();

  const selectedSafe = selection.selectedSafe;
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const walletAddress = embeddedWallet?.address || "";
  const walletChainId = embeddedWallet?.chainId || null;
  const currentChain = getChain(walletChainId);
  const derivedNetwork: OstiumNetwork =
    currentChain?.id === "ARBITRUM" ? "mainnet" : "testnet";
  const effectiveAddress = selectedSafe || walletAddress;

  const network = toNetwork(nodeData.network);
  const action = toAction(nodeData.action);
  const market = toTrimmedString(nodeData.market);
  const base = toTrimmedString(nodeData.base);
  const quote = toTrimmedString(nodeData.quote) || "USD";
  const side = (toTrimmedString(nodeData.side) || "long") as "long" | "short";
  const collateral = toTrimmedString(nodeData.collateral);
  const leverage = toTrimmedString(nodeData.leverage);
  const pairId = toTrimmedString(nodeData.pairId);
  const tradeIndex = toTrimmedString(nodeData.tradeIndex);
  const slPrice = toTrimmedString(nodeData.slPrice);
  const tpPrice = toTrimmedString(nodeData.tpPrice);
  const address = toTrimmedString(nodeData.address);
  const traderAddress = toTrimmedString(nodeData.traderAddress);
  const delegationStatusFromNode = toTrimmedString(nodeData.delegationStatus);

  const [marketsState, setMarketsState] = useState<{
    loading: boolean;
    error: string | null;
    markets: MarketItem[];
  }>({
    loading: false,
    error: null,
    markets: [],
  });

  const [delegationState, setDelegationState] = useState<{
    loading: boolean;
    error: string | null;
    status: DelegationStatus | null;
    successMessage: string | null;
  }>({
    loading: false,
    error: null,
    status: null,
    successMessage: null,
  });

  const [delegationActionLoading, setDelegationActionLoading] = useState<
    "approve" | "revoke" | null
  >(null);

  const [readinessState, setReadinessState] = useState<{
    loading: boolean;
    error: string | null;
    data: OstiumReadiness | null;
  }>({
    loading: false,
    error: null,
    data: null,
  });

  const [allowanceActionLoading, setAllowanceActionLoading] = useState<boolean>(false);
  const [allowanceActionMessage, setAllowanceActionMessage] = useState<string | null>(null);
  const readinessInFlightRef = useRef(false);
  const handleDataChangeRef = useRef(handleDataChange);

  useEffect(() => {
    handleDataChangeRef.current = handleDataChange;
  }, [handleDataChange]);

  const callAuthedPost = useCallback(
    async <T,>(endpoint: string, payload: Record<string, unknown>): Promise<T> => {
      const accessToken = await getPrivyAccessToken();
      if (!accessToken) {
        throw new Error("Please sign in to call Ostium APIs.");
      }

      const response = await fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success) {
        throw new Error(
          body?.error?.message || `Ostium request failed with status ${response.status}`,
        );
      }

      return body.data as T;
    },
    [getPrivyAccessToken],
  );

  const marketOptions = useMemo(
    () =>
      marketsState.markets.map((entry) => ({
        value: String(entry.symbol || entry.pairId),
        label: `${entry.pair} (#${entry.pairId})`,
      })),
    [marketsState.markets],
  );

  const actionRequiresPositionManagement = useMemo(
    () => actionRequiresDelegation(action),
    [action],
  );

  const readinessData = readinessState.data;
  const readinessRows: Array<{ key: ReadinessKey; label: string; message: string }> = useMemo(() => {
    if (!readinessData) return [];
    return [
      {
        key: "safeWallet",
        label: "Safe Wallet",
        message: readinessData.checks.safeWallet.message,
      },
      {
        key: "delegation",
        label: "Delegation",
        message: readinessData.checks.delegation.message,
      },
      {
        key: "usdcBalance",
        label: "Safe USDC Balance",
        message: readinessData.checks.usdcBalance.message,
      },
      {
        key: "allowance",
        label: "USDC Allowance",
        message: readinessData.checks.allowance.message,
      },
      {
        key: "delegateGas",
        label: "Delegate Gas",
        message: readinessData.checks.delegateGas.message,
      },
    ];
  }, [readinessData]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (action === "PRICE" && !base && !market) {
      errors.push("Price action requires either Base or Market.");
    }

    if (action === "BALANCE" && !address && !effectiveAddress) {
      errors.push("Balance action requires an address or a selected Safe wallet.");
    }

    if (action === "LIST_POSITIONS" && !traderAddress && !effectiveAddress) {
      errors.push("List positions requires trader address or selected Safe wallet.");
    }

    if (action === "OPEN_POSITION") {
      if (!market) errors.push("Open position requires Market.");
      if (!collateral || Number(collateral) <= 0) errors.push("Open position requires positive Collateral.");
      if (!leverage || Number(leverage) <= 0) errors.push("Open position requires positive Leverage.");
    }

    if (action === "CLOSE_POSITION" || action === "UPDATE_SL" || action === "UPDATE_TP") {
      if (!pairId) errors.push(`${OSTIUM_ACTION_LABELS[action]} requires Pair ID.`);
      if (!tradeIndex) errors.push(`${OSTIUM_ACTION_LABELS[action]} requires Trade Index.`);
    }

    if (action === "UPDATE_SL" && (!slPrice || Number(slPrice) <= 0)) {
      errors.push("Update SL requires positive Stop-Loss price.");
    }

    if (action === "UPDATE_TP" && (!tpPrice || Number(tpPrice) <= 0)) {
      errors.push("Update TP requires positive Take-Profit price.");
    }

    if (actionRequiresPositionManagement) {
      if (!readinessData) {
        errors.push("Run Ostium readiness check before write actions.");
      } else {
        if (!readinessData.checks.safeWallet.ok) {
          errors.push(readinessData.checks.safeWallet.message);
        }
        if (!readinessData.checks.delegation.ok) {
          errors.push(readinessData.checks.delegation.message);
        }
        if (!readinessData.checks.delegateGas.ok) {
          errors.push(readinessData.checks.delegateGas.message);
        }
      }
    }

    if (actionRequiresAllowance(action)) {
      if (!readinessData) {
        errors.push("Run Ostium readiness check before opening position.");
      } else {
        if (!readinessData.checks.usdcBalance.ok) {
          errors.push(readinessData.checks.usdcBalance.message);
        }
        if (!readinessData.checks.allowance.ok) {
          errors.push(readinessData.checks.allowance.message);
        }
      }
    }

    return errors;
  }, [
    action,
    actionRequiresPositionManagement,
    address,
    base,
    collateral,
    effectiveAddress,
    leverage,
    market,
    pairId,
    readinessData,
    slPrice,
    tpPrice,
    tradeIndex,
    traderAddress,
  ]);

  const refreshMarkets = useCallback(async () => {
    if (!authenticated) {
      return;
    }

    setMarketsState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await callAuthedPost<{ markets: MarketItem[] }>(
        API_CONFIG.ENDPOINTS.OSTIUM.MARKETS,
        { network },
      );
      setMarketsState({
        loading: false,
        error: null,
        markets: Array.isArray(data.markets) ? data.markets : [],
      });
    } catch (error) {
      setMarketsState({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load Ostium markets",
        markets: [],
      });
    }
  }, [authenticated, callAuthedPost, network]);

  const refreshDelegationStatus = useCallback(async () => {
    if (!authenticated) {
      return;
    }

    setDelegationState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      successMessage: null,
    }));

    try {
      const data = await callAuthedPost<{ delegation: DelegationStatus | null }>(
        API_CONFIG.ENDPOINTS.OSTIUM.DELEGATION_STATUS,
        { network },
      );
      const delegation = data.delegation || null;
      setDelegationState({
        loading: false,
        error: null,
        status: delegation,
        successMessage: null,
      });

      handleDataChangeRef.current({
        delegationStatus: delegation?.status || "UNKNOWN",
        delegationCheckedAt: new Date().toISOString(),
      });
    } catch (error) {
      setDelegationState({
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch delegation status",
        status: null,
        successMessage: null,
      });
      handleDataChangeRef.current({
        delegationStatus: "UNKNOWN",
        delegationCheckedAt: new Date().toISOString(),
      });
    }
  }, [authenticated, callAuthedPost, network]);

  const refreshReadiness = useCallback(async () => {
    if (!authenticated) {
      return;
    }
    if (readinessInFlightRef.current) {
      return;
    }
    readinessInFlightRef.current = true;

    setReadinessState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const data = await callAuthedPost<OstiumReadiness>(
        API_CONFIG.ENDPOINTS.OSTIUM.READINESS,
        { network },
      );
      setReadinessState({
        loading: false,
        error: null,
        data,
      });

      handleDataChangeRef.current({
        delegationStatus: data.checks.delegation.status || "UNKNOWN",
        delegationCheckedAt: new Date().toISOString(),
      });
    } catch (error) {
      setReadinessState({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch readiness status",
        data: null,
      });
      handleDataChangeRef.current({
        delegationStatus: "UNKNOWN",
        delegationCheckedAt: new Date().toISOString(),
      });
    } finally {
      readinessInFlightRef.current = false;
    }
  }, [authenticated, callAuthedPost, network]);

  const signAndExecuteSafeFlow = useCallback(
    async (
      prepared: { safeAddress: string; safeTxHash: string; safeTxData: SafeTxData },
      executeEndpoint: string,
      extraPayload: Record<string, unknown> = {},
    ) => {
      if (!ethereumProvider) {
        throw new Error("Ethereum provider unavailable. Reconnect wallet and try again.");
      }

      const safeSdk = await Safe.init({
        provider: ethereumProvider as unknown as ethers.Eip1193Provider,
        safeAddress: prepared.safeAddress,
      });

      const safeTransaction = await safeSdk.createTransaction({
        transactions: [
          {
            to: prepared.safeTxData.to,
            value: prepared.safeTxData.value,
            data: prepared.safeTxData.data,
            operation: prepared.safeTxData.operation,
          },
        ],
      });

      const signedSafeTx = await safeSdk.signTransaction(safeTransaction);
      const signedTxHash = await safeSdk.getTransactionHash(signedSafeTx);

      if (signedTxHash.toLowerCase() !== prepared.safeTxHash.toLowerCase()) {
        throw new Error(
          `Safe tx hash mismatch. Backend=${prepared.safeTxHash} Frontend=${signedTxHash}`,
        );
      }

      const signature = signedSafeTx.encodedSignatures();
      if (!signature || signature === "0x") {
        throw new Error("Failed to produce Safe signature.");
      }

      await callAuthedPost(executeEndpoint, {
        network,
        signature,
        ...extraPayload,
      });
    },
    [callAuthedPost, ethereumProvider, network],
  );

  const executeDelegationFlow = useCallback(
    async (mode: "approve" | "revoke") => {
      if (!selectedSafe) {
        setDelegationState((prev) => ({
          ...prev,
          error: "Select a Safe wallet before delegation setup.",
          successMessage: null,
        }));
        return;
      }

      if (!ethereumProvider) {
        setDelegationState((prev) => ({
          ...prev,
          error: "Ethereum provider unavailable. Reconnect wallet and try again.",
          successMessage: null,
        }));
        return;
      }

      const prepareEndpoint =
        mode === "approve"
          ? API_CONFIG.ENDPOINTS.OSTIUM.DELEGATION_PREPARE
          : API_CONFIG.ENDPOINTS.OSTIUM.DELEGATION_REVOKE_PREPARE;
      const executeEndpoint =
        mode === "approve"
          ? API_CONFIG.ENDPOINTS.OSTIUM.DELEGATION_EXECUTE
          : API_CONFIG.ENDPOINTS.OSTIUM.DELEGATION_REVOKE_EXECUTE;

      setDelegationActionLoading(mode);
      setDelegationState((prev) => ({
        ...prev,
        error: null,
        successMessage: null,
      }));

      try {
        const prepared = await callAuthedPost<{
          safeAddress: string;
          safeTxHash: string;
          safeTxData: SafeTxData;
        }>(prepareEndpoint, { network });
        await signAndExecuteSafeFlow(prepared, executeEndpoint);
        await refreshDelegationStatus();
        await refreshReadiness();

        setDelegationState((prev) => ({
          ...prev,
          successMessage:
            mode === "approve"
              ? "Delegation approved successfully."
              : "Delegation revoked successfully.",
        }));
      } catch (error) {
        setDelegationState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Delegation flow failed",
        }));
      } finally {
        setDelegationActionLoading(null);
      }
    },
    [
      callAuthedPost,
      ethereumProvider,
      network,
      refreshDelegationStatus,
      refreshReadiness,
      selectedSafe,
      signAndExecuteSafeFlow,
    ],
  );

  const executeAllowanceFlow = useCallback(async () => {
    if (!selectedSafe) {
      setAllowanceActionMessage("Select a Safe wallet before setting allowance.");
      return;
    }

    if (!ethereumProvider) {
      setAllowanceActionMessage("Ethereum provider unavailable. Reconnect wallet and try again.");
      return;
    }

    setAllowanceActionLoading(true);
    setAllowanceActionMessage(null);

    try {
      const prepared = await callAuthedPost<{
        safeAddress: string;
        safeTxHash: string;
        safeTxData: SafeTxData;
      }>(API_CONFIG.ENDPOINTS.OSTIUM.ALLOWANCE_PREPARE, { network });

      await signAndExecuteSafeFlow(prepared, API_CONFIG.ENDPOINTS.OSTIUM.ALLOWANCE_EXECUTE, {
        safeTxHash: prepared.safeTxHash,
        safeTxData: prepared.safeTxData,
      });
      await refreshReadiness();
      setAllowanceActionMessage("USDC allowance approved successfully.");
    } catch (error) {
      setAllowanceActionMessage(
        error instanceof Error ? error.message : "USDC allowance approval failed",
      );
    } finally {
      setAllowanceActionLoading(false);
    }
  }, [
    callAuthedPost,
    ethereumProvider,
    network,
    refreshReadiness,
    selectedSafe,
    signAndExecuteSafeFlow,
  ]);

  useEffect(() => {
    const updates: Record<string, unknown> = {};

    if (!nodeData.network) {
      updates.network = derivedNetwork;
    }
    if (!nodeData.provider) {
      updates.provider = "OSTIUM";
    }
    if (!nodeData.action) {
      updates.action = "MARKETS";
    }
    if (!nodeData.quote) {
      updates.quote = "USD";
    }
    if (effectiveAddress) {
      if (!nodeData.address) {
        updates.address = effectiveAddress;
      }
      if (!nodeData.traderAddress) {
        updates.traderAddress = effectiveAddress;
      }
    }

    if (Object.keys(updates).length > 0) {
      handleDataChange(updates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedNetwork, effectiveAddress]);

  useEffect(() => {
    if (!authenticated) return;
    refreshMarkets();
  }, [authenticated, network, refreshMarkets]);

  useEffect(() => {
    if (!authenticated) return;
    refreshReadiness();
    // avoid callback identity churn causing request loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, network, selectedSafe]);

  const delegationVisual = getDelegationStatusVisual(
    delegationState.status?.status || delegationStatusFromNode || null,
  );

  return (
    <div className="space-y-4">
      {!authenticated && (
        <SimpleCard className="p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex gap-3">
            <LuCircleAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-3 flex-1">
              <div className="space-y-0.5">
                <Typography variant="bodySmall" className="font-bold text-foreground">
                  Action Required
                </Typography>
                <Typography variant="caption" className="text-muted-foreground block leading-relaxed">
                  Sign in to configure Ostium and manage delegation.
                </Typography>
              </div>
              <Button onClick={login} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-10">
                Connect Wallet
              </Button>
            </div>
          </div>
        </SimpleCard>
      )}

      <SimpleCard className="p-4 space-y-3">
        <Typography variant="bodySmall" className="font-semibold text-foreground">
          Wallet Context
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          Safe:{" "}
          <span className="text-foreground font-mono">
            {selectedSafe || "No Safe selected"}
          </span>
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          Wallet:{" "}
          <span className="text-foreground font-mono">
            {walletAddress || "No wallet"}
          </span>
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          Chain: <span className="text-foreground">{currentChain?.name || "Unknown"}</span>
        </Typography>
      </SimpleCard>

      <SimpleCard className="p-4 space-y-4">
        <Typography variant="bodySmall" className="font-semibold text-foreground">
          Perps Configuration
        </Typography>

        <Dropdown
          value={network}
          onChange={(e) => handleDataChange({ network: e.target.value as OstiumNetwork })}
          options={[
            { value: "testnet", label: OSTIUM_NETWORK_LABELS.testnet },
            { value: "mainnet", label: OSTIUM_NETWORK_LABELS.mainnet },
          ]}
          placeholder="Select network"
        />

        <Dropdown
          value={action}
          onChange={(e) => handleDataChange({ action: e.target.value as OstiumAction })}
          options={OSTIUM_ACTIONS.map((entry) => ({
            value: entry,
            label: OSTIUM_ACTION_LABELS[entry],
          }))}
          placeholder="Select action"
        />

        {(action === "OPEN_POSITION" || action === "PRICE") && (
          <>
            <div className="flex items-center justify-between">
              <Typography variant="caption" className="text-muted-foreground">
                Market
              </Typography>
              <button
                type="button"
                className="text-xs text-blue-300 hover:text-blue-200 inline-flex items-center gap-1"
                onClick={refreshMarkets}
                disabled={marketsState.loading || !authenticated}
              >
                {marketsState.loading ? (
                  <LuLoader className="w-3 h-3 animate-spin" />
                ) : (
                  <LuRefreshCw className="w-3 h-3" />
                )}
                Refresh
              </button>
            </div>
            {marketOptions.length > 0 ? (
              <Dropdown
                value={market}
                onChange={(e) => handleDataChange({ market: e.target.value })}
                options={marketOptions}
                placeholder="Select market"
              />
            ) : (
              <Input
                value={market}
                onChange={(e) => handleDataChange({ market: e.target.value })}
                placeholder="e.g. BTC, ETH, XAU"
                className="bg-white/5 border-white/15"
              />
            )}
          </>
        )}

        {action === "PRICE" && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={base}
              onChange={(e) => handleDataChange({ base: e.target.value.toUpperCase() })}
              placeholder="Base (e.g. BTC)"
              className="bg-white/5 border-white/15"
            />
            <Input
              value={quote}
              onChange={(e) => handleDataChange({ quote: e.target.value.toUpperCase() })}
              placeholder="Quote (USD)"
              className="bg-white/5 border-white/15"
            />
          </div>
        )}

        {action === "BALANCE" && (
          <Input
            value={address || effectiveAddress}
            onChange={(e) => handleDataChange({ address: e.target.value })}
            placeholder="Wallet address"
            className="bg-white/5 border-white/15 font-mono"
          />
        )}

        {(action === "LIST_POSITIONS" ||
          action === "OPEN_POSITION" ||
          action === "CLOSE_POSITION" ||
          action === "UPDATE_SL" ||
          action === "UPDATE_TP") && (
            <Input
              value={traderAddress || effectiveAddress}
              onChange={(e) => handleDataChange({ traderAddress: e.target.value })}
              placeholder="Trader address"
              className="bg-white/5 border-white/15 font-mono"
            />
          )}

        {action === "OPEN_POSITION" && (
          <>
            <Dropdown
              value={side}
              onChange={(e) => handleDataChange({ side: e.target.value })}
              options={[
                { value: "long", label: "Long" },
                { value: "short", label: "Short" },
              ]}
              placeholder="Select side"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={collateral}
                onChange={(e) => handleDataChange({ collateral: e.target.value })}
                placeholder="Collateral (USDC)"
                className="bg-white/5 border-white/15"
              />
              <Input
                value={leverage}
                onChange={(e) => handleDataChange({ leverage: e.target.value })}
                placeholder="Leverage"
                className="bg-white/5 border-white/15"
              />
            </div>
          </>
        )}

        {(action === "CLOSE_POSITION" || action === "UPDATE_SL" || action === "UPDATE_TP") && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={pairId}
              onChange={(e) => handleDataChange({ pairId: e.target.value })}
              placeholder="Pair ID"
              className="bg-white/5 border-white/15"
            />
            <Input
              value={tradeIndex}
              onChange={(e) => handleDataChange({ tradeIndex: e.target.value })}
              placeholder="Trade Index"
              className="bg-white/5 border-white/15"
            />
          </div>
        )}

        {action === "UPDATE_SL" && (
          <Input
            value={slPrice}
            onChange={(e) => handleDataChange({ slPrice: e.target.value })}
            placeholder="Stop-loss price"
            className="bg-white/5 border-white/15"
          />
        )}

        {action === "UPDATE_TP" && (
          <Input
            value={tpPrice}
            onChange={(e) => handleDataChange({ tpPrice: e.target.value })}
            placeholder="Take-profit price"
            className="bg-white/5 border-white/15"
          />
        )}

        {(action === "OPEN_POSITION" || action === "CLOSE_POSITION") && (
          <Input
            value={toTrimmedString(nodeData.idempotencyKey)}
            onChange={(e) => handleDataChange({ idempotencyKey: e.target.value })}
            placeholder="Idempotency key (optional)"
            className="bg-white/5 border-white/15"
          />
        )}

        {marketsState.error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <LuCircleAlert className="w-4 h-4 text-red-400 mt-0.5" />
            <Typography variant="caption" className="text-red-300">
              {marketsState.error}
            </Typography>
          </div>
        )}
      </SimpleCard>

      <SimpleCard className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Typography variant="bodySmall" className="font-semibold text-foreground">
            Delegation Status
          </Typography>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${delegationVisual.className}`}
          >
            {delegationVisual.icon}
            {delegationVisual.label}
          </div>
        </div>

        <Typography variant="caption" className="text-muted-foreground">
          Write actions require active delegation from your Safe wallet to the backend delegate.
        </Typography>

        <div className="flex gap-2">
          <Button
            type="button"
            className="h-10 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white"
            onClick={refreshDelegationStatus}
            disabled={delegationState.loading || !authenticated}
          >
            {delegationState.loading ? (
              <LuLoader className="w-4 h-4 animate-spin" />
            ) : (
              <LuRefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>

          {delegationVisual.label !== "Active" ? (
            <Button
              type="button"
              className="h-10 px-4 rounded-lg bg-green-600 hover:bg-green-500 text-white"
              onClick={() => executeDelegationFlow("approve")}
              disabled={
                !authenticated ||
                delegationActionLoading !== null ||
                !selectedSafe ||
                !ethereumProvider
              }
            >
              {delegationActionLoading === "approve" ? (
                <LuLoader className="w-4 h-4 animate-spin" />
              ) : (
                <LuShieldCheck className="w-4 h-4" />
              )}
              Approve
            </Button>
          ) : (
            <Button
              type="button"
              className="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white"
              onClick={() => executeDelegationFlow("revoke")}
              disabled={!authenticated || delegationActionLoading !== null || !selectedSafe || !ethereumProvider}
            >
              {delegationActionLoading === "revoke" ? (
                <LuLoader className="w-4 h-4 animate-spin" />
              ) : (
                <LuShieldAlert className="w-4 h-4" />
              )}
              Revoke
            </Button>
          )}
        </div>

        {delegationState.error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <LuCircleAlert className="w-4 h-4 text-red-400 mt-0.5" />
            <Typography variant="caption" className="text-red-300">
              {delegationState.error}
            </Typography>
          </div>
        )}

        {delegationState.successMessage && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <LuCircleCheck className="w-4 h-4 text-green-400 mt-0.5" />
            <Typography variant="caption" className="text-green-300">
              {delegationState.successMessage}
            </Typography>
          </div>
        )}

        {!selectedSafe && (
          <Typography variant="caption" className="text-amber-300">
            Select a Safe wallet to approve/revoke delegation.
          </Typography>
        )}
      </SimpleCard>

      <SimpleCard className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Typography variant="bodySmall" className="font-semibold text-foreground">
            Ostium Readiness
          </Typography>
          <Button
            type="button"
            className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white"
            onClick={refreshReadiness}
            disabled={readinessState.loading || !authenticated}
          >
            {readinessState.loading ? (
              <LuLoader className="w-4 h-4 animate-spin" />
            ) : (
              <LuRefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>

        {readinessData ? (
          <div className="space-y-2">
            {readinessRows.map((entry) => {
              const check = readinessData.checks[entry.key];
              const visual = getReadinessCheckVisual(check.ok);
              return (
                <div
                  key={entry.key}
                  className={`rounded-lg border p-2 ${visual.className}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5">
                      {visual.icon}
                      <Typography variant="caption" className="font-semibold">
                        {entry.label}
                      </Typography>
                    </div>
                    <Typography variant="caption" className="opacity-90">
                      {visual.label}
                    </Typography>
                  </div>
                  <Typography variant="caption" className="block mt-1 opacity-90">
                    {entry.message}
                  </Typography>
                </div>
              );
            })}
          </div>
        ) : (
          <Typography variant="caption" className="text-muted-foreground">
            Run readiness check to see Safe, delegation, allowance, and funding status.
          </Typography>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
            onClick={executeAllowanceFlow}
            disabled={
              !authenticated ||
              !selectedSafe ||
              !ethereumProvider ||
              allowanceActionLoading ||
              (readinessData?.checks.allowance.ok ?? false)
            }
          >
            {allowanceActionLoading ? (
              <LuLoader className="w-4 h-4 animate-spin" />
            ) : (
              <LuShieldCheck className="w-4 h-4" />
            )}
            {readinessData?.checks.allowance.ok ? "Allowance Ready" : "Approve USDC Allowance"}
          </Button>
        </div>

        {readinessState.error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <LuCircleAlert className="w-4 h-4 text-red-400 mt-0.5" />
            <Typography variant="caption" className="text-red-300">
              {readinessState.error}
            </Typography>
          </div>
        )}

        {allowanceActionMessage && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg border ${
              allowanceActionMessage.toLowerCase().includes("success")
                ? "bg-green-500/10 border-green-500/20"
                : "bg-amber-500/10 border-amber-500/20"
            }`}
          >
            {allowanceActionMessage.toLowerCase().includes("success") ? (
              <LuCircleCheck className="w-4 h-4 text-green-400 mt-0.5" />
            ) : (
              <LuCircleAlert className="w-4 h-4 text-amber-300 mt-0.5" />
            )}
            <Typography
              variant="caption"
              className={
                allowanceActionMessage.toLowerCase().includes("success")
                  ? "text-green-300"
                  : "text-amber-200"
              }
            >
              {allowanceActionMessage}
            </Typography>
          </div>
        )}
      </SimpleCard>

      <SimpleCard className="p-4 space-y-2">
        <Typography variant="bodySmall" className="font-semibold text-foreground">
          Preflight Checks
        </Typography>
        {validationErrors.length === 0 ? (
          <div className="flex items-center gap-2 text-green-300">
            <LuCircleCheck className="w-4 h-4" />
            <Typography variant="caption">Configuration looks valid.</Typography>
          </div>
        ) : (
          <div className="space-y-2">
            {validationErrors.map((entry) => (
              <div
                key={entry}
                className="flex items-start gap-2 text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2"
              >
                <LuCircleAlert className="w-4 h-4 mt-0.5" />
                <Typography variant="caption">{entry}</Typography>
              </div>
            ))}
          </div>
        )}
      </SimpleCard>
    </div>
  );
}

export function OstiumNodeConfiguration(props: OstiumNodeConfigurationProps) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <SimpleCard className="p-4 space-y-3">
          <Typography variant="bodySmall" className="font-semibold text-foreground">
            Ostium Configuration Error
          </Typography>
          <Typography variant="caption" className="text-destructive">
            {error.message}
          </Typography>
          <Button type="button" onClick={reset} className="w-full">
            Try Again
          </Button>
        </SimpleCard>
      )}
    >
      <OstiumNodeConfigurationInner {...props} />
    </ErrorBoundary>
  );
}

export default OstiumNodeConfiguration;
