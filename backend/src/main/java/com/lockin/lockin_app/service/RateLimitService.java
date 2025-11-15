package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.AIUsageRepository;
import com.lockin.lockin_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for rate limiting AI features.
 *
 * Limit: 10 requests per day per user (configurable)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final AIUsageRepository aiUsageRepository;
    private final UserRepository userRepository;

    private static final int DAILY_LIMIT = 10;

    /**
     * Check if user has exceeded rate limit.
     *
     * @return true if user can make request, false if limit exceeded
     */
    public boolean canMakeRequest(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Count requests in last 24 hours
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long recentRequests = aiUsageRepository.countRecentRequests(user, since);

        boolean canRequest = recentRequests < DAILY_LIMIT;

        if (!canRequest) {
            log.warn("User {} exceeded rate limit: {} requests in 24h",
                userId, recentRequests);
        }

        return canRequest;
    }

    /**
     * Get remaining requests for user.
     */
    public int getRemainingRequests(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long recentRequests = aiUsageRepository.countRecentRequests(user, since);

        return Math.max(0, DAILY_LIMIT - (int) recentRequests);
    }
}
