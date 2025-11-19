# LockIn App - Recommended Caching & Scheduling Strategy

## Quick Reference: Current State vs. Optimal

### Frontend Caching Status

#### GOOD - Keep As Is
```
✅ Analytics (1 hour staleTime)
   - useTodayAnalytics: 1hr
   - useAnalyticsRange: 1hr  
   - useComparisonAnalytics: 1hr
   - useTaskVelocity: 1hr
   - useStreak: 1 min (real-time feel)

✅ Categories (Infinity staleTime)
   - Rarely changes
   - Smart invalidation on mutations

✅ Matrix (Infinity staleTime)
   - Static until user drags
   - Good performance
```

#### NEEDS FIXING - HIGH PRIORITY
```
❌ Tasks - NO CACHING
   - Manual state management
   - Refetches on EVERY pagination change
   - FIX: Add staleTime: 5 minutes
   
❌ Goals - Default staleTime (0)
   - Gets stale immediately
   - FIX: Add staleTime: 30 minutes

❌ Badges - Default staleTime (0)
   - Gets stale immediately  
   - FIX: Add staleTime: 60 minutes

❌ Statistics - Infinity staleTime
   - May show stale data
   - FIX: Change to staleTime: 60 minutes
```

### Backend Caching Status

#### GOOD - Keep As Is
```
✅ Analytics Calculation
   @Cacheable(value = "dailyAnalytics", key = "{userId}_{date}")
   - Per-user, per-day caching
   - Scheduled pre-calculation at 2 AM

✅ Daily Briefing
   @Cacheable(value = "dailyBriefings", key = "{userId}_{date}")
   - One per user per day
   - Respects day boundary

✅ Task Breakdown
   @Cacheable(value = "taskBreakdowns", key = "{title}_{description}")
   - Global scope (shared across users)
   - Reduces API calls for same task

✅ Rate Limit Management
   @CacheEvict on reset/simulate
   - Keeps cache consistent
```

#### NEEDS ADDING - HIGH PRIORITY
```
❌ Categories Service
   - Currently not cached
   - ADD: @Cacheable with TTL: 1 day
   - Key: {userId}

❌ Goals Service  
   - Currently not cached
   - ADD: @Cacheable with TTL: 1 day
   - Key: {userId}

❌ Tasks Service (Statistics)
   - Currently not cached
   - ADD: @Cacheable for statistics only
   - Key: {userId}
```

---

## Implementation Checklist

### Phase 1: Frontend (Immediate - High Impact)

- [ ] **Tasks Page**
  ```typescript
  // Change from manual to React Query
  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", currentPage, pageSize, filters],
    queryFn: () => taskService.getTasksPaginated(currentPage, pageSize, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // For statistics
  const { data: stats } = useQuery({
    queryKey: ["tasks", "statistics"],
    queryFn: () => taskService.getStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  ```

- [ ] **Goals Page**
  ```typescript
  // Update from default to explicit staleTime
  export function useGoals() {
    return useQuery({
      queryKey: ["goals"],
      queryFn: async () => {
        const response = await goalService.getAllGoals();
        return response.data;
      },
      staleTime: 30 * 60 * 1000, // 30 minutes
    });
  }
  ```

- [ ] **Statistics Page**
  ```typescript
  // Reduce from Infinity to 1 hour
  export function useStatisticsData() {
    return useQuery({
      queryKey: ["statistics-page"],
      queryFn: async () => {
        const [sessions, taskStats, tasks] = await Promise.all([...]);
        return { sessions, taskStats, tasks };
      },
      staleTime: 60 * 60 * 1000, // 1 hour
    });
  }
  ```

- [ ] **Badges Page**
  ```typescript
  // Add staleTime
  useQuery<Badge[]>({
    queryKey: ["badges"],
    queryFn: async () => {
      const response = await badgeService.getUserBadges(false);
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
  ```

### Phase 2: Backend (Medium - Good Returns)

- [ ] **Categories Service**
  ```java
  @Transactional(readOnly = true)
  @Cacheable(value = "userCategories", key = "#userId")
  public List<CategoryResponseDTO> getUserCategories(Long userId) {
    // existing implementation
  }
  
  @Transactional
  @CacheEvict(value = "userCategories", key = "#userId")
  public CategoryResponseDTO createCategory(Long userId, CategoryRequestDTO request) {
    // existing implementation
  }
  
  @Transactional
  @CacheEvict(value = "userCategories", key = "#userId")
  public CategoryResponseDTO updateCategory(Long userId, Long id, CategoryRequestDTO request) {
    // existing implementation
  }
  
  @Transactional
  @CacheEvict(value = "userCategories", key = "#userId")
  public void deleteCategory(Long userId, Long id) {
    // existing implementation
  }
  ```

- [ ] **Goals Service**
  ```java
  @Transactional(readOnly = true)
  @Cacheable(value = "userGoals", key = "#userId")
  public List<GoalResponseDTO> getUserGoals(Long userId) {
    // existing implementation
  }
  
  @Transactional
  @CacheEvict(value = "userGoals", key = "#userId")
  public GoalResponseDTO createGoal(Long userId, GoalRequestDTO request) {
    // existing implementation
  }
  ```

