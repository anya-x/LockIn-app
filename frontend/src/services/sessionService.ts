import api from "./api";

export interface StartSessionRequest {
  plannedMinutes: number;
  sessionType: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  taskId?: number | null;
  profileName?: string;
  breakMinutes?: number;
}

export interface FocusSessionResponse {
  id: number;
  plannedMinutes: number;
  actualMinutes: number | null;
  startedAt: string;
  completedAt: string | null;
  sessionType: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  completed: boolean;
  notes: string | null;
  userId: number;
  userFirstName: string;
  userLastName: string;
  taskId: number | null;
  taskTitle: string | null;
  profileName?: string;
  breakMinutes?: number;
}

export interface TodayStatsResponse {
  totalMinutes: number;
  sessionsCompleted: number;
}

export const sessionService = {
  startSession: async (
    request: StartSessionRequest
  ): Promise<FocusSessionResponse> => {
    const response = await api.post<FocusSessionResponse>(
      "/sessions/start",
      request
    );
    return response.data;
  },

  completeSession: async (
    sessionId: number,
    actualMinutes: number
  ): Promise<FocusSessionResponse> => {
    const response = await api.post<FocusSessionResponse>(
      `/sessions/${sessionId}/complete`,
      { actualMinutes }
    );
    return response.data;
  },

  getUserSessions: async (): Promise<FocusSessionResponse[]> => {
    const response = await api.get<FocusSessionResponse[]>("/sessions");
    return response.data;
  },

  getTodayStats: async (): Promise<TodayStatsResponse> => {
    const response = await api.get<TodayStatsResponse>("/sessions/today");
    return response.data;
  },

  updateSessionNotes: async (
    sessionId: number,
    notes: string
  ): Promise<FocusSessionResponse> => {
    const response = await api.put<FocusSessionResponse>(
      `/sessions/${sessionId}/notes`,
      { notes }
    );
    return response.data;
  },
};
