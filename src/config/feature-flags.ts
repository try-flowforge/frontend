function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export const FEATURE_FLAGS = {
  OSTIUM_MINIMAL_PANEL: parseBoolean(process.env.NEXT_PUBLIC_OSTIUM_MINIMAL_PANEL, true),
  OSTIUM_SETUP_PAGE_ENABLED: parseBoolean(process.env.NEXT_PUBLIC_OSTIUM_SETUP_PAGE_ENABLED, true),
  OSTIUM_SETUP_AUTO_REFRESH_ENABLED: parseBoolean(
    process.env.NEXT_PUBLIC_OSTIUM_SETUP_AUTO_REFRESH_ENABLED,
    true,
  ),
  OSTIUM_SETUP_AUTO_REFRESH_MS: parseNumber(
    process.env.NEXT_PUBLIC_OSTIUM_SETUP_AUTO_REFRESH_MS,
    30000,
  ),
  OSTIUM_SETUP_FETCH_COOLDOWN_MS: parseNumber(
    process.env.NEXT_PUBLIC_OSTIUM_SETUP_FETCH_COOLDOWN_MS,
    12000,
  ),
} as const;
