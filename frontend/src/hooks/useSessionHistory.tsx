import { useQuery } from "@tanstack/react-query";
import {
  sessionService,
  type FocusSessionResponse,
} from "../services/sessionService";

export const useSessionHistory = () => {
  const {
    data: sessions = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      return await sessionService.getUserSessions();
    },
    staleTime: Infinity,
  });

  return {
    sessions,
    loading,
    error: error ? "Failed to load sessions" : null,
    refreshSessions: refetch,
  };
};
