"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { Input } from "@/components/ui/Input";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";
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
} from "@/types/ostium";
import { getChain } from "@/web3/config/chain-registry";
import { LuArrowUpRight, LuCircleAlert, LuCircleCheck, LuLoader, LuRefreshCw } from "react-icons/lu";

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
    label: "Setup Needed",
    icon: <LuCircleAlert className="w-4 h-4" />,
  };
}

function OstiumNodeConfigurationInner({
  nodeData,
  handleDataChange,
  authenticated,
  login,
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

  const handleDataChangeRef = useRef(handleDataChange);
  const marketsInFlightRef = useRef(false);
  const overviewInFlightRef = useRef(false);
  const lastOverviewFetchAtRef = useRef(0);
  const lastMarketsFetchAtRef = useRef(0);

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

  const isLegacyAction = useMemo(
    () => FEATURE_FLAGS.OSTIUM_MINIMAL_PANEL && !OSTIUM_PANEL_ACTIONS.includes(action),
    [action],
  );

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
    if (!authenticated) return;
    if (action === "OPEN_POSITION" || action === "PRICE") {
      void refreshMarkets(true);
    }
  }, [action, authenticated, network, refreshMarkets]);

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
      void refreshOverview();
    }, FEATURE_FLAGS.OSTIUM_SETUP_AUTO_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [authenticated, refreshOverview]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (isLegacyAction) {
      errors.push("This is a legacy action. Use only if already configured; new setup should use minimal actions.");
    }

    if (action === "PRICE" && !base && !market) {
      errors.push("Price action requires either Base or Market.");
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

    const readiness = overviewState.data?.readiness;

    if (actionRequiresDelegation(action)) {
      if (!readiness?.readyForPositionManagement) {
        errors.push("Ostium setup not ready for write actions. Open Ostium Perps Setup.");
      }
    }

    if (actionRequiresAllowance(action)) {
      if (!readiness?.readyForOpenPosition) {
        errors.push("Open position requires delegation, allowance, USDC balance, and delegate gas.");
      }
    }

    return errors;
  }, [
    action,
    base,
    collateral,
    isLegacyAction,
    leverage,
    market,
    overviewState.data?.readiness,
    pairId,
    slPrice,
    tpPrice,
    tradeIndex,
  ]);

  const readiness = overviewState.data?.readiness;
  const readyForSelectedAction = useMemo(() => {
    if (!readiness) return false;
    if (actionRequiresAllowance(action)) return readiness.readyForOpenPosition;
    if (actionRequiresDelegation(action)) return readiness.readyForPositionManagement;
    return true;
  }, [action, readiness]);

  const readinessVisual = getReadinessBadge(readyForSelectedAction);

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
                  Sign in to configure Ostium blocks.
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
        <div className="flex items-center justify-between gap-2">
          <Typography variant="bodySmall" className="font-semibold text-foreground">
            Effective Account
          </Typography>
          <Button
            type="button"
            className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white"
            onClick={() => void refreshOverview(true)}
            disabled={!authenticated || overviewState.loading}
          >
            {overviewState.loading ? (
              <LuLoader className="w-4 h-4 animate-spin" />
            ) : (
              <LuRefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>

        <Typography variant="caption" className="text-muted-foreground block">
          Network: <span className="text-foreground">{OSTIUM_NETWORK_LABELS[network]}</span>
        </Typography>
        <Typography variant="caption" className="text-muted-foreground block">
          Safe address: <span className="text-foreground font-mono">{readiness?.safeAddress || "-"}</span>
        </Typography>

        <div className={`rounded-lg border p-2 ${readinessVisual.className}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5">
              {readinessVisual.icon}
              <Typography variant="caption" className="font-semibold">
                {readinessVisual.label}
              </Typography>
            </div>
            {FEATURE_FLAGS.OSTIUM_SETUP_PAGE_ENABLED ? (
              <Link href="/ostium-perps" className="inline-flex items-center gap-1 text-xs underline underline-offset-2">
                Open Ostium Perps Setup
                <LuArrowUpRight className="w-3 h-3" />
              </Link>
            ) : (
              <Typography variant="caption" className="text-xs">
                Setup page disabled by feature flag
              </Typography>
            )}
          </div>
        </div>

        {overviewState.error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <LuCircleAlert className="w-4 h-4 text-red-400 mt-0.5" />
            <Typography variant="caption" className="text-red-300">
              {overviewState.error}
            </Typography>
          </div>
        )}
      </SimpleCard>

      <SimpleCard className="p-4 space-y-4">
        <Typography variant="bodySmall" className="font-semibold text-foreground">
          Perps Configuration
        </Typography>

        <Dropdown
          value={action}
          onChange={(e) => handleDataChange({ action: e.target.value as OstiumAction })}
          options={actionOptions}
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
                onClick={() => void refreshMarkets(true)}
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
