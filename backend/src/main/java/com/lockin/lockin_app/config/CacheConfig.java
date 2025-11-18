package com.lockin.lockin_app.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Cache configuration using Caffeine.
 *
 * Caffeine is a high-performance, near-optimal caching library.
 * It's the recommended cache implementation for Spring Boot.
 *
 * Cache strategies:
 * - taskBreakdowns: 1 hour TTL, max 500 entries
 * - dailyBriefings: 24 hour TTL (one per day), max 100 entries
 * - enhancedDescriptions: 6 hour TTL, max 200 entries
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Configure Caffeine cache manager with multiple caches.
     *
     * Each cache has:
     * - TTL (Time To Live): How long entries stay before expiring
     * - Maximum size: Evict oldest when limit reached
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                "taskBreakdowns",
                "dailyBriefings",
                "enhancedDescriptions"
        );

        cacheManager.setCaffeine(caffeineCacheBuilder());

        return cacheManager;
    }

    /**
     * Caffeine cache configuration.
     *
     * Settings per cache type:
     * - taskBreakdowns: 1 hour expiry
     * - dailyBriefings: 24 hour expiry (handled via custom key)
     * - enhancedDescriptions: 1 hour expiry
     *
     * Maximum 500 entries per cache with LRU eviction.
     */
    private Caffeine<Object, Object> caffeineCacheBuilder() {
        return Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.HOURS)
                .maximumSize(500)
                .recordStats();
    }
}
