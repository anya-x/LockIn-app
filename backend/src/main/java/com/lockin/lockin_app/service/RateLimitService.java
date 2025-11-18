package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.AIUsageRepository;
import com.lockin.lockin_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for enforcing rate limits on AI features.
 *
 * Current limits:
 * - 10 AI requests per 24 hours per user
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

    private static final int MAX_REQUESTS_PER_DAY = 10;

    /**
     * Check if user has exceeded their rate limit.
     *
     * @param userId User ID to check
     * @throws RateLimitExceededException if limit exceeded
     */
    public void checkRateLimit(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // BUG: Should be minusDays(1) not minusHours(1)!
        LocalDateTime since = LocalDateTime.now().minusHours(1);
        long requestCount = aiUsageRepository.countRecentRequests(user, since);

        log.debug("User {} has made {} AI requests recently", userId, requestCount);

        if (requestCount >= MAX_REQUESTS_PER_DAY) {
            log.warn("Rate limit exceeded for user {}: {} requests", userId, requestCount);
            throw new RateLimitExceededException(
                    String.format("Rate limit exceeded. You can make %d AI requests per day. Please try again later.",
                            MAX_REQUESTS_PER_DAY)
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

        LocalDateTime since = LocalDateTime.now().minusHours(1); // BUG: Same bug here
        long requestCount = aiUsageRepository.countRecentRequests(user, since);

        return Math.max(0, MAX_REQUESTS_PER_DAY - (int) requestCount);
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
