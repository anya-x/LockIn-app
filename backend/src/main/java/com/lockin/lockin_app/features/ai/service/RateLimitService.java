package com.lockin.lockin_app.features.ai.service;

import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.exception.RateLimitExceededException;
import com.lockin.lockin_app.features.ai.repository.AIUsageRepository;
import com.lockin.lockin_app.features.users.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
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

    @Cacheable(value = "rateLimitCounters", key = "#userId")
    public int getRemainingRequests(Long userId) {
        User user = userRepository.findById(userId)
                                  .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long requestCount = aiUsageRepository.countRecentRequests(user, since);

        return Math.max(0, MAX_REQUESTS_PER_DAY - (int) requestCount);
    }

    public int getUsedRequests(Long userId) {
        User user = userRepository.findById(userId)
                                  .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime since = LocalDateTime.now().minusHours(24);
        return (int) aiUsageRepository.countRecentRequests(user, since);
    }

    public int getMaxRequests() {
        return MAX_REQUESTS_PER_DAY;
    }

    @Transactional
    @CacheEvict(value = "rateLimitCounters", key = "#userId")
    public void resetRateLimit(Long userId) {
        User user = userRepository.findById(userId)
                                  .orElseThrow(() -> new RuntimeException("User not found"));

        aiUsageRepository.deleteByUser(user);
        log.info("Reset rate limit for user {} - all AI usage records deleted", userId);
    }

}