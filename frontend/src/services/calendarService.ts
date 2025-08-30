import api from "./api";

export interface CalendarStatus {
  connected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  tokenExpiresAt?: string;
  isExpired?: boolean;
  message?: string;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  tasksCreated: number;
  error?: string;
}

export const calendarService = {
  getStatus: async (): Promise<CalendarStatus> => {
    const response = await api.get<CalendarStatus>("/calendar/status");
    return response.data;
  },
  getConnectUrl: async (): Promise<{ authorizationUrl: string }> => {
    const response = await api.get<{ authorizationUrl: string }>(
      "/calendar/connect"
    );
    return response.data;
  },
  syncNow: async (): Promise<SyncResult> => {
    const response = await api.post<SyncResult>("/calendar/sync-now");
    return response.data;
  },
  disconnect: async (): Promise<{ disconnected: boolean }> => {
    const response = await api.delete<{ disconnected: boolean }>(
      "/calendar/disconnect"
    );
    return response.data;
  },
};

export default calendarService;
