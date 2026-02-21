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

export function parsePosition(
  value: unknown,
  index: number,
  marketLookup: Map<number, string>,
): ParsedOstiumPosition {
  const record = toRecord(value) ?? {};
  const candidates = collectCandidates(record);

  const pairIdRaw = readNumber(candidates, [
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

  const pairId = pairIdRaw === null ? null : Math.trunc(pairIdRaw);
  const tradeIndex = tradeIndexRaw === null ? null : Math.trunc(tradeIndexRaw);

  const marketFromPosition =
    readString(candidates, ["market", "symbol", "pair", "pairName", "asset", "assetName"]) ||
    (pairId !== null ? marketLookup.get(pairId) || null : null);

  const sideToken = readString(candidates, ["side", "direction", "positionSide"]);
  const sideBool = readBoolean(candidates, ["isLong", "long", "direction"]);

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
  const pnlRaw = readUnknown(candidates, ["pnl", "pnlUsd", "profitLoss", "unrealizedPnl", "currentPnl"]);
  const slRaw = readUnknown(candidates, ["slPrice", "stopLossPrice", "stopLoss", "sl"]);
  const tpRaw = readUnknown(candidates, ["tpPrice", "takeProfitPrice", "takeProfit", "tp"]);

  const explicitId = readString(candidates, ["id", "positionId", "tradeId", "uid"]);
  const id = explicitId || `${pairId ?? "pair"}-${tradeIndex ?? "idx"}-${index}`;

  return {
    id,
    pairId,
    tradeIndex,
    marketLabel: marketFromPosition || (pairId !== null ? `Pair #${pairId}` : "Unknown market"),
    side,
    collateral: formatNumber(collateralRaw as string | number | null, 4),
    leverage: formatNumber(leverageRaw as string | number | null, 2),
    entryPrice: formatNumber(entryPriceRaw as string | number | null, 6),
    pnl: formatNumber(pnlRaw as string | number | null, 6),
    currentSl: formatNumber(slRaw as string | number | null, 6),
    currentTp: formatNumber(tpRaw as string | number | null, 6),
    raw: record,
  };
}
