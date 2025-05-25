import api from "./api";

export interface FocusSession {
  id: number;
  plannedMinutes: number;
  actualMinutes: number;
  startedAt: string;
  completedAt: string | null;
  sessionType: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  completed: boolean;
  notes: string | null;
}

export interface StartSessionRequest {
  minutes: number;
  sessionType: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  taskId?: number;
}

export interface SessionStats {
  totalMinutes: number;
  sessionsCompleted: number;
}

export const sessionService = {
  startSession: async (request: StartSessionRequest): Promise<FocusSession> => {
    const response = await api.post("/sessions/start", request);
    return response.data;
  },

  completeSession: async (
    sessionId: number,
    actualMinutes: number
  ): Promise<FocusSession> => {
    const response = await api.post(`/sessions/${sessionId}/complete`, {
      actualMinutes,
    });
    return response.data;
  },

  getTodayStats: async (): Promise<SessionStats> => {
    const response = await api.get("/sessions/today");
    return response.data;
  },

  getAllSessions: async (): Promise<FocusSession[]> => {
    const response = await api.get("/sessions");
    return response.data;
  },
};
