import { api } from "@/lib/api-client";
import type { ApiError } from "@/utils/workflow-api";
import type {
  TimeBlockDetailResponse,
  TimeBlockListResponse,
  TimeBlockRecurrence,
  TimeBlockSchedule,
  TimeBlockStatus,
} from "@/types/time-block";

export interface CreateTimeBlockPayload {
  workflowId: string;
  runAt: string;
  timezone?: string;
  recurrence: TimeBlockRecurrence;
  stopConditions?: {
    untilAt?: string;
    maxRuns?: number;
  };
}

export interface ListTimeBlocksParams {
  accessToken: string;
  status?: TimeBlockStatus | "ALL";
  limit?: number;
  offset?: number;
}

export interface GetTimeBlockParams {
  accessToken: string;
  id: string;
}

export interface CancelTimeBlockParams {
  accessToken: string;
  id: string;
}

export async function createTimeBlockSchedule(params: {
  accessToken: string;
  payload: CreateTimeBlockPayload;
}): Promise<{
  success: boolean;
  data?: TimeBlockSchedule;
  error?: ApiError;
  requestId?: string;
}> {
  const response = await api.post<TimeBlockDetailResponse>(
    "/api/v1/time-blocks",
    params.payload,
    { accessToken: params.accessToken },
  );

  if (!response.ok) {
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data,
    requestId: response.requestId,
  };
}

export async function listTimeBlockSchedules(
  params: ListTimeBlocksParams,
): Promise<{
  success: boolean;
  data?: TimeBlockSchedule[];
  total?: number;
  error?: ApiError;
  requestId?: string;
}> {
  const queryParams = new URLSearchParams();
  if (params.status && params.status !== "ALL") {
    queryParams.set("status", params.status);
  }
  if (params.limit) queryParams.set("limit", params.limit.toString());
  if (params.offset) queryParams.set("offset", params.offset.toString());

  const queryString = queryParams.toString();
  const url = `/api/v1/time-blocks${queryString ? `?${queryString}` : ""}`;

  const response = await api.get<TimeBlockListResponse>(url, {
    accessToken: params.accessToken,
  });

  if (!response.ok) {
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data || [],
    total: response.data?.meta?.total || 0,
    requestId: response.requestId,
  };
}

export async function getTimeBlockSchedule(
  params: GetTimeBlockParams,
): Promise<{
  success: boolean;
  data?: TimeBlockSchedule;
  error?: ApiError;
  requestId?: string;
}> {
  const response = await api.get<TimeBlockDetailResponse>(
    `/api/v1/time-blocks/${params.id}`,
    { accessToken: params.accessToken },
  );

  if (!response.ok) {
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    data: response.data?.data,
    requestId: response.requestId,
  };
}

export async function cancelTimeBlockSchedule(
  params: CancelTimeBlockParams,
): Promise<{
  success: boolean;
  error?: ApiError;
  requestId?: string;
}> {
  const response = await api.post<{ success: boolean }>(
    `/api/v1/time-blocks/${params.id}/cancel`,
    {},
    { accessToken: params.accessToken },
  );

  if (!response.ok) {
    return {
      success: false,
      error: response.error as ApiError,
      requestId: response.requestId,
    };
  }

  return {
    success: true,
    requestId: response.requestId,
  };
}

