# Complete Caching & Storage Strategy Guide for LockIn-App

## 🎯 The Four Caching/Storage Mechanisms

### 1. **React Query (Frontend Caching)**
**What it does**: Caches API responses in browser memory
**Lifespan**: Until page refresh or tab close
**Best for**: Data that changes occasionally but needs to feel fast
**Key concept**: `staleTime` controls how long data is considered "fresh"

### 2. **Caffeine/Spring Cache (Backend Caching)**
**What it does**: Caches data in server memory
**Lifespan**: Until server restart or manual eviction
**Best for**: Expensive database queries or calculations
**Key concept**: `@Cacheable` stores results, `@CacheEvict` clears them

### 3. **LocalStorage (Browser Persistence)**
**What it does**: Stores data permanently in browser
**Lifespan**: Forever (until manually cleared)
**Best for**: User preferences, settings, authentication tokens
**Key concept**: Survives page refreshes and browser restarts

### 4. **Scheduling (@Scheduled)**
**What it does**: Runs code at specific times automatically
**Lifespan**: Runs continuously while server is up
**Best for**: Maintenance tasks, pre-calculations, cleanup
**Key concept**: Cron expressions control timing

---

## 📊 Feature-by-Feature Analysis

### Feature 1: **Tasks Management**

#### Current State:
- ❌ No caching - fetches on every render
- ❌ Manual state management
- ❌ Refetches on pagination, filter changes

#### Optimal Strategy:

**React Query: YES ✅**
```typescript
staleTime: 5 * 60 * 1000  // 5 minutes
```
**Why**:
- Tasks change frequently (user creates/completes tasks)
- 5 minutes is short enough to feel real-time
- Prevents refetching when switching pages or filters
- User sees instant updates on their own actions (via invalidateQueries)

**Backend Cache: NO ❌**
**Why**:
- Task list queries are simple (no complex calculations)
- Data changes frequently
- Database is fast enough for simple queries

**LocalStorage: NO ❌**
**Why**:
- Tasks are user-specific and change frequently
- Storing in LocalStorage risks showing stale data
- Better to fetch fresh data from server

**Scheduling: NO ❌**
**Why**:
- No maintenance needed
- No pre-calculation required

**Example Implementation**:
```typescript
// frontend/src/hooks/useTasks.ts
export function useTasks(page: number, filters: TaskFilters) {
  return useQuery({
    queryKey: ["tasks", page, filters],
    queryFn: () => taskService.getTasks(page, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      // Instant update - user sees their own change immediately
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
```

---

### Feature 2: **Goals Tracking**

#### Current State:
- ✅ Uses React Query
- ❌ Default staleTime (0) - refetches constantly
- ❌ No backend cache

#### Optimal Strategy:

**React Query: YES ✅**
```typescript
staleTime: 30 * 60 * 1000  // 30 minutes
```
**Why**:
- Goals change infrequently (users set weekly/monthly goals)
- 30 minutes is acceptable staleness
- Progress updates happen in background (timer completion counter)

**Backend Cache: YES ✅**
```java
@Cacheable(value = "userGoals", key = "#userId")
TTL: 24 hours
```
**Why**:
- Goals query includes progress calculations
- Progress calculation queries multiple tables (goals, focus sessions)
- Reduces database load
- Gets invalidated when user creates/updates/deletes goals

**LocalStorage: NO ❌**
**Why**:
- Progress changes frequently (every completed pomodoro)
- Would require complex sync logic
- React Query handles this better

**Scheduling: NO ❌**
**Why**:
- Progress is calculated on-demand
- No maintenance needed

**Example Implementation**:
```typescript
// Frontend
export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: goalService.getAllGoals,
    staleTime: 30 * 60 * 1000, // 30 minutes - goals change rarely
  });
}
```

```java
// Backend
@Service
public class GoalService {

  @Cacheable(value = "userGoals", key = "#userId")
  public List<GoalResponseDTO> getUserGoals(Long userId) {
    // This method joins goals + focus_sessions + tasks
    // Expensive query - worth caching
    return goals.stream()
      .map(this::calculateProgress) // Heavy calculation
      .collect(Collectors.toList());
  }

  @CacheEvict(value = "userGoals", key = "#userId")
  public GoalResponseDTO createGoal(Long userId, CreateGoalRequest request) {
    // Clear cache so next fetch gets fresh data
    return saveGoal(request);
  }
}
```

---

### Feature 3: **Pomodoro Timer & Focus Sessions**

#### Current State:
- ✅ Timer state in React Context (correct!)
- ✅ Session history uses React Query with Infinity staleTime
- ❌ No backend cache

#### Optimal Strategy:

