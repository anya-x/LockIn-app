package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.exception.RateLimitExceededException;
import com.lockin.lockin_app.repository.AIUsageRepository;
import com.lockin.lockin_app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

        LocalDateTime since = LocalDateTime.now().minusHours(1);
        long requestCount = aiUsageRepository.countRecentRequests(user, since);

        log.debug("User {} has made {} AI requests recently", userId, requestCount);

        if (requestCount >= MAX_REQUESTS_PER_DAY) {
            log.warn("Rate limit exceeded for user {}: {} requests", userId, requestCount);
            throw new RateLimitExceededException(
                    String.format("Rate limit exceeded. You can only make %d AI requests per day. Please try again later.",
                                  MAX_REQUESTS_PER_DAY)
            );
        }
    }

    public int getRemainingRequests(Long userId) {
        User user = userRepository.findById(userId)
                                  .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime since = LocalDateTime.now().minusHours(1);
        long requestCount = aiUsageRepository.countRecentRequests(user, since);

        return Math.max(0, MAX_REQUESTS_PER_DAY - (int) requestCount);
    }

}