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
    staleTime: 3600000,
  });
}

export function useRefreshAnalytics() {
  const queryClient = useQueryClient();

  return async () => {
    await analyticsService.refreshCache();
    await queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };
}

export function useComparisonAnalytics(
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [
      "analytics",
      "compare",
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    ],
    queryFn: () =>
      analyticsService.comparePeriods({
        currentStart,
        currentEnd,
        previousStart,
        previousEnd,
      }),
    enabled,
    staleTime: 3600000,
  });
}
