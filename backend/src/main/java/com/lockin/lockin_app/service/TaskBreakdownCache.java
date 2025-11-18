package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.TaskBreakdownResultDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory cache for task breakdown results.
 *
 * SECURITY BUG: Cache key doesn't include userId!
 * All users share the same cached results, which could leak
 * task information between users.
 *
 * TODO: Add userId to cache key
 * TODO: Add TTL/expiration
 * TODO: Consider Redis for distributed caching
 */
@Slf4j
@Service
public class TaskBreakdownCache {

    private final Map<String, TaskBreakdownResultDTO> cache = new ConcurrentHashMap<>();

    /**
     * Get cached breakdown result.
     *
     * BUG: Cache key is just title+description without userId!
     *
     * @param title Task title
     * @param description Task description
     * @return Cached result or null if not found
     */
    public TaskBreakdownResultDTO get(String title, String description) {
        String key = generateCacheKey(title, description);
        TaskBreakdownResultDTO result = cache.get(key);

        if (result != null) {
            log.info("Cache HIT for task: {}", title);
        } else {
            log.debug("Cache MISS for task: {}", title);
        }

        return result;
    }

    /**
     * Store breakdown result in cache.
     *
     * @param title Task title
     * @param description Task description
     * @param result Breakdown result
     */
    public void put(String title, String description, TaskBreakdownResultDTO result) {
        String key = generateCacheKey(title, description);
        cache.put(key, result);
        log.info("Cached breakdown for task: {} (cache size: {})", title, cache.size());
    }

    /**
     * Clear all cached results.
     */
    public void clear() {
        cache.clear();
        log.info("Cache cleared");
    }

    /**
     * Get cache statistics.
     */
    public int size() {
        return cache.size();
    }

    /**
     * Generate cache key from task title and description.
     *
     * BUG: Doesn't include userId! All users share same cache.
     * If two users have tasks with same title/description,
     * they'll get each other's cached results.
     */
    private String generateCacheKey(String title, String description) {
        // BUG: Should be: userId + ":" + title + ":" + description
        return title + ":" + (description != null ? description : "");
    }
}
