/**
 * Ostium (Perps) frontend type definitions.
 */

export type OstiumNetwork = "testnet" | "mainnet";

export type OstiumAction =
  | "MARKETS"
  | "PRICE"
  | "BALANCE"
  | "LIST_POSITIONS"
  | "OPEN_POSITION"
  | "CLOSE_POSITION"
  | "UPDATE_SL"
  | "UPDATE_TP";

export type OstiumSide = "long" | "short";

export const OSTIUM_NETWORK_LABELS: Record<OstiumNetwork, string> = {
  testnet: "Arbitrum Sepolia",
  mainnet: "Arbitrum Mainnet",
};

export const OSTIUM_ACTION_LABELS: Record<OstiumAction, string> = {
  MARKETS: "List Markets",
  PRICE: "Get Price",
  BALANCE: "Get Balance",
  LIST_POSITIONS: "List Positions",
  OPEN_POSITION: "Open Position",
  CLOSE_POSITION: "Close Position",
  UPDATE_SL: "Update Stop-Loss",
  UPDATE_TP: "Update Take-Profit",
};

export const OSTIUM_ACTIONS: OstiumAction[] = [
  "OPEN_POSITION",
  "CLOSE_POSITION",
  "MARKETS",
  "PRICE",
  "BALANCE",
  "LIST_POSITIONS",
  "UPDATE_SL",
  "UPDATE_TP",
];

export const OSTIUM_PANEL_ACTIONS: OstiumAction[] = [
  "OPEN_POSITION",
  "CLOSE_POSITION",
  "PRICE",
  "MARKETS",
];

export function actionRequiresDelegation(action: OstiumAction): boolean {
  return (
    action === "OPEN_POSITION" ||
    action === "CLOSE_POSITION" ||
    action === "UPDATE_SL" ||
    action === "UPDATE_TP"
  );
}

export function actionRequiresAllowance(action: OstiumAction): boolean {
  return action === "OPEN_POSITION";
}

export interface OstiumReadinessCheck {
  ok: boolean;
  message: string;
}

export interface OstiumReadiness {
  network: OstiumNetwork;
  chainId: number;
  safeAddress: string | null;
  delegateAddress: string | null;
  contracts: {
    usdc: string;
    trading: string;
    tradingStorage: string;
  };
  checks: {
    safeWallet: OstiumReadinessCheck & { address: string | null };
    delegation: OstiumReadinessCheck & { status: string | null };
    usdcBalance: OstiumReadinessCheck & { balance: string | null };
    allowance: OstiumReadinessCheck & { amount: string | null; spender: string };
    delegateGas: OstiumReadinessCheck & { balance: string | null; address: string | null };
  };
  readyForOpenPosition: boolean;
  readyForPositionManagement: boolean;
  refreshedAt: string;
}

export interface OstiumDelegationStatus {
  status: "PENDING" | "ACTIVE" | "REVOKED" | "FAILED";
  safeAddress?: string;
  approvalTxHash?: string | null;
  revokeTxHash?: string | null;
  safeTxHash?: string | null;
  lastError?: string | null;
  updatedAt?: string;
}

export interface OstiumSetupActionItem {
  id:
  | "SAFE_WALLET"
  | "DELEGATION"
  | "SAFE_USDC_BALANCE"
  | "USDC_ALLOWANCE"
  | "DELEGATE_GAS";
  label: string;
  done: boolean;
  message: string;
}

export interface OstiumSetupOverview {
  network: OstiumNetwork;
  delegation: OstiumDelegationStatus | null;
  readiness: OstiumReadiness;
  actionItems: OstiumSetupActionItem[];
  refreshedAt: string;
}

export type JsonRecord = Record<string, unknown>;

export interface ParsedOstiumPosition {
  id: string;
  pairId: number | null;
  tradeIndex: number | null;
  marketLabel: string;
  side: "LONG" | "SHORT" | "UNKNOWN";
  collateral: string;
  leverage: string;
  entryPrice: string;
  pnl: string;
  currentSl: string;
  currentTp: string;
  raw: JsonRecord;
}

export function toRecord(value: unknown): JsonRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as JsonRecord;
}

