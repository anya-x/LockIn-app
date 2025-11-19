import { useState, useEffect, useCallback } from "react";
import { aiService, type RateLimitStatus } from "../services/aiService";

interface UseRateLimitResult extends RateLimitStatus {
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  reset: () => Promise<void>;
  isNearLimit: boolean;
  isAtLimit: boolean;
  percentage: number;
}

export const useRateLimit = (): UseRateLimitResult => {
  const [status, setStatus] = useState<RateLimitStatus>({
    limit: 10,
    remaining: 10,
    used: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRateLimit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await aiService.getRateLimitStatus();
      setStatus(data);
    } catch (err: any) {
      console.error("Failed to fetch rate limit status:", err);
      setError(
        err.response?.data?.message || "Failed to fetch rate limit status"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const resetRateLimit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await aiService.resetRateLimit();
      setStatus(data);
    } catch (err: any) {
      console.error("Failed to reset rate limit:", err);
      setError(
        err.response?.data?.message || "Failed to reset rate limit"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRateLimit();
  }, [fetchRateLimit]);

  const percentage = Math.round((status.used / status.limit) * 100);
  const isNearLimit = status.remaining <= 3 && status.remaining > 0;
  const isAtLimit = status.remaining === 0;

  return {
    ...status,
    loading,
    error,
    refetch: fetchRateLimit,
    reset: resetRateLimit,
    isNearLimit,
    isAtLimit,
    percentage,
  };
};

export default useRateLimit;
