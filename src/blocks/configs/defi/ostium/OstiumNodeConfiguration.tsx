"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Input } from "@/components/ui/Input";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";
import { AuthenticationStatus } from "@/components/workspace/AuthenticationStatus";
import { CopyButton } from "@/components/ui/CopyButton";
import { API_CONFIG } from "@/config/api";
import { FEATURE_FLAGS } from "@/config/feature-flags";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { postOstiumAuthed } from "@/lib/ostium-api";
import { emitOstiumTelemetry } from "@/lib/ostium-telemetry";
import {
  actionRequiresAllowance,
  actionRequiresDelegation,
  OSTIUM_ACTION_LABELS,
  OSTIUM_ACTIONS,
  OSTIUM_NETWORK_LABELS,
  OSTIUM_PANEL_ACTIONS,
  type OstiumAction,
  type OstiumNetwork,
  type OstiumSetupOverview,
  parsePosition,
} from "@/types/ostium";
import { getChain } from "@/web3/config/chain-registry";
import { LuArrowUpRight, LuCircleAlert, LuInfo, LuLoader, LuRefreshCw } from "react-icons/lu";

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

function toTrimmedString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function normalizePriceInputValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const numeric = Number(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return value;
  if (Math.abs(numeric) >= 1e9) {
    return (numeric / 1e10).toFixed(4).replace(/\.?0+$/, "");
  }
  return value;
}

function toNetwork(value: unknown): OstiumNetwork {
  return value === "mainnet" ? "mainnet" : "testnet";
}

function toAction(value: unknown): OstiumAction {
  return OSTIUM_ACTIONS.includes(value as OstiumAction)
    ? (value as OstiumAction)
    : "OPEN_POSITION";
}

function getReadinessBadge(ok: boolean): {
  className: string;
  label: string;
} {
  if (ok) {
    return {
      className: "text-green-300 bg-green-500/10 border-green-500/20",
      label: "Ready",
    };
  }
  return {
    className: "text-amber-200 bg-amber-500/10 border-amber-500/20",
    label: "Configure Action",
  };
}

