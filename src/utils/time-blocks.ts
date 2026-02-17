import type { TimeBlockSchedule } from "@/types/time-block";

interface SummaryInput {
  runAt: string;
  timezone?: string;
  recurrenceType?: string;
  intervalSeconds?: number;
  cronExpression?: string;
  untilAt?: string;
  maxRuns?: number;
}

function formatDateTimeShort(iso: string | undefined, timezone?: string) {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    const base = date.toISOString().replace(".000Z", "Z");
    if (!timezone) {
      return base;
    }
    return `${base} (${timezone})`;
  } catch {
    return "";
  }
}

export function formatTimeBlockSummary(input: SummaryInput): string {
  const {
    runAt,
    timezone,
    recurrenceType = "NONE",
    intervalSeconds,
    cronExpression,
    untilAt,
    maxRuns,
  } = input;

  const runAtPart = runAt
    ? `Runs at ${formatDateTimeShort(runAt, timezone) || runAt}`
    : "Run time not configured";

  let recurrencePart = "";
  if (recurrenceType === "INTERVAL" && intervalSeconds && intervalSeconds > 0) {
    const minutes = intervalSeconds / 60;
    if (minutes % 60 === 0) {
      const hours = minutes / 60;
      recurrencePart = `Every ${hours}h`;
    } else {
      recurrencePart = `Every ${minutes}m`;
    }
  } else if (recurrenceType === "CRON" && cronExpression) {
    recurrencePart = `Cron: ${cronExpression}${timezone ? ` (${timezone})` : ""}`;
  } else if (recurrenceType === "NONE") {
    recurrencePart = "One-time";
  }

  const stopParts: string[] = [];
  if (untilAt) {
    const formatted = formatDateTimeShort(untilAt, timezone) || untilAt;
    stopParts.push(`until ${formatted}`);
  }
  if (typeof maxRuns === "number" && maxRuns > 0) {
    stopParts.push(`max ${maxRuns} runs`);
  }

  const stopPart = stopParts.length > 0 ? stopParts.join(", ") : "";

  if (!recurrencePart && !stopPart) {
    return runAtPart;
  }

  if (!stopPart) {
    return `${runAtPart} • ${recurrencePart}`;
  }

  return `${runAtPart} • ${recurrencePart} • ${stopPart}`;
}

export function formatTimeBlockScheduleLabel(schedule: TimeBlockSchedule): string {
  return formatTimeBlockSummary({
    runAt: schedule.runAt,
    timezone: schedule.timezone || undefined,
    recurrenceType: schedule.recurrence?.type,
    intervalSeconds: schedule.recurrence?.intervalSeconds || undefined,
    cronExpression: schedule.recurrence?.cronExpression || undefined,
    untilAt: schedule.stopConditions?.untilAt || undefined,
    maxRuns: schedule.stopConditions?.maxRuns || undefined,
  });
}

