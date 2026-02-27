type ErrorEnvelope = {
  code?: string;
  message?: string;
  details?: unknown;
  retryable?: boolean;
};

function extractNestedError(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const maybeDetails = details as Record<string, unknown>;
  const directError = maybeDetails.error;
  if (typeof directError === "string") {
    return directError;
  }
  return null;
}

export function mapOstiumErrorToMessage(
  status: number,
  error: ErrorEnvelope | null | undefined,
): string {
  const code = error?.code || "";
  const rawMessage = error?.message || "";
  const nestedError = extractNestedError(error?.details);
  const lower = `${rawMessage} ${nestedError || ""}`.toLowerCase();

  if (code === "ALLOWANCE_MISSING" || lower.includes("sufficient allowance")) {
    return "USDC allowance is missing for your Safe wallet. Open Ostium Perps Setup and approve allowance.";
  }
  if (
    code === "SAFE_WALLET_MISSING" ||
    code === "OSTIUM_ADDRESS_VALIDATION_FAILED" ||
    lower.includes("safe wallet not found")
  ) {
    return "Safe wallet is not available for selected network. Create/select Safe first.";
  }
  if (
    code === "DELEGATION_NOT_ACTIVE" ||
    lower.includes("delegation is not active") ||
    lower.includes("delegation not active")
  ) {
    return "Delegation is not active. Open Ostium Perps Setup and approve delegation.";
  }
  if (code === "DELEGATE_GAS_LOW" || lower.includes("delegate wallet gas is low") || lower.includes("delegate gas")) {
    return "Delegate wallet gas is low. Fund delegate wallet with ETH.";
  }
  if (code === "OSTIUM_SERVICE_TIMEOUT" || lower.includes("timeout")) {
    return "Ostium service timed out. Retry in a few seconds.";
  }
  if (code === "OSTIUM_INTERNAL_ERROR") {
    return "Ostium service failed unexpectedly. Retry once; if it persists, check backend/ostium-service logs.";
  }
  if (status >= 500) {
    return "Ostium service is temporarily unavailable. Please retry shortly.";
  }

  return rawMessage || "Ostium request failed.";
}