**React Query: YES ✅**
```typescript
staleTime: Infinity  // Keep current - perfect!
```
**Why**:
- Focus sessions are historical (never change once created)
- Only invalidated when new session completes
- Infinity is correct for immutable historical data

**Backend Cache: NO ❌**
**Why**:
- Session queries are simple (SELECT * FROM focus_sessions WHERE user_id = ?)
- No complex calculations
- Database is fast for this

**LocalStorage: YES ✅ (for timer state only)**
```typescript
localStorage.setItem('timer-state', JSON.stringify({
  remainingTime,
  isRunning,
  currentMode
}))
```
**Why**:
- Prevents losing timer progress on accidental refresh
- Timer is local to user's browser
- No need to sync with server until completion

**Scheduling: NO ❌**
**Why**:
- No maintenance needed
- Sessions are created on-demand

**Example Implementation**:
```typescript
// Timer context with LocalStorage backup
export const TimerContext = () => {
  const [timer, setTimer] = useState(() => {
    // Restore from LocalStorage on mount
    const saved = localStorage.getItem('timer-state');
    return saved ? JSON.parse(saved) : defaultTimer;
  });

  useEffect(() => {
    // Save to LocalStorage on every change
    localStorage.setItem('timer-state', JSON.stringify(timer));
  }, [timer]);

  return { timer, setTimer };
};

// Session history with React Query
export function useSessionHistory() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: sessionService.getUserSessions,
    staleTime: Infinity, // Historical data never changes
  });
}
```

---

### Feature 4: **Statistics & Analytics**

#### Current State:
- ✅ Uses React Query
- ❌ Infinity staleTime - may show stale data
- ✅ Backend has scheduled pre-calculation at 2 AM

#### Optimal Strategy:

**React Query: YES ✅**
```typescript
staleTime: 60 * 60 * 1000  // 1 hour
```
**Why**:
- Statistics change with each completed task/session
- But users don't need real-time stats
- 1 hour is acceptable staleness for analytics
- Change from Infinity to 1 hour allows periodic refresh

**Backend Cache: YES ✅ (already implemented!)**
```java
@Cacheable(value = "dailyAnalytics", key = "#userId + '_' + #date")
TTL: Forever (only for past dates)
```
**Why**:
- Analytics calculation is EXPENSIVE:
  - Aggregates all tasks
  - Counts pomodoros
  - Calculates streaks
  - Joins multiple tables
- Past dates never change (immutable)
- Pre-calculated via scheduling

**LocalStorage: NO ❌**
**Why**:
- Statistics are user-specific but change frequently
- Better handled by React Query + backend cache
- No need for offline access

**Scheduling: YES ✅ (already implemented!)**
```java
@Scheduled(cron = "0 0 2 * * ?")  // Daily at 2 AM
```
**Why**:
- Pre-calculates analytics for all users
- Spreads expensive work across night (low traffic)
- Users get instant results in morning
- Reduces peak-time database load

**Example Implementation**:
```typescript
// Frontend - change from Infinity to 1 hour
export function useTodayAnalytics() {
  return useQuery({
    queryKey: ["analytics", "today"],
    queryFn: analyticsService.getTodayAnalytics,
    staleTime: 60 * 60 * 1000, // 1 hour (was Infinity)
  });
}
```

```java
// Backend - already optimal!
@Service
public class AnalyticsService {

  @Cacheable(value = "dailyAnalytics", key = "#userId + '_' + #date")
  public AnalyticsDTO calculateDailyAnalytics(Long userId, LocalDate date) {
    // Expensive calculation - joins 5 tables
    // Result is cached forever for past dates
  }
}

@Component
public class DailyAnalyticsScheduler {

  @Scheduled(cron = "0 0 2 * * ?")
  public void preCalculateAnalytics() {
    // Runs at 2 AM daily
    List<User> users = userRepository.findAll();
    LocalDate yesterday = LocalDate.now().minusDays(1);

    users.forEach(user -> {
      // Pre-calculate and cache yesterday's analytics
      analyticsService.calculateDailyAnalytics(user.getId(), yesterday);
    });
  }
}
```

---

### Feature 5: **Badges**

#### Current State:
- ✅ Uses React Query
- ❌ Default staleTime (0)
- ❌ No backend cache

#### Optimal Strategy:

**React Query: YES ✅**
```typescript
staleTime: 60 * 60 * 1000  // 1 hour
```
**Why**:
- Badges unlock rarely (achievements are hard to earn)
- 1 hour staleness is acceptable
- User sees instant update when earning badge (via invalidation)

**Backend Cache: NO ❌**
**Why**:
- Badge query is simple (SELECT * FROM badges WHERE user_id = ?)
- No complex calculations (logic is in service layer)
- Database is fast enough

