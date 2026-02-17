export type TimeBlockRecurrenceType = "NONE" | "INTERVAL" | "CRON";

export type TimeBlockStatus =
  | "PENDING"
  | "SCHEDULED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface TimeBlockRecurrence {
  type: TimeBlockRecurrenceType;
  intervalSeconds?: number | null;
  cronExpression?: string | null;
}

export interface TimeBlockStopConditions {
  untilAt?: string | null;
  maxRuns?: number | null;
}

export interface TimeBlockSchedule {
  id: string;
  workflowId: string;
  runAt: string;
  timezone?: string | null;
  recurrence: TimeBlockRecurrence;
  stopConditions?: TimeBlockStopConditions | null;
  status: TimeBlockStatus;
  runCount?: number;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeBlockListResponse {
  success: boolean;
  data: TimeBlockSchedule[];
  meta: {
    timestamp: string;
    total: number;
    limit: number;
    offset: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export interface TimeBlockDetailResponse {
  success: boolean;
  data: TimeBlockSchedule;
  meta: {
    timestamp: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

