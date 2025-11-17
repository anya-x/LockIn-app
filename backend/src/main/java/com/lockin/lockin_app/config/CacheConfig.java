package com.lockin.lockin_app.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

/**
 * Cache configuration for analytics endpoints
 *
 * <p>Caching strategy: - Daily analytics: 5 minutes - Period analytics: 1 hour - Insights: 1 hour
 *
 * <p>Reduces database load for frequently accessed data
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();
        cacheManager.setCaches(
                Arrays.asList(
                        new ConcurrentMapCache("dailyAnalytics"),
                        new ConcurrentMapCache("periodAnalytics"),
                        new ConcurrentMapCache("insights")));
        return cacheManager;
    }
}
