import { buildApiUrl } from "@/config/api";
import { mapOstiumErrorToMessage } from "@/lib/ostium-errors";

type ErrorEnvelope = {
  code?: string;
  message?: string;
  details?: unknown;
  retryable?: boolean;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: ErrorEnvelope;
};

export class OstiumApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  readonly details: unknown;

  constructor(message: string, options: { code?: string; status: number; retryable?: boolean; details?: unknown }) {
    super(message);
    this.name = "OstiumApiError";
    this.code = options.code || "OSTIUM_REQUEST_FAILED";
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

interface PostOstiumOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  dedupeInFlight?: boolean;
  dedupeKey?: string;
  cacheMs?: number;
}

const DEFAULT_RETRY_DELAY_MS = 500;
const DEFAULT_MAX_RETRIES = 2;
const inFlightRequests = new Map<string, Promise<unknown>>();
const responseCache = new Map<string, { expiresAt: number; data: unknown }>();

function shouldRetry(status: number | null, retryable: boolean | undefined, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false;
  if (retryable === false) return false;
  if (status == null) return true;
  return status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function postOstiumAuthed<T>(
  getPrivyAccessToken: () => Promise<string | null>,
  endpoint: string,
  payload: Record<string, unknown>,
  options?: PostOstiumOptions,
): Promise<T> {
  const accessToken = await getPrivyAccessToken();
  if (!accessToken) {
    throw new OstiumApiError("Please sign in to call Ostium APIs.", {
      code: "AUTH_REQUIRED",
      status: 401,
      retryable: false,
    });
  }

  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelay = options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const requestKey = options?.dedupeKey || `${endpoint}:${JSON.stringify(payload)}`;
  const cacheMs = options?.cacheMs ?? 0;

  if (cacheMs > 0) {
    const cached = responseCache.get(requestKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
    if (cached && cached.expiresAt <= Date.now()) {
      responseCache.delete(requestKey);
    }
  }

  if (options?.dedupeInFlight) {
    const inFlight = inFlightRequests.get(requestKey);
    if (inFlight) {
      return inFlight as Promise<T>;
    }
  }

  const requestPromise = (async () => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(buildApiUrl(endpoint), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
        if (!response.ok || !body?.success) {
          const status = response.status || 500;
          const mappedMessage = mapOstiumErrorToMessage(status, body?.error || null);
          const error = new OstiumApiError(mappedMessage, {
            code: body?.error?.code,
            status,
            retryable: body?.error?.retryable,
            details: body?.error?.details,
          });

          if (shouldRetry(status, body?.error?.retryable, attempt, maxRetries)) {
            await sleep(baseDelay * (attempt + 1));
            continue;
          }
          throw error;
        }

        return body.data as T;
      } catch (error) {
        if (error instanceof OstiumApiError) {
          throw error;
        }

        const retryableError = new OstiumApiError(
          "Ostium request failed due to network error. Retry shortly.",
          {
            code: "OSTIUM_NETWORK_ERROR",
            status: 503,
            retryable: true,
            details: error instanceof Error ? { message: error.message } : error,
          },
        );

        if (shouldRetry(null, true, attempt, maxRetries)) {
          await sleep(baseDelay * (attempt + 1));
          continue;
        }
        throw retryableError;
      }
    }

    throw new OstiumApiError("Ostium request failed after retries.", {
      code: "OSTIUM_RETRY_EXHAUSTED",
      status: 503,
      retryable: true,
    });
  })();

  if (options?.dedupeInFlight) {
    inFlightRequests.set(requestKey, requestPromise);
  }

  try {
    const data = await requestPromise;
    if (cacheMs > 0) {
      responseCache.set(requestKey, {
        expiresAt: Date.now() + cacheMs,
        data,
      });
    }
    return data;
  } finally {
    if (options?.dedupeInFlight) {
      inFlightRequests.delete(requestKey);
    }
  }
}
