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
                // task breakdowns: 1 hour TTL, 500 entries
                new CaffeineCache("taskBreakdowns",
                                  Caffeine.newBuilder()
                                          .maximumSize(500)
                                          .expireAfterWrite(1, TimeUnit.HOURS)
                                          .recordStats()
                                          .build()),

                // daily briefings: 24 hour TTL, 100 entries
                new CaffeineCache("dailyBriefings",
                                  Caffeine.newBuilder()
                                          .maximumSize(100)
                                          .expireAfterWrite(24, TimeUnit.HOURS)
                                          .recordStats()
                                          .build()),

                // enhanced descriptions: 1 hour TTL, 500 entries
                new CaffeineCache("enhancedDescriptions",
                                  Caffeine.newBuilder()
                                          .maximumSize(500)
                                          .expireAfterWrite(1, TimeUnit.HOURS)
                                          .recordStats()
                                          .build()),


                new CaffeineCache("rateLimitCounters",
                                  Caffeine.newBuilder()
                                          .maximumSize(1000)
                                          .expireAfterWrite(5, TimeUnit.MINUTES)
                                          .recordStats()
                                          .build()),

                // daily analytics: 1 hour TTL, 1000 entries
                new CaffeineCache("dailyAnalytics",
                                  Caffeine.newBuilder()
                                          .maximumSize(1000)
                                          .expireAfterWrite(1, TimeUnit.HOURS)
                                          .recordStats()
                                          .build()),


                // period analytics (for comparisons): 30 minute TTL, 500 entries
                new CaffeineCache("periodAnalytics",
                                  Caffeine.newBuilder()
                                          .maximumSize(500)
                                          .expireAfterWrite(30, TimeUnit.MINUTES)
                                          .recordStats()
                                          .build()),

                // user categories: 24 hour TTL, 1000 entries
                new CaffeineCache("userCategories",
                                  Caffeine.newBuilder()
                                          .maximumSize(1000)
                                          .expireAfterWrite(24, TimeUnit.HOURS)
                                          .recordStats()
                                          .build()),

                // user goals: 24 hour TTL, 1000 entries
                new CaffeineCache("userGoals",
                                  Caffeine.newBuilder()
                                          .maximumSize(1000)
                                          .expireAfterWrite(24, TimeUnit.HOURS)
                                          .recordStats()
                                          .build())

        ));

        return cacheManager;
    }
}