**LocalStorage: NO ❌**
**Why**:
- Badges change occasionally
- React Query caching is sufficient

**Scheduling: YES ✅ (recommended addition)**
```java
@Scheduled(cron = "0 0 1 * * ?")  // Daily at 1 AM
```
**Why**:
- Check all users for newly earned badges
- Award streak badges automatically
- Award milestone badges (100 tasks completed, etc.)

**Example Implementation**:
```typescript
// Frontend
export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: badgeService.getUserBadges,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
```

```java
// Backend - NEW: Scheduled badge checker
@Component
@RequiredArgsConstructor
public class BadgeScheduler {

  private final BadgeService badgeService;
  private final UserRepository userRepository;

  @Scheduled(cron = "0 0 1 * * ?")  // 1 AM daily
  public void checkAndAwardBadges() {
    List<User> users = userRepository.findAll();

    users.forEach(user -> {
      // Check streak badges
      if (userHas7DayStreak(user)) {
        badgeService.awardBadge(user.getId(), "7_DAY_STREAK");
      }

      // Check milestone badges
      if (userHasCompleted100Tasks(user)) {
        badgeService.awardBadge(user.getId(), "100_TASKS");
      }
    });
  }
}
```

---

### Feature 6: **Categories**

#### Current State:
- ✅ Uses React Query
- ✅ Infinity staleTime (correct!)
- ❌ No backend cache

#### Optimal Strategy:

**React Query: YES ✅**
```typescript
staleTime: Infinity  // Keep current - perfect!
```
**Why**:
- Categories rarely change (user creates once, uses forever)
- Infinity is correct
- Invalidated only on create/update/delete

**Backend Cache: YES ✅**
```java
@Cacheable(value = "userCategories", key = "#userId")
TTL: 24 hours
```
**Why**:
- Categories query joins with task counts
- Calculation: COUNT tasks per category
- Reduces load on frequently accessed data

**LocalStorage: NO ❌**
**Why**:
- React Query + backend cache is sufficient
- No need for offline access

**Scheduling: NO ❌**
**Why**:
- No maintenance needed

**Example Implementation**:
```java
// Backend
@Service
public class CategoryService {

  @Cacheable(value = "userCategories", key = "#userId")
  public List<CategoryDTO> getUserCategories(Long userId) {
    // This joins categories + task counts
    // Worth caching for performance
    return categories.stream()
      .map(category -> {
        int taskCount = taskRepository.countByCategory(category);
        return new CategoryDTO(category, taskCount);
      })
      .collect(Collectors.toList());
  }

  @CacheEvict(value = "userCategories", key = "#userId")
  public CategoryDTO createCategory(Long userId, CreateCategoryRequest request) {
    return saveCategory(request);
  }
}
```

---

### Feature 7: **Eisenhower Matrix**

#### Current State:
- ✅ Uses React Query
- ✅ Infinity staleTime
- ❌ refetchOnMount: false
- ❌ No backend cache

#### Optimal Strategy:

**React Query: YES ✅**
```typescript
staleTime: Infinity  // Keep current - correct!
refetchOnMount: false  // Keep current - correct!
```
**Why**:
- Matrix only changes when user drags tasks
- Manual invalidation on drag-drop
- Perfect as-is!

**Backend Cache: NO ❌**
**Why**:
- Simple query (filter tasks by isUrgent/isImportant)
- No complex calculations
- Database is fast

**LocalStorage: NO ❌**
**Why**:
- React Query handles this perfectly

**Scheduling: NO ❌**
**Why**:
- No maintenance needed

**Keep as-is - already optimal!**

---

### Feature 8: **AI Features** (Task Breakdown, Description Enhancement, Daily Briefing)

#### Current State:
- ✅ Daily Briefing uses React Query with 24hr staleTime (perfect!)
- ✅ Backend cache per user per day
- ✅ Rate limiting (10 requests/24hrs)

#### Optimal Strategy:

**React Query: YES ✅**
```typescript
// Daily Briefing
staleTime: 24 * 60 * 1000  // 24 hours

// Task Breakdown & Description Enhancement
staleTime: 0  // Never cache (always generate fresh)
```
**Why**:
- Daily briefing: Once per day is correct
- Task breakdown: User expects fresh AI response each time
- Rate limiting prevents abuse

**Backend Cache: YES ✅**
```java
// Daily Briefing
@Cacheable(value = "dailyBriefings", key = "#userId + '_' + #date")
TTL: 24 hours

// Task Breakdown
@Cacheable(value = "taskBreakdowns", key = "#title + '_' + #description")
TTL: Forever (content-based cache)
```
**Why**:
- Daily briefing: Expensive AI call - cache is critical
- Task breakdown: Same task = same breakdown (saves API costs)
- Both save money on Claude API calls

