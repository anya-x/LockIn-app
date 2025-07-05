import { useQuery, useQueryClient } from "@tanstack/react-query";
import { analyticsService, type Analytics } from "../services/analyticsService";

export function useTodayAnalytics() {
  return useQuery({
    queryKey: ["analytics", "today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      await analyticsService.calculateForDate(today);

      return await analyticsService.getTodayAnalytics();
    },
    staleTime: 3600000,
  });
}

export function useAnalyticsRange(days: number = 7) {
  return useQuery({
    queryKey: ["analytics", "range", days],
    queryFn: () => analyticsService.getAnalyticsRange(days),
    staleTime: Infinity,
  });
}

export function useRefreshAnalytics() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };
}
