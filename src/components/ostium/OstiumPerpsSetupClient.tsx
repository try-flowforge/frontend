"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Safe from "@safe-global/protocol-kit";
import { ethers } from "ethers";
import { usePrivy } from "@privy-io/react-auth";
import {
  LuCircleAlert,
  LuCircleCheck,
} from "react-icons/lu";
import { Typography } from "@/components/ui/Typography";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { OstiumSetupModal } from "./OstiumSetupModal";
import { OstiumTradeLauncher } from "./OstiumTradeLauncher";
import { OstiumHubHeader } from "./OstiumHubHeader";
import { OstiumPositionsList } from "./OstiumPositionsList";
import { API_CONFIG } from "@/config/api";
import { FEATURE_FLAGS } from "@/config/feature-flags";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import { postOstiumAuthed } from "@/lib/ostium-api";
import { emitOstiumTelemetry } from "@/lib/ostium-telemetry";
import { getChain } from "@/web3/config/chain-registry";
import {
  type OstiumNetwork,
  type OstiumSetupOverview,
  type ParsedOstiumPosition,
  parsePosition,
} from "@/types/ostium";

interface SafeTxData {
  to: string;
  value: string;
  data: string;
  operation: number;
}

interface MarketItem {
  pairId: number;
  symbol: string;
  pair: string;
  status: string;
}

interface PositionsResponse {
  positions?: unknown[];
}

interface OpenPositionForm {
  market: string;
  side: "long" | "short";
  collateral: string;
  leverage: string;
}

interface PositionDraft {
  slPrice: string;
  tpPrice: string;
}

type PositionActionType = "close" | "sl" | "tp";

