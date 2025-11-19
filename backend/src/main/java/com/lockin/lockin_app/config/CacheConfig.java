package com.lockin.lockin_app.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();

        cacheManager.setCaches(Arrays.asList(
                // AI Service Caches
                // Task breakdowns: 1 hour TTL, 500 entries
                new CaffeineCache("taskBreakdowns",
                        Caffeine.newBuilder()
                                .maximumSize(500)
                                .expireAfterWrite(1, TimeUnit.HOURS)
                                .recordStats()
                                .build()),

                // Daily briefings: 24 hour TTL, 100 entries
                new CaffeineCache("dailyBriefings",
                        Caffeine.newBuilder()
                                .maximumSize(100)
                                .expireAfterWrite(24, TimeUnit.HOURS)
                                .recordStats()
                                .build()),

                // Enhanced descriptions: 1 hour TTL, 500 entries
                new CaffeineCache("enhancedDescriptions",
                        Caffeine.newBuilder()
                                .maximumSize(500)
                                .expireAfterWrite(1, TimeUnit.HOURS)
                                .recordStats()
                                .build()),

                // Analytics Caches
                // Daily analytics: 6 hour TTL, 1000 entries (userId_date key)
                // Analytics don't change frequently, can cache longer
                new CaffeineCache("dailyAnalytics",
                        Caffeine.newBuilder()
                                .maximumSize(1000)
                                .expireAfterWrite(6, TimeUnit.HOURS)
                                .recordStats()
                                .build()),

                // Period analytics: 1 hour TTL, 500 entries (userId_startDate_endDate key)
                // Aggregated stats, refresh more frequently
                new CaffeineCache("periodAnalytics",
                        Caffeine.newBuilder()
                                .maximumSize(500)
                                .expireAfterWrite(1, TimeUnit.HOURS)
                                .recordStats()
                                .build()),

                // Rate Limit Counters: 5 min TTL, 1000 entries (userId key)
                // Caches the request count to reduce database queries
                new CaffeineCache("rateLimitCounters",
                        Caffeine.newBuilder()
                                .maximumSize(1000)
                                .expireAfterWrite(5, TimeUnit.MINUTES)
                                .recordStats()
                                .build())
        ));

        return cacheManager;
    }
}