function OstiumNodeConfigurationInner({
  nodeData,
  handleDataChange,
  authenticated,
}: OstiumNodeConfigurationProps) {
  const { getPrivyAccessToken, chainId } = usePrivyWallet();

  const currentChain = getChain(chainId);
  const derivedNetwork: OstiumNetwork = currentChain?.id === "ARBITRUM" ? "mainnet" : "testnet";

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
  const normalizedSlPrice = normalizePriceInputValue(slPrice);
  const normalizedTpPrice = normalizePriceInputValue(tpPrice);

  const [marketsState, setMarketsState] = useState<{
    loading: boolean;
    error: string | null;
    markets: MarketItem[];
  }>({
    loading: false,
    error: null,
    markets: [],
  });

  const [overviewState, setOverviewState] = useState<{
    loading: boolean;
    error: string | null;
    data: OstiumSetupOverview | null;
  }>({
    loading: false,
    error: null,
    data: null,
  });

  const [positionsState, setPositionsState] = useState<{
    loading: boolean;
    error: string | null;
    positions: unknown[];
  }>({
    loading: false,
    error: null,
    positions: [],
  });

  const handleDataChangeRef = useRef(handleDataChange);
  const marketsInFlightRef = useRef(false);
  const overviewInFlightRef = useRef(false);
  const positionsInFlightRef = useRef(false);
  const lastOverviewFetchAtRef = useRef(0);
  const lastMarketsFetchAtRef = useRef(0);
  const lastPositionsFetchAtRef = useRef(0);

  useEffect(() => {
    handleDataChangeRef.current = handleDataChange;
  }, [handleDataChange]);

  useEffect(() => {
    emitOstiumTelemetry("ostium_panel_opened", { network, action });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const marketOptions = useMemo(
    () =>
      marketsState.markets.map((entry) => ({
        value: String(entry.symbol || entry.pairId),
        label: `${entry.pair} (#${entry.pairId})`,
      })),
    [marketsState.markets],
  );

  const actionOptions = useMemo(() => {
    const allowedActions = FEATURE_FLAGS.OSTIUM_MINIMAL_PANEL ? OSTIUM_PANEL_ACTIONS : OSTIUM_ACTIONS;
    const options = allowedActions.map((entry) => ({
      value: entry,
      label: OSTIUM_ACTION_LABELS[entry],
    }));

    if (!allowedActions.includes(action)) {
      options.unshift({
        value: action,
        label: `${OSTIUM_ACTION_LABELS[action]} (Legacy)`,
      });
    }

    return options;
  }, [action]);

  const refreshMarkets = useCallback(async (force = false) => {
    if (!authenticated || marketsInFlightRef.current) {
      return;
    }
    if (
      !force &&
      Date.now() - lastMarketsFetchAtRef.current < FEATURE_FLAGS.OSTIUM_SETUP_FETCH_COOLDOWN_MS
    ) {
      return;
    }

    marketsInFlightRef.current = true;
    setMarketsState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await postOstiumAuthed<{ markets: MarketItem[] }>(
        getPrivyAccessToken,
        API_CONFIG.ENDPOINTS.OSTIUM.MARKETS,
        { network },
        {
          dedupeInFlight: true,
          dedupeKey: `ostium:markets:${network}`,
          cacheMs: FEATURE_FLAGS.OSTIUM_SETUP_FETCH_COOLDOWN_MS,
        },
      );
      lastMarketsFetchAtRef.current = Date.now();
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
    } finally {
      marketsInFlightRef.current = false;
    }
  }, [authenticated, getPrivyAccessToken, network]);

  const refreshOverview = useCallback(async (force = false) => {
    if (!authenticated || overviewInFlightRef.current) {
      return;
    }
    if (
      !force &&
      Date.now() - lastOverviewFetchAtRef.current < FEATURE_FLAGS.OSTIUM_SETUP_FETCH_COOLDOWN_MS
    ) {
      return;
    }

    overviewInFlightRef.current = true;
    setOverviewState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await postOstiumAuthed<OstiumSetupOverview>(
        getPrivyAccessToken,
        API_CONFIG.ENDPOINTS.OSTIUM.SETUP_OVERVIEW,
        { network },
        {
          dedupeInFlight: true,
          dedupeKey: `ostium:setup-overview:${network}`,
          cacheMs: FEATURE_FLAGS.OSTIUM_SETUP_FETCH_COOLDOWN_MS,
        },
      );
      lastOverviewFetchAtRef.current = Date.now();
      emitOstiumTelemetry("ostium_panel_refreshed", {
        network,
        action,
      });
      setOverviewState({
        loading: false,
        error: null,
        data,
      });
    } catch (error) {
      setOverviewState({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load Ostium setup status",
        data: null,
      });
      emitOstiumTelemetry("ostium_panel_refreshed", {
        network,
        action,
        error: error instanceof Error ? error.message : "unknown",
      });
    } finally {
      overviewInFlightRef.current = false;
    }
  }, [action, authenticated, getPrivyAccessToken, network]);

  const refreshPositions = useCallback(async (force = false) => {
    if (!authenticated || positionsInFlightRef.current) {
      return;
    }
    if (
      !force &&
      Date.now() - lastPositionsFetchAtRef.current < FEATURE_FLAGS.OSTIUM_SETUP_FETCH_COOLDOWN_MS
    ) {
      return;
    }

    positionsInFlightRef.current = true;
    setPositionsState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const traderAddress = overviewState.data?.readiness.safeAddress;
      if (!traderAddress) return;

      const data = await postOstiumAuthed<{ positions: unknown[] }>(
        getPrivyAccessToken,
        API_CONFIG.ENDPOINTS.OSTIUM.POSITIONS,
        { network, traderAddress },
        {
          dedupeInFlight: true,
          dedupeKey: `ostium:positions:${network}:${traderAddress}`,
          cacheMs: FEATURE_FLAGS.OSTIUM_SETUP_FETCH_COOLDOWN_MS,
        },
      );
      lastPositionsFetchAtRef.current = Date.now();
      setPositionsState({
        loading: false,
        error: null,
        positions: Array.isArray(data.positions) ? data.positions : [],
      });
    } catch (error) {
      setPositionsState({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load Ostium positions",
        positions: [],
      });
    } finally {
      positionsInFlightRef.current = false;
    }
  }, [
    authenticated,
    getPrivyAccessToken,
    network,
    overviewState.data?.readiness.safeAddress,
  ]);

  useEffect(() => {
    const updates: Record<string, unknown> = {};

    if (nodeData.network !== derivedNetwork) {
      updates.network = derivedNetwork;
    }
    if (!nodeData.provider) {
      updates.provider = "OSTIUM";
    }
    if (!nodeData.action) {
      updates.action = "OPEN_POSITION";
    }
    if (!nodeData.quote) {
      updates.quote = "USD";
    }

    // Remove wallet-context fields from node config; backend resolves safe address.
    if (toTrimmedString(nodeData.address)) {
      updates.address = "";
    }
    if (toTrimmedString(nodeData.traderAddress)) {
      updates.traderAddress = "";
    }

    if (Object.keys(updates).length > 0) {
      handleDataChange(updates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedNetwork]);

  useEffect(() => {
    const updates: Record<string, unknown> = {};
    if (slPrice && normalizedSlPrice !== slPrice) {
      updates.slPrice = normalizedSlPrice;
    }
    if (tpPrice && normalizedTpPrice !== tpPrice) {
      updates.tpPrice = normalizedTpPrice;
    }
    if (Object.keys(updates).length > 0) {
      handleDataChange(updates);
    }
  }, [handleDataChange, normalizedSlPrice, normalizedTpPrice, slPrice, tpPrice]);

  useEffect(() => {
    if (!authenticated) return;
    if (action === "OPEN_POSITION" || action === "PRICE") {
      void refreshMarkets(true);
    } else if (action === "CLOSE_POSITION" || action === "UPDATE_SL" || action === "UPDATE_TP") {
      void refreshMarkets(true); // Needed for market lookup map
      void refreshPositions(true);
    }
  }, [action, authenticated, network, refreshMarkets, refreshPositions]);

  useEffect(() => {
    if (!authenticated) return;
    void refreshOverview(true);
  }, [authenticated, network, refreshOverview]);

  useEffect(() => {
    if (!authenticated || !FEATURE_FLAGS.OSTIUM_SETUP_AUTO_REFRESH_ENABLED) {
      return;
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void Promise.all([refreshOverview(), refreshPositions()]);
    }, FEATURE_FLAGS.OSTIUM_SETUP_AUTO_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [authenticated, refreshOverview, refreshPositions]);

  const marketLookup = useMemo(() => {
    const map = new Map<number, string>();
    for (const marketItem of marketsState.markets) {
      map.set(marketItem.pairId, marketItem.pair);
    }
    return map;
  }, [marketsState.markets]);

  const parsedPositions = useMemo(() => {
    return positionsState.positions.map((entry, index) => parsePosition(entry, index, marketLookup));
  }, [marketLookup, positionsState.positions]);

  const selectedPositionId = `${pairId}-${tradeIndex}`;

  const positionOptions = useMemo(() => {
    return parsedPositions.map((pos) => ({
      value: `${pos.pairId}-${pos.tradeIndex}`,
      label: `${pos.marketLabel} - ${pos.side} (PnL: ${pos.pnl})`,
    }));
  }, [parsedPositions]);

  const readiness = overviewState.data?.readiness;
  const readyForSelectedAction = useMemo(() => {
    if (!readiness) return false;
    if (actionRequiresAllowance(action)) return readiness.readyForOpenPosition;
    if (actionRequiresDelegation(action)) return readiness.readyForPositionManagement;
    return true;
  }, [action, readiness]);

  const readinessVisual = getReadinessBadge(readyForSelectedAction);

  if (!authenticated) {
    return <AuthenticationStatus />;
  }

  return (
    <div className="space-y-4 min-h-[60vh] max-h-screen">
      <SimpleCard className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <Typography variant="h5" className="font-semibold text-foreground">
            Account Details
          </Typography>
          <Button
            type="button"
            className="h-8 px-3 rounded-lg text-xs gap-1.5"
            onClick={() => void refreshOverview(true)}
            disabled={!authenticated || overviewState.loading}
          >
            {overviewState.loading ? (
              <LuLoader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LuRefreshCw className="w-3.5 h-3.5" />
            )}
            Refresh
          </Button>
        </div>

        <div className="rounded-xl border border-white/15 bg-black/20 divide-y divide-white/10">
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <span className="text-xs text-muted-foreground font-medium">Network</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${network === "mainnet" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
              {OSTIUM_NETWORK_LABELS[network]}
            </span>
          </div>
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <span className="text-xs text-muted-foreground font-medium">Address</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs text-foreground font-mono truncate">
                {readiness?.safeAddress
                  ? `${readiness.safeAddress.slice(0, 6)}…${readiness.safeAddress.slice(-4)}`
                  : "-"}
              </span>
              {readiness?.safeAddress && (
                <CopyButton text={readiness.safeAddress} size="sm" />
              )}
            </div>
          </div>
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <span className="text-xs text-muted-foreground font-medium">Action Status</span>
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${readinessVisual.className}`}>
              {readinessVisual.label}
            </div>
          </div>
        </div>

        {FEATURE_FLAGS.OSTIUM_SETUP_PAGE_ENABLED && (
          <div className="mt-3 flex justify-center">
            <Link
              href="/ostium"
              className="inline-flex items-center underline gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              Open Ostium Perpectual Setup
              <LuArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {overviewState.error && (
          <div className="flex items-start gap-2 p-2.5 mt-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <LuCircleAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <Typography variant="caption" className="text-destructive">
              {overviewState.error}
            </Typography>
          </div>
        )}
      </SimpleCard>

      <SimpleCard className="p-5 space-y-4">
        <Typography variant="h5" className="font-semibold text-foreground">
          Perpetual Actions
        </Typography>

        <Dropdown
          value={action}
          onChange={(e) => handleDataChange({ action: e.target.value as OstiumAction })}
          options={actionOptions}
          placeholder="Select action"
        />

        {(action === "MARKETS" || action === "BALANCE" || action === "LIST_POSITIONS") && (
          <div className="rounded-xl border border-white/15 bg-black/20 p-3.5 shadow-sm">
            <div className="flex items-start gap-2.5">
              <LuInfo className="w-4 h-4 text-amber-400/70 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <Typography variant="caption" className="text-foreground font-medium">
                  No configuration needed
                </Typography>
                <Typography variant="caption" className="text-muted-foreground leading-relaxed">
                  {action === "MARKETS" && "This action will fetch all available Ostium markets and their current status."}
                  {action === "BALANCE" && "This action will retrieve the USDC balance of your Safe wallet."}
                  {action === "LIST_POSITIONS" && "This action will list all your open positions on Ostium."}
                </Typography>
              </div>
            </div>
          </div>
        )}

        {action === "OPEN_POSITION" && (
          <div className="rounded-xl border border-white/15 bg-black/20 p-3.5 space-y-4 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Typography variant="caption" className="text-muted-foreground font-medium">
                  Market Entry
                </Typography>
                <button
                  type="button"
                  className="text-[11px] text-amber-500/70 hover:text-amber-400 inline-flex items-center gap-1 font-medium transition-colors"
                  onClick={() => void refreshMarkets(true)}
                  disabled={marketsState.loading || !authenticated}
                >
                  {marketsState.loading ? (
                    <LuLoader className="w-3 h-3 animate-spin" />
                  ) : (
                    <LuRefreshCw className="w-3 h-3" />
                  )}
                  Refresh list
                </button>
              </div>
              {marketOptions.length > 0 ? (
                <Dropdown
                  value={market}
                  onChange={(e) => handleDataChange({ market: e.target.value })}
                  options={marketOptions}
                  placeholder="Select asset to trade"
                />
              ) : (
                <Input
                  value={market}
                  onChange={(e) => handleDataChange({ market: e.target.value })}
                  placeholder="e.g. BTC, ETH, XAU"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 flex flex-col justify-end">
                <Typography variant="caption" className="text-muted-foreground font-medium">
                  Direction
                </Typography>
                <Dropdown
                  value={side}
                  onChange={(e) => handleDataChange({ side: e.target.value })}
                  options={[
                    { value: "long", label: "Long" },
                    { value: "short", label: "Short" },
                  ]}
                  placeholder="Select side"
                />
              </div>
              <div className="space-y-1.5 flex flex-col justify-end">
                <Typography variant="caption" className="text-muted-foreground font-medium">
                  Leverage
                </Typography>
                <div className="relative">
                  <Input
                    value={leverage}
                    onChange={(e) => handleDataChange({ leverage: e.target.value })}
                    placeholder="2.5"
                    className="pr-6"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">x</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Typography variant="caption" className="text-muted-foreground font-medium">
                Amount
              </Typography>
              <div className="relative">
                <Input
                  value={collateral}
                  onChange={(e) => handleDataChange({ collateral: e.target.value })}
                  placeholder="100.00"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground font-medium bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                  USDC
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Typography variant="caption" className="text-muted-foreground font-medium">
                  Stop-Loss (Optional)
                </Typography>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">$</span>
                  <Input
                    value={normalizedSlPrice}
                    onChange={(e) => handleDataChange({ slPrice: e.target.value })}
                    placeholder="Price trigger"
                    className="pl-6"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Typography variant="caption" className="text-muted-foreground font-medium">
                  Take-Profit (Optional)
                </Typography>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">$</span>
                  <Input
                    value={normalizedTpPrice}
                    onChange={(e) => handleDataChange({ tpPrice: e.target.value })}
                    placeholder="Price target"
                    className="pl-6"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {action === "PRICE" && (
          <div className="rounded-xl border border-white/15 bg-black/20 p-3.5 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Typography variant="caption" className="text-muted-foreground font-medium">
                  Asset
                </Typography>
                <Input
                  value={base}
                  onChange={(e) => handleDataChange({ base: e.target.value.toUpperCase() })}
                  placeholder="e.g. BTC"
                />
              </div>
              <div className="space-y-1.5">
                <Typography variant="caption" className="text-muted-foreground font-medium">
                  Currency
                </Typography>
                <Input
                  value={quote}
                  onChange={(e) => handleDataChange({ quote: e.target.value.toUpperCase() })}
                  placeholder="USD"
                />
              </div>
            </div>
          </div>
        )}

        {(action === "CLOSE_POSITION" || action === "UPDATE_SL" || action === "UPDATE_TP") && (
          <div className="rounded-xl border border-white/15 bg-black/20 p-3.5 space-y-4 shadow-sm">
            <div className="space-y-3 pb-3">
              <div className="flex items-center justify-between">
                <Typography variant="caption" className="text-muted-foreground font-medium">
                  Active Position
                </Typography>
                <button
                  type="button"
                  className="text-[11px] text-amber-500/70 hover:text-amber-400 inline-flex items-center gap-1 font-medium transition-colors"
                  onClick={() => void refreshPositions(true)}
                  disabled={positionsState.loading || !authenticated}
                >
                  {positionsState.loading ? (
                    <LuLoader className="w-3 h-3 animate-spin" />
                  ) : (
                    <LuRefreshCw className="w-3 h-3" />
                  )}
                  Refresh list
                </button>
              </div>

              {positionOptions.length > 0 ? (
                <Dropdown
                  value={selectedPositionId}
                  onChange={(e) => {
                    const [pId, tIndex] = e.target.value.split("-");
                    const selected = parsedPositions.find(
                      (pos) => `${pos.pairId}-${pos.tradeIndex}` === e.target.value,
                    );
                    handleDataChange({
                      pairId: pId,
                      tradeIndex: tIndex,
                      ...(selected?.currentSl && selected.currentSl !== "-" ? { slPrice: selected.currentSl } : {}),
                      ...(selected?.currentTp && selected.currentTp !== "-" ? { tpPrice: selected.currentTp } : {}),
                    });
                  }}
                  options={positionOptions}
                  placeholder="Select active position"
                />
              ) : (
                <div className="text-sm text-muted-foreground/80 py-2">
                  No active positions found.
                </div>
              )}
            </div>

            {action === "UPDATE_SL" && (
              <div className="space-y-1.5">
                <Typography variant="caption" className="text-muted-foreground font-medium">
                  New Stop-Loss Price
                </Typography>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">$</span>
                  <Input
                    value={normalizedSlPrice}
                    onChange={(e) => handleDataChange({ slPrice: e.target.value })}
                    placeholder="Price trigger"
                    className="pl-6"
                  />
                </div>
              </div>
            )}

            {action === "UPDATE_TP" && (
              <div className="space-y-1.5">
                <Typography variant="caption" className="text-muted-foreground font-medium">
                  New Take-Profit Price
                </Typography>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">$</span>
                  <Input
                    value={normalizedTpPrice}
                    onChange={(e) => handleDataChange({ tpPrice: e.target.value })}
                    placeholder="Price target"
                    className="pl-6"
                  />
                </div>
              </div>
            )}

            {action === "CLOSE_POSITION"}
          </div>
        )}

        {marketsState.error && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 mt-2">
            <LuCircleAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <Typography variant="caption" className="text-destructive">
              {marketsState.error}
            </Typography>
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
            Ostium Error
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