export default function OstiumPerpsSetupClient() {
  const { authenticated, login } = usePrivy();
  const { getPrivyAccessToken, ethereumProvider, chainId, walletAddress } = usePrivyWallet();

  const chain = getChain(chainId);
  const derivedNetwork: OstiumNetwork = chain?.id === "ARBITRUM" ? "mainnet" : "testnet";

  const [overviewState, setOverviewState] = useState<{
    loading: boolean;
    error: string | null;
    data: OstiumSetupOverview | null;
  }>({
    loading: false,
    error: null,
    data: null,
  });

  const [isSetupOpen, setIsSetupOpen] = useState(false);

  const [marketsState, setMarketsState] = useState<{
    loading: boolean;
    error: string | null;
    markets: MarketItem[];
  }>({
    loading: false,
    error: null,
    markets: [],
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

  const [delegationActionLoading, setDelegationActionLoading] = useState<"approve" | "revoke" | null>(null);
  const [allowanceActionLoading, setAllowanceActionLoading] = useState(false);
  const [openPositionLoading, setOpenPositionLoading] = useState(false);
  const [rowActionLoading, setRowActionLoading] = useState<{ id: string; type: PositionActionType } | null>(null);

  const [openPositionForm, setOpenPositionForm] = useState<OpenPositionForm>({
    market: "",
    side: "long",
    collateral: "",
    leverage: "",
  });

  const [positionDrafts, setPositionDrafts] = useState<Record<string, PositionDraft>>({});
  const [actionMessage, setActionMessage] = useState<{
    kind: "error" | "success";
    value: string;
  } | null>(null);

  const overviewInFlightRef = useRef(false);
  const marketsInFlightRef = useRef(false);
  const positionsInFlightRef = useRef(false);

  const lastOverviewFetchAtRef = useRef(0);
  const lastMarketsFetchAtRef = useRef(0);
  const lastPositionsFetchAtRef = useRef(0);

  useEffect(() => {
    emitOstiumTelemetry("ostium_setup_page_opened", { network: derivedNetwork });
  }, [derivedNetwork]);

  const refreshOverview = useCallback(
    async (force = false) => {
      if (!authenticated || overviewInFlightRef.current) return;
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
          { network: derivedNetwork },
          {
            dedupeInFlight: true,
            dedupeKey: `ostium:setup-overview:${derivedNetwork}`,
            cacheMs: FEATURE_FLAGS.OSTIUM_SETUP_FETCH_COOLDOWN_MS,
          },
        );

        lastOverviewFetchAtRef.current = Date.now();
        emitOstiumTelemetry("ostium_setup_refreshed", { network: derivedNetwork });
        setOverviewState({
          loading: false,
          error: null,
          data,
        });
      } catch (error) {
        setOverviewState({
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load Ostium setup overview",
          data: null,
        });
        emitOstiumTelemetry("ostium_setup_refreshed", {
          network: derivedNetwork,
          error: error instanceof Error ? error.message : "unknown",
        });
      } finally {
        overviewInFlightRef.current = false;
      }
    },
    [authenticated, derivedNetwork, getPrivyAccessToken],
  );

  const refreshMarkets = useCallback(
    async (force = false) => {
      if (!authenticated || marketsInFlightRef.current) return;
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
          { network: derivedNetwork },
          {
            dedupeInFlight: true,
            dedupeKey: `ostium:markets:${derivedNetwork}`,
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
          error: error instanceof Error ? error.message : "Failed to load markets",
          markets: [],
        });
      } finally {
        marketsInFlightRef.current = false;
      }
    },
    [authenticated, derivedNetwork, getPrivyAccessToken],
  );

  const refreshPositions = useCallback(
    async (force = false) => {
      if (!authenticated || positionsInFlightRef.current) return;
      if (
        !force &&
        Date.now() - lastPositionsFetchAtRef.current < FEATURE_FLAGS.OSTIUM_SETUP_FETCH_COOLDOWN_MS
      ) {
        return;
      }

      positionsInFlightRef.current = true;
      setPositionsState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await postOstiumAuthed<PositionsResponse>(
          getPrivyAccessToken,
          API_CONFIG.ENDPOINTS.OSTIUM.POSITIONS,
          { network: derivedNetwork },
          {
            dedupeInFlight: true,
            dedupeKey: `ostium:positions:${derivedNetwork}`,
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
          error: error instanceof Error ? error.message : "Failed to load open positions",
          positions: [],
        });
      } finally {
        positionsInFlightRef.current = false;
      }
    },
    [authenticated, derivedNetwork, getPrivyAccessToken],
  );

  const refreshHub = useCallback(
    async (force = false) => {
      await Promise.all([refreshOverview(force), refreshMarkets(force), refreshPositions(force)]);
    },
    [refreshMarkets, refreshOverview, refreshPositions],
  );

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
        throw new Error(`Safe tx hash mismatch. Backend=${prepared.safeTxHash} Frontend=${signedTxHash}`);
      }

      const signature = signedSafeTx.encodedSignatures();
      if (!signature || signature === "0x") {
        throw new Error("Failed to produce Safe signature.");
      }

      await postOstiumAuthed(getPrivyAccessToken, executeEndpoint, {
        network: derivedNetwork,
        signature,
        ...extraPayload,
      });
    },
    [derivedNetwork, ethereumProvider, getPrivyAccessToken],
  );

  const runDelegationFlow = useCallback(
    async (mode: "approve" | "revoke") => {
      const prepareEndpoint =
        mode === "approve"
          ? API_CONFIG.ENDPOINTS.OSTIUM.DELEGATION_PREPARE
          : API_CONFIG.ENDPOINTS.OSTIUM.DELEGATION_REVOKE_PREPARE;

      const executeEndpoint =
        mode === "approve"
          ? API_CONFIG.ENDPOINTS.OSTIUM.DELEGATION_EXECUTE
          : API_CONFIG.ENDPOINTS.OSTIUM.DELEGATION_REVOKE_EXECUTE;

      setDelegationActionLoading(mode);
      setActionMessage(null);

      try {
        const prepared = await postOstiumAuthed<{
          safeAddress: string;
          safeTxHash: string;
          safeTxData: SafeTxData;
        }>(getPrivyAccessToken, prepareEndpoint, { network: derivedNetwork });

        await signAndExecuteSafeFlow(prepared, executeEndpoint);
        await refreshHub(true);

        setActionMessage({
          kind: "success",
          value: mode === "approve" ? "Delegation approved successfully." : "Delegation revoked successfully.",
        });
      } catch (error) {
        setActionMessage({
          kind: "error",
          value: error instanceof Error ? error.message : "Delegation flow failed",
        });
      } finally {
        setDelegationActionLoading(null);
      }
    },
    [derivedNetwork, getPrivyAccessToken, refreshHub, signAndExecuteSafeFlow],
  );

  const runAllowanceFlow = useCallback(async () => {
    setAllowanceActionLoading(true);
    setActionMessage(null);

    try {
      const prepared = await postOstiumAuthed<{
        safeAddress: string;
        safeTxHash: string;
        safeTxData: SafeTxData;
      }>(getPrivyAccessToken, API_CONFIG.ENDPOINTS.OSTIUM.ALLOWANCE_PREPARE, {
        network: derivedNetwork,
      });

      await signAndExecuteSafeFlow(prepared, API_CONFIG.ENDPOINTS.OSTIUM.ALLOWANCE_EXECUTE, {
        safeTxHash: prepared.safeTxHash,
        safeTxData: prepared.safeTxData,
      });

      await refreshHub(true);
      setActionMessage({
        kind: "success",
        value: "USDC allowance approved successfully.",
      });
    } catch (error) {
      setActionMessage({
        kind: "error",
        value: error instanceof Error ? error.message : "USDC allowance approval failed",
      });
    } finally {
      setAllowanceActionLoading(false);
    }
  }, [derivedNetwork, getPrivyAccessToken, refreshHub, signAndExecuteSafeFlow]);

  const runOpenPosition = useCallback(async () => {
    const collateralValue = Number(openPositionForm.collateral);
    const leverageValue = Number(openPositionForm.leverage);

    if (!openPositionForm.market) {
      setActionMessage({ kind: "error", value: "Select a market before opening a position." });
      return;
    }
    if (!Number.isFinite(collateralValue) || collateralValue <= 0) {
      setActionMessage({ kind: "error", value: "Collateral must be greater than 0." });
      return;
    }
    if (!Number.isFinite(leverageValue) || leverageValue <= 0) {
      setActionMessage({ kind: "error", value: "Leverage must be greater than 0." });
      return;
    }

    setOpenPositionLoading(true);
    setActionMessage(null);

    try {
      await postOstiumAuthed(getPrivyAccessToken, API_CONFIG.ENDPOINTS.OSTIUM.OPEN_POSITION, {
        network: derivedNetwork,
        market: openPositionForm.market,
        side: openPositionForm.side,
        collateral: collateralValue,
        leverage: leverageValue,
        idempotencyKey: `ostium-hub-${Date.now()}`,
      });

      await refreshHub(true);
      setActionMessage({
        kind: "success",
        value: "Open position request submitted.",
      });
    } catch (error) {
      setActionMessage({
        kind: "error",
        value: error instanceof Error ? error.message : "Failed to open position",
      });
    } finally {
      setOpenPositionLoading(false);
    }
  }, [derivedNetwork, getPrivyAccessToken, openPositionForm, refreshHub]);

  const runClosePosition = useCallback(
    async (position: ParsedOstiumPosition) => {
      if (position.pairId === null || position.tradeIndex === null) {
        setActionMessage({
          kind: "error",
          value: "This position does not expose pairId/tradeIndex. Close it from workflow action with explicit IDs.",
        });
        return;
      }

      setRowActionLoading({ id: position.id, type: "close" });
      setActionMessage(null);

      try {
        await postOstiumAuthed(getPrivyAccessToken, API_CONFIG.ENDPOINTS.OSTIUM.CLOSE_POSITION, {
          network: derivedNetwork,
          pairId: position.pairId,
          tradeIndex: position.tradeIndex,
          idempotencyKey: `ostium-close-${position.pairId}-${position.tradeIndex}-${Date.now()}`,
        });

        await refreshHub(true);
        setActionMessage({
          kind: "success",
          value: `Close request submitted for ${position.marketLabel}.`,
        });
      } catch (error) {
        setActionMessage({
          kind: "error",
          value: error instanceof Error ? error.message : "Failed to close position",
        });
      } finally {
        setRowActionLoading(null);
      }
    },
    [derivedNetwork, getPrivyAccessToken, refreshHub],
  );

  const runUpdatePriceGuard = useCallback(
    async (position: ParsedOstiumPosition, type: "sl" | "tp") => {
      if (position.pairId === null || position.tradeIndex === null) {
        setActionMessage({
          kind: "error",
          value: "This position does not expose pairId/tradeIndex for updates.",
        });
        return;
      }

      const draft = positionDrafts[position.id];
      const valueRaw = type === "sl" ? draft?.slPrice : draft?.tpPrice;
      const numericValue = Number(valueRaw);

      if (!valueRaw || !Number.isFinite(numericValue) || numericValue <= 0) {
        setActionMessage({
          kind: "error",
          value: type === "sl" ? "Stop-loss price must be greater than 0." : "Take-profit price must be greater than 0.",
        });
        return;
      }

      setRowActionLoading({ id: position.id, type });
      setActionMessage(null);

      try {
        if (type === "sl") {
          await postOstiumAuthed(getPrivyAccessToken, API_CONFIG.ENDPOINTS.OSTIUM.UPDATE_SL, {
            network: derivedNetwork,
            pairId: position.pairId,
            tradeIndex: position.tradeIndex,
            slPrice: numericValue,
          });
        } else {
          await postOstiumAuthed(getPrivyAccessToken, API_CONFIG.ENDPOINTS.OSTIUM.UPDATE_TP, {
            network: derivedNetwork,
            pairId: position.pairId,
            tradeIndex: position.tradeIndex,
            tpPrice: numericValue,
          });
        }

        await refreshPositions(true);
        setActionMessage({
          kind: "success",
          value: type === "sl" ? "Stop-loss update submitted." : "Take-profit update submitted.",
        });
      } catch (error) {
        setActionMessage({
          kind: "error",
          value: error instanceof Error ? error.message : "Failed to update position",
        });
      } finally {
        setRowActionLoading(null);
      }
    },
    [derivedNetwork, getPrivyAccessToken, positionDrafts, refreshPositions],
  );

  useEffect(() => {
    if (!authenticated) return;
    void refreshHub(true);
  }, [authenticated, refreshHub]);

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

  const marketOptions = useMemo(
    () =>
      marketsState.markets.map((entry) => ({
        value: entry.symbol || String(entry.pairId),
        label: `${entry.pair} (#${entry.pairId})`,
      })),
    [marketsState.markets],
  );

  useEffect(() => {
    if (openPositionForm.market || marketOptions.length === 0) return;
    setOpenPositionForm((prev) => ({ ...prev, market: marketOptions[0].value }));
  }, [marketOptions, openPositionForm.market]);

  const marketLookup = useMemo(() => {
    const map = new Map<number, string>();
    for (const market of marketsState.markets) {
      map.set(market.pairId, market.pair);
    }
    return map;
  }, [marketsState.markets]);

  const parsedPositions = useMemo(() => {
    return positionsState.positions.map((entry, index) => parsePosition(entry, index, marketLookup));
  }, [marketLookup, positionsState.positions]);

  useEffect(() => {
    setPositionDrafts((prev) => {
      const next: Record<string, PositionDraft> = {};

      for (const position of parsedPositions) {
        next[position.id] = {
          slPrice:
            prev[position.id]?.slPrice ??
            (position.currentSl !== "-" ? position.currentSl : ""),
          tpPrice:
            prev[position.id]?.tpPrice ??
            (position.currentTp !== "-" ? position.currentTp : ""),
        };
      }

      return next;
    });
  }, [parsedPositions]);

  const overview = overviewState.data;
  const delegationStatus = overview?.delegation?.status || overview?.readiness?.checks?.delegation?.status || null;

  const safeAddress = overview?.readiness?.safeAddress || null;

  const needsAllowance = useMemo(
    () => !(overview?.readiness?.checks?.allowance?.ok ?? false),
    [overview],
  );

  const canManagePositions = Boolean(overview?.readiness?.readyForPositionManagement);
  const canOpenPosition = Boolean(overview?.readiness?.readyForOpenPosition);

  const readinessDoneCount = overview?.actionItems.filter((item) => item.done).length ?? 0;
  const readinessTotalCount = overview?.actionItems.length ?? 0;

  const safeUsdcBalance = overview?.readiness?.checks?.usdcBalance?.balance || "-";
  const delegateGasBalance = overview?.readiness?.checks?.delegateGas?.balance || "-";
  const hubLoading = overviewState.loading || positionsState.loading || marketsState.loading;

  const canSubmitOpenPosition =
    canOpenPosition &&
    openPositionForm.market.length > 0 &&
    Number(openPositionForm.collateral) > 0 &&
    Number(openPositionForm.leverage) > 0;

  return (
    <div className="relative min-h-screen bg-background">
      <div className="relative mx-auto max-w-7xl px-4 py-10 space-y-6">
        <OstiumHubHeader
          derivedNetwork={derivedNetwork}
          safeAddress={safeAddress ?? ""}
          authenticated={authenticated}
          hubLoading={hubLoading}
          readinessDoneCount={readinessDoneCount}
          readinessTotalCount={readinessTotalCount}
          parsedPositionsCount={parsedPositions.length}
          safeUsdcBalance={safeUsdcBalance}
          delegateGasBalance={delegateGasBalance}
          refreshHub={refreshHub}
          login={login}
        />

        {(overviewState.error || marketsState.error || positionsState.error || actionMessage) && (
          <div className="space-y-3">
            {overviewState.error && (
              <SimpleCard className="rounded-xl border-red-500/20 bg-red-500/10 p-4 hover:bg-red-500/10 hover:border-red-500/20">
                <div className="flex items-start gap-2">
                  <LuCircleAlert className="mt-0.5 h-4 w-4 text-red-400" />
                  <Typography variant="caption" className="text-red-300">
                    {overviewState.error}
                  </Typography>
                </div>
              </SimpleCard>
            )}

            {marketsState.error && (
              <SimpleCard className="rounded-xl border-amber-500/20 bg-amber-500/10 p-4 hover:bg-amber-500/10 hover:border-amber-500/20">
                <div className="flex items-start gap-2">
                  <LuCircleAlert className="mt-0.5 h-4 w-4 text-amber-300" />
                  <Typography variant="caption" className="text-amber-200">
                    {marketsState.error}
                  </Typography>
                </div>
              </SimpleCard>
            )}

            {positionsState.error && (
              <SimpleCard className="rounded-xl border-amber-500/20 bg-amber-500/10 p-4 hover:bg-amber-500/10 hover:border-amber-500/20">
                <div className="flex items-start gap-2">
                  <LuCircleAlert className="mt-0.5 h-4 w-4 text-amber-300" />
                  <Typography variant="caption" className="text-amber-200">
                    {positionsState.error}
                  </Typography>
                </div>
              </SimpleCard>
            )}

            {actionMessage && (
              <SimpleCard
                className={`rounded-xl border p-4 hover:bg-transparent ${actionMessage.kind === "success"
                  ? "border-green-500/20 bg-green-500/10 hover:border-green-500/20"
                  : "border-amber-500/20 bg-amber-500/10 hover:border-amber-500/20"
                  }`}
              >
                <div className="flex items-start gap-2">
                  {actionMessage.kind === "success" ? (
                    <LuCircleCheck className="mt-0.5 h-4 w-4 text-green-400" />
                  ) : (
                    <LuCircleAlert className="mt-0.5 h-4 w-4 text-amber-300" />
                  )}
                  <Typography
                    variant="caption"
                    className={actionMessage.kind === "success" ? "text-green-300" : "text-amber-200"}
                  >
                    {actionMessage.value}
                  </Typography>
                </div>
              </SimpleCard>
            )}
          </div>
        )}

        {authenticated && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <OstiumTradeLauncher
                canOpenPosition={canOpenPosition}
                marketOptions={marketOptions}
                openPositionForm={openPositionForm}
                setOpenPositionForm={setOpenPositionForm}
                runOpenPosition={runOpenPosition}
                canSubmitOpenPosition={canSubmitOpenPosition}
                openPositionLoading={openPositionLoading}
                setIsSetupOpen={setIsSetupOpen}
              />

              <OstiumPositionsList
                parsedPositions={parsedPositions}
                positionsLoading={positionsState.loading}
                safeAddress={safeAddress ?? ""}
                derivedNetwork={derivedNetwork}
                positionDrafts={positionDrafts}
                setPositionDrafts={setPositionDrafts}
                canManagePositions={canManagePositions}
                rowActionLoading={rowActionLoading}
                refreshPositions={refreshPositions}
                runClosePosition={runClosePosition}
                runUpdatePriceGuard={runUpdatePriceGuard}
              />
            </div>
          </div>
        )}

        <OstiumSetupModal
          open={isSetupOpen}
          onOpenChange={setIsSetupOpen}
          overview={overview}
          delegationStatus={delegationStatus}
          delegationActionLoading={delegationActionLoading}
          allowanceActionLoading={allowanceActionLoading}
          needsAllowance={needsAllowance}
          ethereumProvider={ethereumProvider as any}
          runDelegationFlow={runDelegationFlow}
          runAllowanceFlow={runAllowanceFlow}
        />
      </div>
    </div>
  );
}
