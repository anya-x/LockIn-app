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
    staleTime: 0, // Always consider data stale to allow immediate refetch
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

export function useAnalyticsRange(days: number = 7) {
  return useQuery({
    queryKey: ["analytics", "range", days],
    queryFn: () => analyticsService.getAnalyticsRange(days),
    staleTime: 0, // Always consider data stale to allow immediate refetch
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

export function useRefreshAnalytics() {
  const queryClient = useQueryClient();

  return async () => {
    // Invalidate and refetch all analytics queries
    await queryClient.invalidateQueries({
      queryKey: ["analytics"],
      refetchType: "active"
    });
    // Force immediate refetch of active queries
    await queryClient.refetchQueries({
      queryKey: ["analytics"],
      type: "active"
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
    staleTime: 0, // Always consider data stale to allow immediate refetch
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}