- [ ] **Task Statistics**
  ```java
  @Transactional(readOnly = true)
  @Cacheable(value = "taskStatistics", key = "#userId")
  public TaskStatisticsDTO getStatistics(Long userId) {
    // existing implementation
  }
  
  // Invalidate on task changes
  @Transactional
  @CacheEvict(value = "taskStatistics", key = "#userId")
  public TaskResponseDTO createTask(Long userId, TaskRequestDTO request) {
    // existing implementation
  }
  ```

### Phase 3: Backend Cache Configuration

- [ ] **Add Cache Configuration Class**
  ```java
  @Configuration
  @EnableCaching
  public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
      ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager(
        "userCategories",
        "userGoals",
        "taskStatistics",
        "dailyAnalytics",
        "dailyBriefings",
        "taskBreakdowns",
        "rateLimitCounters"
      );
      return cacheManager;
    }
  }
  ```

- [ ] **For Production: Switch to Redis**
  ```xml
  <!-- Add to pom.xml -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
  </dependency>
  ```

### Phase 4: Scheduled Tasks

- [ ] **Existing (Keep)**
  - DailyAnalyticsScheduler - Runs daily at 2 AM
  
- [ ] **New: Cache Cleanup Scheduler**
  ```java
  @Component
  @RequiredArgsConstructor
  public class CacheCleanupScheduler {
    
    private final CacheManager cacheManager;
    
    @Scheduled(cron = "0 0 3 * * ?")  // 3 AM daily
    public void clearOldAnalytics() {
      // Clean analytics older than 1 year
      // Clean up old taskBreakdowns
    }
    
    @Scheduled(cron = "0 0 */6 * * ?")  // Every 6 hours
    public void warmCache() {
      // Pre-load frequently accessed data
    }
  }
  ```

---

## Data Freshness & TTL Matrix

| Feature | Frontend | Backend | TTL | Notes |
|---------|----------|---------|-----|-------|
| Tasks | 5 min | None | ~5min | Real-time edits, batch refresh |
| Goals | 30 min | 1 day | ~30min | Slow changes, batch update |
| Categories | ∞ | 1 day | ~1day | Static, few changes |
| Statistics | 1 hour | ∞ | ~1hr | Historical data, batch refresh |
| Analytics | 1 hour | ∞ | ~1hr | Daily calculation, batch refresh |
| Badges | 1 hour | None | ~1hr | Rare changes |
| Matrix | ∞ | None | ∞ | Only drag-drop changes |
| Analytics Calc | - | @Cache | ∞ | Pre-calc at 2 AM |
| Daily Briefing | - | @Cache | 1 day | Once per user per day |
| Task Breakdown | - | @Cache | ∞ | Content-based key |

---

## Performance Impact Estimates

### Before Optimization
```
Tasks Page: ~100ms per load × 5 pagination changes/session = 500ms wasted
Goals: ~80ms per load × 2 tabs/session = 160ms wasted  
Statistics: ~120ms per load × 3 refreshes/session = 360ms wasted
TOTAL: ~1020ms per session = 34% of average session time
```

### After Optimization
```
Tasks Page: ~100ms initial + 0ms cached × 4 changes = 100ms
Goals: ~80ms initial + 0ms cached × 1 tab = 80ms
Statistics: ~120ms initial + 0ms cached × 2 refreshes = 120ms
TOTAL: ~300ms per session = 10% of average session time
```

**Expected Improvement: ~70% reduction in unnecessary API calls**

---

## Monitoring & Maintenance

### Metrics to Track
- Cache hit rate (target: >80%)
- Average response time (target: <100ms)
- Database query count (target: -60%)
- API request count (target: -70%)

### Tools
- Spring Boot Actuator for cache metrics
- Redis Monitor for cache operations
- Database query logs

### Review Schedule
- Weekly: Cache hit rates
- Monthly: Database load
- Quarterly: Cache strategy effectiveness

---

## Fallback & Rollback Plan

If caching causes issues:

1. **Frontend**: Remove staleTime property (reverts to default behavior)
2. **Backend**: Remove @Cacheable annotation or disable cache via configuration
3. **Database**: Reduce TTLs to 5 minutes while investigating

---

## Code Files to Modify

### Frontend
```
frontend/src/hooks/useStatistics.ts
frontend/src/hooks/useAnalytics.ts  
frontend/src/hooks/useGoals.ts
frontend/src/pages/Badges.tsx
frontend/src/pages/Statistics.tsx
```

### Backend
```
backend/src/main/java/com/lockin/lockin_app/features/categories/service/CategoryService.java
backend/src/main/java/com/lockin/lockin_app/features/goals/service/GoalService.java
backend/src/main/java/com/lockin/lockin_app/features/tasks/service/TaskService.java
backend/src/main/java/com/lockin/lockin_app/config/CacheConfig.java (new)
backend/src/main/java/com/lockin/lockin_app/scheduler/CacheCleanupScheduler.java (new)
```

---

## Questions for Implementation Team

1. Is data consistency critical for Goals (could use 30 min TTL)?
2. Can Tasks list cache 5 minutes (some users may see slightly delayed updates)?
3. Should we implement Redis now or wait for multi-instance deployment?
4. What's the preferred cache eviction strategy?
5. Should we monitor cache metrics in production?

