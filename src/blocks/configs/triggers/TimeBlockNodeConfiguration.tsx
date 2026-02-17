import { useMemo, useState } from "react";
import type { NodeConfigurationProps } from "@/blocks/types";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { formatTimeBlockSummary } from "@/utils/time-blocks";

type RecurrenceType = "NONE" | "INTERVAL" | "CRON";

interface FieldErrors {
  runAt?: string;
  intervalValue?: string;
  cronExpression?: string;
  maxRuns?: string;
}

export function TimeBlockNodeConfiguration({
  nodeData,
  handleDataChange,
}: NodeConfigurationProps) {
  const { error, success } = useToast();

  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    (nodeData.recurrenceType as RecurrenceType) || "NONE",
  );
  const [intervalUnit, setIntervalUnit] = useState<"minutes" | "hours">(
    (nodeData.intervalUnit as "minutes" | "hours") || "minutes",
  );

  const [errors, setErrors] = useState<FieldErrors>({});

  const runAtIso = (nodeData.runAt as string) || "";
  const timezone = (nodeData.timezone as string) || "";
  const intervalSeconds = (nodeData.intervalSeconds as number | undefined) ?? 0;
  const cronExpression = (nodeData.cronExpression as string) || "";
  const untilAt = (nodeData.untilAt as string) || "";
  const maxRuns = nodeData.maxRuns as number | undefined;

  const intervalValue = useMemo(() => {
    if (!intervalSeconds) return "";
    if (intervalUnit === "hours") {
      return String(Math.round(intervalSeconds / 3600));
    }
    return String(Math.round(intervalSeconds / 60));
  }, [intervalSeconds, intervalUnit]);

  const runAtLocalValue = useMemo(() => {
    if (!runAtIso) return "";
    try {
      const date = new Date(runAtIso);
      if (Number.isNaN(date.getTime())) return "";
      return date.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  }, [runAtIso]);

  const untilAtLocalValue = useMemo(() => {
    if (!untilAt) return "";
    try {
      const date = new Date(untilAt);
      if (Number.isNaN(date.getTime())) return "";
      return date.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  }, [untilAt]);

  const validateCronExpression = (value: string): string | undefined => {
    if (!value) return "Cron expression is required for CRON recurrence";
    const cronRegex =
      /^([*0-9/,\-]+)\s+([*0-9/,\-]+)\s+([*0-9/,\-]+)\s+([*0-9/,\-]+)\s+([*0-9/,\-]+)$/;
    if (!cronRegex.test(value.trim())) {
      return "Cron expression must have 5 space-separated fields";
    }
    return undefined;
  };

  const handleSubmit = () => {
    const nextErrors: FieldErrors = {};

    if (!runAtIso) {
      nextErrors.runAt = "Run at time is required";
    }

    if (recurrenceType === "INTERVAL") {
      const valueNum = Number(intervalValue);
      if (!intervalValue || Number.isNaN(valueNum) || valueNum <= 0) {
        nextErrors.intervalValue = "Interval must be a positive number";
      }
    }

    if (recurrenceType === "CRON") {
      const cronError = validateCronExpression(cronExpression);
      if (cronError) {
        nextErrors.cronExpression = cronError;
      }
    }

    if (maxRuns !== undefined && maxRuns !== null) {
      if (!Number.isInteger(maxRuns) || maxRuns <= 0) {
        nextErrors.maxRuns = "Max runs must be a positive integer";
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      error("Invalid schedule configuration", "Please fix the highlighted fields.");
      return;
    }

    let nextIntervalSeconds: number | undefined;
    if (recurrenceType === "INTERVAL") {
      const valueNum = Number(intervalValue);
      nextIntervalSeconds =
        intervalUnit === "hours" ? valueNum * 3600 : valueNum * 60;
    }

    const updates = {
      runAt: runAtIso,
      timezone,
      recurrenceType,
      intervalUnit,
      intervalSeconds: nextIntervalSeconds,
      cronExpression: recurrenceType === "CRON" ? cronExpression : "",
      untilAt,
      maxRuns,
    };

    handleDataChange(updates);
    success("Schedule updated", "Time Block configuration saved on this workflow.");
  };

  const summary = useMemo(
    () =>
      formatTimeBlockSummary({
        runAt: runAtIso,
        timezone,
        recurrenceType,
        intervalSeconds,
        cronExpression,
        untilAt,
        maxRuns,
      }),
    [runAtIso, timezone, recurrenceType, intervalSeconds, cronExpression, untilAt, maxRuns],
  );

  return (
    <div className="p-4 space-y-6">
      <div>
        <Typography variant="h4" className="mb-1">
          Schedule
        </Typography>
        <Typography variant="caption" className="text-muted-foreground">
          Configure when this workflow should run and optionally make it recurring.
        </Typography>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-white/80">
            Run at (UTC) <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
            value={runAtLocalValue}
            onChange={(e) => {
              const value = e.target.value;
              setErrors((prev) => ({ ...prev, runAt: undefined }));
              if (!value) {
                handleDataChange({ runAt: "" });
                return;
              }
              const date = new Date(value);
              if (Number.isNaN(date.getTime())) {
                handleDataChange({ runAt: "" });
                return;
              }
              handleDataChange({ runAt: date.toISOString() });
            }}
          />
          {errors.runAt && (
            <p className="text-xs text-red-400 mt-1">{errors.runAt}</p>
          )}
          <p className="text-[11px] text-white/40">
            Stored as an ISO 8601 timestamp in UTC.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-white/80">
            Timezone (IANA, optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Asia/Kolkata, America/New_York"
            className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
            value={timezone}
            onChange={(e) => handleDataChange({ timezone: e.target.value })}
          />
          <p className="text-[11px] text-white/40">
            Used for display and cron expectations. Leave blank to assume UTC.
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="block text-xs font-medium text-white/80">
            Recurrence
          </label>
          <div className="flex gap-2">
            {(["NONE", "INTERVAL", "CRON"] as RecurrenceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setRecurrenceType(type);
                  setErrors((prev) => ({
                    ...prev,
                    intervalValue: undefined,
                    cronExpression: undefined,
                  }));
                }}
                className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  recurrenceType === type
                    ? "border-amber-500/70 bg-amber-500/10 text-amber-200"
                    : "border-white/20 bg-transparent text-white/70 hover:border-amber-500/60 hover:bg-amber-500/5"
                }`}
              >
                {type === "NONE"
                  ? "One-time"
                  : type === "INTERVAL"
                    ? "Interval"
                    : "Cron"}
              </button>
            ))}
          </div>

          {recurrenceType === "INTERVAL" && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  className="w-24 rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                  value={intervalValue}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, intervalValue: undefined }));
                    handleDataChange({
                      intervalSeconds:
                        intervalUnit === "hours"
                          ? Number(e.target.value || 0) * 3600
                          : Number(e.target.value || 0) * 60,
                    });
                  }}
                />
                <select
                  className="flex-1 rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                  value={intervalUnit}
                  onChange={(e) => {
                    const nextUnit = e.target.value as "minutes" | "hours";
                    setIntervalUnit(nextUnit);
                  }}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
              {errors.intervalValue && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.intervalValue}
                </p>
              )}
              <p className="text-[11px] text-white/40">
                Converted to an integer interval in seconds for the API.
              </p>
            </div>
          )}

          {recurrenceType === "CRON" && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                placeholder="e.g. 0 9 * * * (daily at 09:00)"
                className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                value={cronExpression}
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, cronExpression: undefined }));
                  handleDataChange({ cronExpression: e.target.value });
                }}
              />
              {errors.cronExpression && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.cronExpression}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-white/20 px-3 py-1 text-[11px] text-white/80 hover:border-amber-500/60 hover:bg-amber-500/5"
                  onClick={() =>
                    handleDataChange({ cronExpression: "0 9 * * *" })
                  }
                >
                  Daily 09:00
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/20 px-3 py-1 text-[11px] text-white/80 hover:border-amber-500/60 hover:bg-amber-500/5"
                  onClick={() =>
                    handleDataChange({ cronExpression: "0 9 * * 1" })
                  }
                >
                  Weekly Mon 09:00
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/20 px-3 py-1 text-[11px] text-white/80 hover:border-amber-500/60 hover:bg-amber-500/5"
                  onClick={() =>
                    handleDataChange({ cronExpression: "0 9 1 * *" })
                  }
                >
                  Monthly 1st 09:00
                </button>
              </div>
              <p className="text-[11px] text-white/40">
                Basic 5-field cron format: minute hour day-of-month month
                day-of-week.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="block text-xs font-medium text-white/80">
            Stop conditions (optional)
          </label>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-white/70">
                Until date/time
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                value={untilAtLocalValue}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    handleDataChange({ untilAt: "" });
                    return;
                  }
                  const date = new Date(value);
                  if (Number.isNaN(date.getTime())) {
                    handleDataChange({ untilAt: "" });
                    return;
                  }
                  handleDataChange({ untilAt: date.toISOString() });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-white/70">
                Max runs
              </label>
              <input
                type="number"
                min={1}
                className="w-32 rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
                value={maxRuns ?? ""}
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, maxRuns: undefined }));
                  const value = e.target.value;
                  if (!value) {
                    handleDataChange({ maxRuns: undefined });
                    return;
                  }
                  handleDataChange({ maxRuns: Number(value) });
                }}
              />
              {errors.maxRuns && (
                <p className="text-xs text-red-400 mt-1">{errors.maxRuns}</p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-white/40">
            Stop the schedule after a specific date/time, a maximum number of
            runs, or both.
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t border-white/10">
          <Typography variant="caption" className="text-white/70">
            Schedule summary
          </Typography>
          <div className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/80">
            {summary}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-white/10 flex justify-end">
        <Button type="button" onClick={handleSubmit}>
          Save Schedule
        </Button>
      </div>
    </div>
  );
}

export default TimeBlockNodeConfiguration;