**LocalStorage: NO ❌**
**Why**:
- Sensitive data (user tasks/goals)
- Should not persist in browser

**Scheduling: NO ❌**
**Why**:
- AI calls are expensive
- Better to generate on-demand
- Could add: Scheduled cache cleanup of old breakdowns

**Current implementation is excellent! Keep as-is.**

---

### Feature 9: **User Settings & Preferences**

#### Current State:
- Likely no caching (need to check)

#### Optimal Strategy:

**React Query: YES ✅**
```typescript
staleTime: Infinity  // Settings never change unless user updates
```
**Why**:
- User settings change rarely
- Invalidate only on user update

**Backend Cache: NO ❌**
**Why**:
- Simple query (SELECT * FROM users WHERE id = ?)
- Database is fast

**LocalStorage: YES ✅**
```typescript
localStorage.setItem('theme', 'dark');
localStorage.setItem('pomodoroLength', '25');
localStorage.setItem('breakLength', '5');
```
**Why**:
- Settings should persist across sessions
- No need to fetch from server on every load
- Sync to server on change

**Scheduling: NO ❌**
**Why**:
- No maintenance needed

**Example Implementation**:
```typescript
export function useSettings() {
  const queryClient = useQueryClient();

  // Load from LocalStorage first, then sync with server
  const [localSettings, setLocalSettings] = useState(() => {
    return {
      theme: localStorage.getItem('theme') || 'light',
      pomodoroLength: parseInt(localStorage.getItem('pomodoroLength') || '25'),
    };
  });

  const { data: serverSettings } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsService.getSettings,
    staleTime: Infinity,
    onSuccess: (data) => {
      // Sync server to LocalStorage
      localStorage.setItem('theme', data.theme);
      localStorage.setItem('pomodoroLength', data.pomodoroLength.toString());
    },
  });

  const updateMutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: (newSettings) => {
      // Update LocalStorage
      localStorage.setItem('theme', newSettings.theme);
      // Update React Query cache
      queryClient.setQueryData(["settings"], newSettings);
    },
  });

  return { settings: serverSettings || localSettings, update: updateMutation.mutate };
}
```

---

## 📋 Decision Matrix: When to Use Each Mechanism

| Data Type | React Query | Backend Cache | LocalStorage | Scheduling |
|-----------|-------------|---------------|--------------|------------|
| **User-specific, changes frequently** (tasks) | ✅ 5 min | ❌ | ❌ | ❌ |
| **User-specific, changes rarely** (goals, categories) | ✅ 30 min | ✅ 24 hr | ❌ | ❌ |
| **Historical, never changes** (sessions, matrix) | ✅ Infinity | ❌ | ❌ | ❌ |
| **Expensive calculations** (analytics, AI) | ✅ 1 hr | ✅ Forever | ❌ | ✅ Pre-calc |
| **User preferences** (theme, settings) | ✅ Infinity | ❌ | ✅ | ❌ |
| **In-progress state** (timer) | ❌ | ❌ | ✅ | ❌ |
| **Maintenance tasks** (badge awards, cleanup) | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 Summary of Changes Needed

### High Priority (Implement Now)
1. **Goals**: Add staleTime: 30 min
2. **Badges**: Add staleTime: 60 min
3. **Statistics**: Change from Infinity to 60 min
4. **Backend Categories Cache**: Add @Cacheable
5. **Backend Goals Cache**: Add @Cacheable

### Medium Priority (Nice to Have)
6. **Tasks**: Migrate to React Query with 5 min staleTime
7. **Badge Scheduler**: Add scheduled badge awards
8. **Cache Cleanup Scheduler**: Clean old AI breakdowns

### Low Priority (Future Enhancement)
9. **Settings LocalStorage**: Add LocalStorage sync
10. **Timer LocalStorage**: Add crash recovery

---

## 💭 Key Principles

1. **React Query staleTime**:
   - Short (5 min): Frequently changing (tasks)
   - Medium (30-60 min): Occasionally changing (goals, badges, stats)
   - Infinity: Never changing (historical data, categories)

2. **Backend Cache**:
   - Use for: Expensive queries, complex calculations, AI calls
   - Avoid for: Simple lookups, frequently changing data
   - Always pair @Cacheable with @CacheEvict

3. **LocalStorage**:
   - Use for: User preferences, in-progress states
   - Avoid for: Sensitive data, frequently changing data
   - Always sync with server as source of truth

4. **Scheduling**:
   - Use for: Pre-calculations, maintenance, automated tasks
   - Run during low-traffic hours (1-4 AM)
   - Never for user-facing real-time features

This guide ensures optimal performance while maintaining data consistency and freshness!