export function collectCandidates(record: JsonRecord): JsonRecord[] {
  const candidates: JsonRecord[] = [record];
  const nestedKeys = ["trade", "position", "data", "attributes", "raw"];

  for (const key of nestedKeys) {
    const nested = toRecord(record[key]);
    if (nested) {
      candidates.push(nested);
    }
  }

  return candidates;
}

export function readUnknown(candidates: JsonRecord[], keys: string[]): unknown {
  for (const candidate of candidates) {
    for (const key of keys) {
      const value = candidate[key];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }
  return null;
}

export function readString(candidates: JsonRecord[], keys: string[]): string | null {
  const value = readUnknown(candidates, keys);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

export function readNumber(candidates: JsonRecord[], keys: string[]): number | null {
  const value = readUnknown(candidates, keys);
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function readBoolean(candidates: JsonRecord[], keys: string[]): boolean | null {
  const value = readUnknown(candidates, keys);
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "long", "buy"].includes(normalized)) return true;
    if (["false", "0", "no", "short", "sell"].includes(normalized)) return false;
  }
  return null;
}

export function formatNumber(value: string | number | null | undefined, maxFractionDigits = 4): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numeric =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/,/g, "").trim());

  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

export function formatAddress(address: string | null | undefined): string {
  if (!address) return "-";
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function toNumeric(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatScaledValue(
  value: unknown,
  options: {
    scale: number;
    threshold: number;
    scaledDigits: number;
    defaultDigits: number;
  },
): string {
  const numeric = toNumeric(value);
  if (numeric === null) {
    return formatNumber(value as string | number | null | undefined, options.defaultDigits);
  }

  if (Math.abs(numeric) >= options.threshold) {
    return formatNumber(numeric / options.scale, options.scaledDigits);
  }

  return formatNumber(numeric, options.defaultDigits);
}

function normalizePriceLevel(value: unknown, entryReference: number | null): string {
  const numeric = toNumeric(value);
  if (numeric === null) {
    return formatNumber(value as string | number | null | undefined, 6);
  }

  // Try multiple fixed-point variants observed across payloads.
  const scaleCandidates = [1e-18, 1e-14, 1e-12, 1e-10, 1e-9, 1e-8, 1e-6, 1e-4, 1e-2, 1, 1e2, 1e4];

  const candidates = scaleCandidates
    .map((scale) => numeric * scale)
    .filter((candidate) => Number.isFinite(candidate) && candidate > 0);

  if (!candidates.length) {
    return formatNumber(numeric, 6);
  }

  let best = candidates[0];

  if (entryReference && Number.isFinite(entryReference) && entryReference > 0) {
    let bestScore = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      const ratio = candidate / entryReference;
      if (!Number.isFinite(ratio) || ratio <= 0) {
        continue;
      }

      const logDistance = Math.abs(Math.log10(ratio));
      const rangePenalty = ratio < 0.05 || ratio > 20 ? 2 : 0;
      const score = logDistance + rangePenalty;

      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
  } else {
    // Fallback when entry price is unavailable.
    best = Math.abs(numeric) >= 1e9 ? numeric / 1e10 : numeric;
  }

  return formatNumber(best, 4);
}

export function parsePosition(
  value: unknown,
  index: number,
  marketLookup: Map<number, string>,
): ParsedOstiumPosition {
  const record = toRecord(value) ?? {};
  const candidates = collectCandidates(record);

  const pairRecord = toRecord(record.pair);
  const explicitPairId = pairRecord && "id" in pairRecord ? Number(pairRecord.id) : null;

  const pairIdRaw = explicitPairId ?? readNumber(candidates, [
    "pairId",
    "pair_id",
    "pairIndex",
    "pair_index",
    "asset_type",
    "assetType",
  ]);
  const tradeIndexRaw = readNumber(candidates, [
    "tradeIndex",
    "trade_index",
    "index",
    "positionIndex",
    "position_index",
    "trade_id",
  ]);

  const pairId = pairIdRaw === null || isNaN(pairIdRaw) ? null : Math.trunc(pairIdRaw);
  const tradeIndex = tradeIndexRaw === null || isNaN(tradeIndexRaw) ? null : Math.trunc(tradeIndexRaw);

  const explicitMarket = pairRecord && typeof pairRecord.from === "string" && typeof pairRecord.to === "string"
    ? `${pairRecord.from}/${pairRecord.to}`
    : null;

  const marketFromPosition =
    explicitMarket ||
    readString(candidates, ["market", "symbol", "pair", "pairName", "asset", "assetName"]) ||
    (pairId !== null ? marketLookup.get(pairId) || null : null);

  const sideToken = readString(candidates, ["side", "direction", "positionSide"]);
  const sideBool = readBoolean(candidates, ["isLong", "long", "direction", "isBuy"]);

  let side: ParsedOstiumPosition["side"] = "UNKNOWN";
  if (sideToken) {
    const normalized = sideToken.toLowerCase();
    if (["long", "buy", "true", "1"].includes(normalized)) {
      side = "LONG";
    } else if (["short", "sell", "false", "0"].includes(normalized)) {
      side = "SHORT";
    }
  } else if (sideBool !== null) {
    side = sideBool ? "LONG" : "SHORT";
  }

  const collateralRaw = readUnknown(candidates, ["collateral", "collateralAmount", "positionSizeUsdc", "margin"]);
  const leverageRaw = readUnknown(candidates, ["leverage", "positionLeverage", "lev"]);
  const entryPriceRaw = readUnknown(candidates, ["openPrice", "entryPrice", "price", "entry_price"]);
  const pnlRaw = readUnknown(candidates, ["pnl", "pnlUsd", "profitLoss", "unrealizedPnl", "currentPnl", "funding"]);
  const slRaw = readUnknown(candidates, ["slPrice", "stopLossPrice", "stopLoss", "sl"]);
  const tpRaw = readUnknown(candidates, ["tpPrice", "takeProfitPrice", "takeProfit", "tp"]);

  const explicitId = readString(candidates, ["id", "tradeID", "positionId", "tradeId", "uid"]);
  const id = explicitId || `${pairId ?? "pair"}-${tradeIndex ?? "idx"}-${index}`;

  let finalLeverage = formatNumber(leverageRaw as string | number | null, 2);
  let finalCollateral = formatNumber(collateralRaw as string | number | null, 4);

  // Ostium can return leverage as 5000 => 50.00x.
  const leverageNumeric = toNumeric(leverageRaw);
  if (leverageNumeric !== null) {
    const normalizedLeverage = Math.abs(leverageNumeric) > 1000 ? leverageNumeric / 100 : leverageNumeric;
    finalLeverage = `${formatNumber(normalizedLeverage, 2)}x`;
  } else if (finalLeverage !== "-") {
    finalLeverage = `${finalLeverage}x`;
  }

  // Collateral can be returned in 1e6 fixed point (e.g. 100 USDC => 100000000).
  const collateralNumeric = toNumeric(collateralRaw);
  if (collateralNumeric !== null) {
    const normalizedCollateral = Math.abs(collateralNumeric) >= 1e7 ? collateralNumeric / 1e6 : collateralNumeric;
    finalCollateral = `${formatNumber(normalizedCollateral, 2)} USDC`;
  } else if (finalCollateral !== "-") {
    finalCollateral = `${finalCollateral} USDC`;
  }

  // Prices from Ostium often come back in fixed-point precision.
  const finalPrice = formatScaledValue(entryPriceRaw, {
    scale: 1e18,
    threshold: 1e15,
    scaledDigits: 4,
    defaultDigits: 6,
  });

  const finalPnl = formatScaledValue(pnlRaw, {
    scale: 1e18,
    threshold: 1e14,
    scaledDigits: 4,
    defaultDigits: 6,
  });

  const entryPriceNumeric = toNumeric(finalPrice);
  const finalSl = normalizePriceLevel(slRaw, entryPriceNumeric);
  const finalTp = normalizePriceLevel(tpRaw, entryPriceNumeric);

  return {
    id,
    pairId,
    tradeIndex,
    marketLabel: marketFromPosition || (pairId !== null ? `Pair #${pairId}` : "Unknown market"),
    side,
    collateral: finalCollateral,
    leverage: finalLeverage,
    entryPrice: finalPrice,
    pnl: finalPnl,
    currentSl: finalSl,
    currentTp: finalTp,
    raw: record,
  };
}
