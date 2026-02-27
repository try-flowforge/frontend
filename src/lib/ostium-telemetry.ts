type OstiumTelemetryEvent =
  | "ostium_panel_opened"
  | "ostium_panel_refreshed"
  | "ostium_setup_page_opened"
  | "ostium_setup_refreshed"
  | "ostium_delegation_approve_started"
  | "ostium_delegation_approve_succeeded"
  | "ostium_delegation_approve_failed"
  | "ostium_delegation_revoke_started"
  | "ostium_delegation_revoke_succeeded"
  | "ostium_delegation_revoke_failed"
  | "ostium_allowance_started"
  | "ostium_allowance_succeeded"
  | "ostium_allowance_failed";

interface OstiumTelemetryPayload {
  network?: string;
  action?: string;
  error?: string;
}

export function emitOstiumTelemetry(
  event: OstiumTelemetryEvent,
  payload: OstiumTelemetryPayload = {},
): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("flowforge:ostium-telemetry", { detail: { event, ...payload } }));
  }

  if (process.env.NODE_ENV !== "production") {
    // Keep this lightweight until analytics sink is wired.
    console.info("[ostium-telemetry]", event, payload);
  }
}
