package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.exception.RateLimitExceededException;
import com.lockin.lockin_app.repository.AIUsageRepository;
import com.lockin.lockin_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final AIUsageRepository aiUsageRepository;
    private final UserRepository userRepository;

    private static final int MAX_REQUESTS_PER_DAY = 10;

    /**
     * Check if user has exceeded daily rate limit.
     *
     * IMPORTANT: This should be called INSIDE @Cacheable methods,
     * not in controllers, so that cache hits don't count against the limit.
     * Only actual API calls (cache misses) should be rate limited.
     */
    public void checkRateLimit(Long userId) {
        User user = userRepository.findById(userId)
                                  .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long requestCount = aiUsageRepository.countRecentRequests(user, since);

        log.debug("User {} has made {} AI requests in the last 24 hours", userId, requestCount);

        if (requestCount >= MAX_REQUESTS_PER_DAY) {
            log.warn("Rate limit exceeded for user {}: {} requests in 24 hours", userId, requestCount);
            throw new RateLimitExceededException(
                    String.format("Rate limit exceeded. You can make %d AI requests per day. Please try again tomorrow.",
                                  MAX_REQUESTS_PER_DAY)
            );
        }
    }

    /**
     * Get remaining requests for user in current 24-hour window.
     * Cached for 5 minutes to reduce database load.
     */
    @Cacheable(value = "rateLimitCounters", key = "#userId")
    public int getRemainingRequests(Long userId) {
        User user = userRepository.findById(userId)
                                  .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long requestCount = aiUsageRepository.countRecentRequests(user, since);

        return Math.max(0, MAX_REQUESTS_PER_DAY - (int) requestCount);
    }

}