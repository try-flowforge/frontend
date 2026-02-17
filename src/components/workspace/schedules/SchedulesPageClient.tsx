"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePrivyWallet } from "@/hooks/usePrivyWallet";
import {
  cancelTimeBlockSchedule,
  listTimeBlockSchedules,
} from "@/utils/time-block-api";
import type { TimeBlockSchedule, TimeBlockStatus } from "@/types/time-block";
import { useToast } from "@/context/ToastContext";
import { formatTimeBlockScheduleLabel } from "@/utils/time-blocks";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { LuClock3, LuCircleX, LuLoader, LuPlus, LuRefreshCw } from "react-icons/lu";

type StatusFilter = "ALL" | TimeBlockStatus;

export function SchedulesPageClient() {
  const { authenticated, ready, getPrivyAccessToken } = usePrivyWallet();
  const { error, success } = useToast();

  const [schedules, setSchedules] = useState<TimeBlockSchedule[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const loadSchedules = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!authenticated) return;

      if (!opts?.silent) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const accessToken = await getPrivyAccessToken();
        if (!accessToken) {
          return;
        }

        const result = await listTimeBlockSchedules({
          accessToken,
          status: statusFilter,
          limit: 50,
          offset: 0,
        });

        if (result.success) {
          setSchedules(result.data || []);
        } else if (result.error) {
          error(
            "Failed to load schedules",
            result.error.message || "An error occurred while fetching schedules.",
          );
        }
      } catch {
        error(
          "Failed to load schedules",
          "An unexpected error occurred while fetching schedules.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [authenticated, getPrivyAccessToken, statusFilter, error],
  );

  useEffect(() => {
    if (ready && authenticated) {
      void loadSchedules();
    }
  }, [ready, authenticated, loadSchedules]);

  const handleCancel = useCallback(
    async (scheduleId: string) => {
      setCancelingId(scheduleId);
      try {
        const accessToken = await getPrivyAccessToken();
        if (!accessToken) return;

        const result = await cancelTimeBlockSchedule({
          id: scheduleId,
          accessToken,
        });

        if (result.success) {
          success("Schedule cancelled", "The schedule has been cancelled.");
          setSchedules((prev) =>
            prev.map((s) =>
              s.id === scheduleId ? { ...s, status: "CANCELLED" } : s,
            ),
          );
        } else if (result.error) {
          error(
            "Failed to cancel schedule",
            result.error.message || "An error occurred while cancelling the schedule.",
          );
        }
      } catch {
        error(
          "Failed to cancel schedule",
          "An unexpected error occurred while cancelling the schedule.",
        );
      } finally {
        setCancelingId(null);
      }
    },
    [getPrivyAccessToken, error, success],
  );

  const filteredSchedules = useMemo(() => {
    if (statusFilter === "ALL") return schedules;
    return schedules.filter((s) => s.status === statusFilter);
  }, [schedules, statusFilter]);

  if (ready && !authenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <LuClock3 className="w-8 h-8 text-primary" />
          </div>
          <Typography variant="h3">Sign in to manage schedules</Typography>
          <Typography
            variant="bodySmall"
            className="text-muted-foreground max-w-md mx-auto"
          >
            Connect your wallet to view and manage Time Block schedules for your
            workflows.
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 w-full pt-28 pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <LuClock3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <Typography variant="h3">Schedules</Typography>
            <Typography variant="caption" className="text-muted-foreground">
              Manage Time Block schedules across all your workflows.
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-white/20 p-1">
            {(
              [
                "ALL",
                "SCHEDULED",
                "RUNNING",
                "COMPLETED",
                "FAILED",
                "CANCELLED",
              ] as StatusFilter[]
            ).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                  statusFilter === status
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {status === "ALL" ? "All" : status.toLowerCase()}
              </button>
            ))}
          </div>
          <Button
            type="button"
            onClick={() => loadSchedules({ silent: true })}
            className="w-9 h-9 p-0 rounded-full"
            disabled={isRefreshing || isLoading}
            aria-label="Refresh schedules"
          >
            {isRefreshing || isLoading ? (
              <LuLoader className="w-4 h-4 animate-spin" />
            ) : (
              <LuRefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button
            type="button"
            onClick={() => {
              // Placeholder for future create modal wiring
              setIsCreating(true);
              error(
                "Create schedule not wired",
                "Use a Time Block in the builder to configure schedules for now.",
              );
              setTimeout(() => setIsCreating(false), 200);
            }}
            disabled={isCreating}
          >
            <LuPlus className="w-4 h-4 mr-1" />
            New Schedule
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <LuLoader className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && filteredSchedules.length === 0 && (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="max-w-md text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/5 flex items-center justify-center">
              <LuClock3 className="w-6 h-6 text-white/70" />
            </div>
            <Typography variant="h4">No schedules</Typography>
            <Typography variant="bodySmall" className="text-muted-foreground">
              You don&apos;t have any Time Block schedules yet. Configure a Time
              Block in the automation builder, or use the API to create
              schedules.
            </Typography>
          </div>
        </div>
      )}

      {!isLoading && filteredSchedules.length > 0 && (
        <div className="space-y-3 max-w-3xl mx-auto">
          {filteredSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <Typography
                  variant="bodySmall"
                  className="text-white/90 truncate"
                >
                  {formatTimeBlockScheduleLabel(schedule)}
                </Typography>
                <Typography
                  variant="caption"
                  className="text-white/45 mt-1"
                >
                  Workflow: {schedule.workflowId} • Status:{" "}
                  {schedule.status.toLowerCase()}
                </Typography>
              </div>
              <div className="flex items-center gap-2">
                {schedule.status === "SCHEDULED" ||
                schedule.status === "RUNNING" ? (
                  <Button
                    type="button"
                    onClick={() => void handleCancel(schedule.id)}
                    disabled={cancelingId === schedule.id}
                    className="flex items-center gap-1 text-xs bg-transparent border border-white/25 rounded-full px-3 h-7 text-xs text-white/80 hover:bg-white/10"
                  >
                    {cancelingId === schedule.id ? (
                      <LuLoader className="w-3 h-3 animate-spin" />
                    ) : (
                      <LuCircleX className="w-3 h-3" />
                    )}
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SchedulesPageClient;

