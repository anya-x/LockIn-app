import { useQuery, useQueryClient } from "@tanstack/react-query";
import { analyticsService, type Analytics, type ComparisonData } from "../services/analyticsService";

export function useTodayAnalytics() {
  return useQuery({
    queryKey: ["analytics", "today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      await analyticsService.calculateForDate(today);

      return await analyticsService.getTodayAnalytics();
    },
    staleTime: 60000, // 1 minute - balance between freshness and avoiding unnecessary calls
  });
}

export function useAnalyticsRange(days: number = 7) {
  return useQuery({
    queryKey: ["analytics", "range", days],
    queryFn: () => analyticsService.getAnalyticsRange(days),
    staleTime: 60000, // 1 minute - balance between freshness and avoiding unnecessary calls
  });
}

export function useRefreshAnalytics() {
  const queryClient = useQueryClient();

  return async () => {
    // Force refetch all analytics queries, bypassing staleTime
    await queryClient.refetchQueries({
      queryKey: ["analytics"],
    });
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
    queryKey: ["analytics", "compare", currentStart, currentEnd, previousStart, previousEnd],
    queryFn: () => analyticsService.comparePeriods({
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    }),
    enabled,
    staleTime: 60000, // 1 minute - balance between freshness and avoiding unnecessary calls
  });
}
