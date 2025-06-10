import { useState, useEffect, useCallback } from "react";
import {
  sessionService,
  type FocusSessionResponse,
} from "../services/sessionService";

export const useSessionHistory = () => {
  const [sessions, setSessions] = useState<FocusSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionService.getUserSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const refreshSessions = useCallback(() => {
    return fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    refreshSessions,
  };
};
