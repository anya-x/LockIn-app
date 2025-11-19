package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.AIUsageRepository;
import com.lockin.lockin_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for enforcing rate limits on AI features.
 *
 * Limits are configurable via application.properties:
 * - ai.requests.per-user-per-day (default: 10)
 *
 * TODO: Make limits configurable per user tier
 * TODO: Add Redis caching for rate limit checks
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final AIUsageRepository aiUsageRepository;
    private final UserRepository userRepository;

    @Value("${ai.requests.per-user-per-day:10}")
    private int maxRequestsPerDay;

    /**
     * Check if user has exceeded their rate limit.
     *
     * @param userId User ID to check
     * @throws RateLimitExceededException if limit exceeded
     */
    public void checkRateLimit(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check requests in last 24 hours
        LocalDateTime since = LocalDateTime.now().minusDays(1);
        long requestCount = aiUsageRepository.countRecentRequests(user, since);

        log.debug("User {} has made {} AI requests recently (limit: {})", userId, requestCount, maxRequestsPerDay);

        if (requestCount >= maxRequestsPerDay) {
            log.warn("Rate limit exceeded for user {}: {} requests (limit: {})", userId, requestCount, maxRequestsPerDay);
            throw new RateLimitExceededException(
                    String.format("Rate limit exceeded. You can make %d AI requests per day. Please try again later.",
                            maxRequestsPerDay)
            );
        }
    }

    /**
     * Get remaining requests for a user.
     *
     * @param userId User ID
     * @return Number of requests remaining in current period
     */
    public int getRemainingRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime since = LocalDateTime.now().minusDays(1);
        long requestCount = aiUsageRepository.countRecentRequests(user, since);

        return Math.max(0, maxRequestsPerDay - (int) requestCount);
    }

    /**
     * Exception thrown when rate limit is exceeded.
     */
    public static class RateLimitExceededException extends RuntimeException {
        public RateLimitExceededException(String message) {
            super(message);
        }
    }
}
