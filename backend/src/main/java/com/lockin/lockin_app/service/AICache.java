package com.lockin.lockin_app.service;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory cache for AI responses.
 *
 * LIMITATIONS:
 * - Not distributed (single server only)
 * - Lost on restart
 * - No size limit (could cause memory issues)
 *
 * TODO: Replace with Redis for production
 */
@Slf4j
@Component
public class AICache {

    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private static final long TTL_HOURS = 24;

    /**
     * Get cached response if available and not expired.
     */
    public <T> T get(String key, Class<T> type) {
        CacheEntry entry = cache.get(key);

        if (entry == null) {
            log.debug("Cache MISS: {}", key);
            return null;
        }

        // Check if expired
        if (entry.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.debug("Cache EXPIRED: {}", key);
            cache.remove(key);
            return null;
        }

        log.info("Cache HIT: {} (age: {}h)",
            key,
            Duration.between(entry.getCreatedAt(), LocalDateTime.now()).toHours());

        return type.cast(entry.getValue());
    }

    /**
     * Store value in cache.
     */
    public <T> void put(String key, T value) {
        CacheEntry entry = new CacheEntry();
        entry.setValue(value);
        entry.setCreatedAt(LocalDateTime.now());
        entry.setExpiresAt(LocalDateTime.now().plusHours(TTL_HOURS));

        cache.put(key, entry);

        log.info("Cache PUT: {} (size: {})", key, cache.size());
    }

    /**
     * Clear all cache entries (for testing).
     */
    public void clear() {
        cache.clear();
        log.info("Cache cleared");
    }

    /**
     * Remove expired entries (cleanup).
     */
    public void removeExpired() {
        LocalDateTime now = LocalDateTime.now();
        cache.entrySet().removeIf(entry ->
            entry.getValue().getExpiresAt().isBefore(now)
        );
        log.info("Removed expired cache entries (size: {})", cache.size());
    }

    @Data
    private static class CacheEntry {
        private Object value;
        private LocalDateTime createdAt;
        private LocalDateTime expiresAt;
    }
}
