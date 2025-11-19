# LockIn App - Comprehensive Feature Map

## Executive Summary

LockIn is a productivity application with task management, Pomodoro timer, and AI-powered features. The frontend uses React Query for data fetching with varied caching strategies, while the backend is a Spring Boot application with selective caching for analytics and AI features.

### Current State Analysis
- **Frontend Caching**: Mixed approach - some features use React Query with staleTime, others use manual state management
- **Backend Caching**: Minimal - only Analytics and AI services use caching (@Cacheable)
- **Scheduled Tasks**: One daily scheduler at 2 AM for analytics calculation
- **Rate Limiting**: AI features limited to 10 requests per 24 hours

---

## FRONTEND FEATURE DETAILS

### 1. TASKS MANAGEMENT
**File**: `frontend/src/pages/Tasks.tsx`

**Data Fetching Pattern**: Manual state management with useEffect/useState

**Hooks Used**:
- No React Query hooks (manual service calls)
- Uses taskService directly for:
  - `getTasksPaginated(page, size)` - Paginated list
  - `getStatistics()` - Task stats (To Do, In Progress, Completed counts)
  - `getTasks()` - All tasks
  - `searchTasks(term)` - Search with debounce (300ms)
  - `filterTasksPaginated(filters, page, size)` - Advanced filtering
  - `createTask(data)` - Create new task
  - `updateTask(id, data)` - Edit task
  - `deleteTask(id)` - Delete task

**Components**:
- TaskFilters - Filter by status, category, urgent, important
- TaskFormModal - Create/edit task modal
- AITaskBreakdown - AI-powered task decomposition
- DailyBriefing - AI briefing component
- StatCard - Statistics cards display

**Caching Strategy**: NONE - No React Query caching
- Each page change fetches fresh data
- Search uses debounce (300ms) but no caching
- Statistics fetched with every render

**Data Freshness**: Real-time required
- Tasks frequently change
- Statistics need immediate updates after task changes

**Issues Identified**:
- Over-fetching on every pagination change
- No caching causes redundant API calls
- Statistics refetch causes overhead

---

### 2. GOALS TRACKING
**File**: `frontend/src/pages/Goals.tsx`

**Data Fetching Pattern**: React Query with mutations

**Hooks Used**:
- `useGoals()` - No staleTime specified (cache indefinite)
- `useCreateGoal()` - useMutation with invalidation
- `useDeleteGoal()` - useMutation with invalidation

**Components**:
- GoalsDialog - Create/edit goals
- Goal cards with progress bars
- Tab switching (Active/Completed/All)

**Caching Strategy**: Automatic invalidation on mutations
```typescript
// useGoals hook
useQuery({
  queryKey: ["goals"],
  queryFn: async () => {
    const response = await goalService.getAllGoals();
    return response.data;
  },
  // No staleTime = defaults to 0 (always stale, but cached)
});

// Mutations invalidate on success
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["goals"] });
}
```

**Data Freshness**: Medium (goals change infrequently)
- Users typically update goals daily/weekly
- Real-time updates not critical

---

### 3. POMODORO TIMER / FOCUS SESSIONS
**File**: `frontend/src/pages/PomodoroTimer.tsx`

**Data Fetching Pattern**: Manual state management + TimerContext

**Hooks/Context Used**:
- `useTimer()` - Global timer state
- `taskService.getIncompleteTasks()` - Task linking
- Manual useState for:
  - Display state (minutes/seconds)
  - Selected task
  - Session notes
  - Session history refresh trigger

**Components**:
- ProfileSelector - Select focus profile
- SessionHistory - Session list
- Task autocomplete search
- Session notes input

**Caching Strategy**: NONE - manual refresh
```typescript
const [refreshTrigger, setRefreshTrigger] = useState(0);

useEffect(() => {
  if (timer.completionCounter > 0) {
    triggerRefresh();
  }
}, [timer.completionCounter, triggerRefresh]);
```

**Data Freshness**: Real-time required
- Timer runs locally
- Sessions need immediate save/completion
- Task list updates when session completes

---

### 4. STATISTICS / PRODUCTIVITY
**File**: `frontend/src/pages/Statistics.tsx`

**Data Fetching Pattern**: React Query with client-side computation

**Hooks Used**:
```typescript
export function useStatisticsData() {
  return useQuery({
    queryKey: ["statistics-page"],
    queryFn: async () => {
      // Parallel fetch: sessions + task stats + tasks
      const [sessions, taskStats, tasks] = await Promise.all([...]);
      return { sessions, taskStats, tasks };
    },
    staleTime: Infinity, // Cache forever
  });
}
```

**Components**:
- StatCard - Key metrics display
- Profile breakdown chart
- Work vs break sessions
- Task status breakdown
- Focus quality analysis
- Integration insights

**Caching Strategy**: Indefinite caching
- `staleTime: Infinity` - Never refetches automatically
- Manual invalidation when session completes

**Data Freshness**: Medium (updated when sessions end)
- Historical data (doesn't change)
- Refreshed on timer completion via:
```typescript
useEffect(() => {
  if (timer.completionCounter > 0) {
    queryClient.invalidateQueries({ queryKey: ["statistics-page"] });
  }
}, [timer.completionCounter, queryClient]);
```

**Issues Identified**:
- `staleTime: Infinity` may show stale data between sessions
- Consider shorter refresh interval for accuracy

---

### 5. ANALYTICS / PRODUCTIVITY INSIGHTS
**File**: `frontend/src/pages/Analytics.tsx`

**Data Fetching Pattern**: React Query with multiple specialized hooks

**Hooks Used**:

```typescript
// Today's analytics (1-hour cache)
useTodayAnalytics() → staleTime: 3600000 (1 hour)

// Range analytics (7 or 30 days, 1-hour cache)
useAnalyticsRange(days) → staleTime: 3600000

// Comparison analytics (1-hour cache)
useComparisonAnalytics(...dates) → staleTime: 3600000

// Streak data (1-minute cache)
useStreak() → staleTime: 60000

// Task velocity (1-hour cache)
useTaskVelocity() → staleTime: 3600000
```

**Components**:
- BurnoutAlert - Risk score warning
- Weekly Report - Breakdown by day
- ProductivityInsights - AI-generated insights
- ProductivityHeatmap - Heatmap visualization
- Charts: Productivity trend, Task progress, Peak hours
- Eisenhower distribution
- Task velocity trend

**Caching Strategy**: Multi-tiered
- Analytics data: 1 hour staleTime
- Streak data: 1 minute staleTime (for real-time feel)
- Computed insights: Derived from range data
- Manual refresh button available

**Data Freshness**: Low frequency
- Analytics calculated once per day
- Range data doesn't change frequently
- Comparison data valid for hours

---

### 6. MATRIX / EISENHOWER MATRIX
**File**: `frontend/src/pages/Matrix.tsx`

**Data Fetching Pattern**: React Query with mutation

**Hooks Used**:
```typescript
useMatrix() → staleTime: Infinity, refetchOnMount: false

useUpdateTaskQuadrant() → Mutation with invalidation
```

**Features**:
- Drag-and-drop task movement between quadrants
- Do First (Urgent & Important)
- Schedule (Not Urgent & Important)
- Delegate (Urgent & Not Important)
- Eliminate (Not Urgent & Not Important)
- Category filter

**Caching Strategy**: Static with explicit invalidation
```typescript
const updateQuadrantMutation = useMutation({
  mutationFn: async ({taskId, isUrgent, isImportant}) => {
    await api.patch(`/tasks/${taskId}/quadrant`, null, {
      params: { isUrgent, isImportant },
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["matrix"] });
  },
});
```

**Data Freshness**: Static (task list doesn't change frequently)
- Only updates on user drag-drop action
- No external updates expected

**Performance**: Good
- `staleTime: Infinity` + `refetchOnMount: false` = minimal refetches
- Only refetches on explicit mutation

---

### 7. CATEGORIES MANAGEMENT
**File**: `frontend/src/pages/Categories.tsx`

**Data Fetching Pattern**: React Query with mutations

**Hooks Used**:
```typescript
useCategories() → staleTime: Infinity

useCreateCategory() → Manual setQueryData update
useUpdateCategory() → Invalidates on success
useDeleteCategory() → Invalidates on success
```

**Features**:
- Create/edit/delete categories
- Color and icon customization
- Category cards with task counts

**Caching Strategy**: Smart invalidation
```typescript
// Create: Optimistic update
onSuccess: (newCategory) => {
  queryClient.setQueryData(["categories"], (old: Category[] = []) => {
    return [...old, newCategory];
  });
  // Note: Commented out invalidation
}

// Update/Delete: Full invalidation
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["categories"] });
}
```

**Data Freshness**: Low frequency
- Categories rarely change
- Could cache indefinitely

---

### 8. BADGES / ACHIEVEMENTS
**File**: `frontend/src/pages/Badges.tsx`

**Data Fetching Pattern**: React Query without staleTime

**Hooks Used**:
```typescript
useQuery<Badge[]>({
  queryKey: ["badges"],
  queryFn: async () => {
    const response = await badgeService.getUserBadges(false);
    return response.data;
  },
  // No staleTime = defaults to 0 (always stale, cached)
});
```

**Features**:
- All badges (earned/locked)
- Tab filtering (All/Earned/Locked)
- Badge grouping by category
- Lock status display

**Caching Strategy**: Default (0 staleTime)
- Gets cached but immediately marked as stale
- Refetches on mount or tab focus

**Data Freshness**: Medium
- Badges earned infrequently
- Could use longer staleTime (e.g., 1 hour)

---

### 9. SETTINGS
**File**: `frontend/src/pages/Settings.tsx`

**Data Fetching Pattern**: No data fetching
- Theme context only
- Local state management

**Features**:
- Theme color selection (Indigo, Pink, Sage, Ocean, Sunset)
- Dark/Light mode toggle

---

## BACKEND FEATURE DETAILS

### 1. TASKS FEATURE
**Controller**: `TaskController.java`
**Service**: `TaskService.java`

**Endpoints**:
- `GET /api/tasks` - Paginated tasks (page, size)
- `GET /api/tasks/{id}` - Get single task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/tasks/statistics` - Task counts (TODO, IN_PROGRESS, COMPLETED)
- `GET /api/tasks/search` - Search tasks
- `GET /api/tasks/filter` - Advanced filter with pagination
- `GET /api/tasks/matrix` - Eisenhower matrix quadrants
- `PATCH /api/tasks/{id}/quadrant` - Update task quadrant

**Caching Strategy**: NONE
- All methods non-cached
- Real-time data returned

**Database Operations**:
- Paginated queries with sorting
- Filtering by status, category, urgent/important flags
- Event publishing on task completion

---

### 2. FOCUS SESSIONS / POMODORO
**Controller**: `FocusSessionController.java`
**Service**: `FocusSessionService.java`

**Endpoints**:
- `GET /api/sessions` - User's sessions list
- `POST /api/sessions/start` - Start new session
- `POST /api/sessions/{id}/complete` - Complete session
- `PATCH /api/sessions/{id}` - Update session (pause, notes)

**Caching Strategy**: NONE
- Sessions are real-time data
- No caching needed

**Features**:
- Link session to task
- Track actual vs planned minutes
- Break time tracking
- Session notes
- Session completion event publishing

---

### 3. GOALS TRACKING
**Controller**: `GoalController.java`
**Service**: `GoalService.java`

**Endpoints**:
- `GET /api/goals` - All user goals
- `GET /api/goals/{id}` - Single goal
- `POST /api/goals` - Create goal
- `PUT /api/goals/{id}` - Update goal
- `DELETE /api/goals/{id}` - Delete goal

**Caching Strategy**: NONE
- Goals are user-specific, change infrequently
- Could benefit from caching

**Features**:
- Track multiple targets: tasks, pomodoros, focus minutes
- Progress calculation
- Date range tracking
- Completion status

---

### 4. CATEGORIES MANAGEMENT
**Controller**: `CategoryController.java`
**Service**: `CategoryService.java`

**Endpoints**:
- `GET /api/categories` - User's categories
- `GET /api/categories/{id}` - Single category
- `POST /api/categories` - Create category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

**Caching Strategy**: NONE
- Categories are static per user
- Excellent caching candidate

**Data**: Name, color, icon, task count per category

---

### 5. BADGES / ACHIEVEMENTS
**Controller**: `BadgeController.java`
**Service**: `BadgeService.java`

**Endpoints**:
- `GET /api/badges` - All badges with earned status
- `GET /api/badges?earnedOnly=true` - Only earned badges

**Caching Strategy**: NONE
- Badges earned rarely
- Static list, only earned status changes

**Badge Types**: Task-based, Focus-based, Goal-based

---

### 6. ANALYTICS / DAILY METRICS
**Controller**: `DailyAnalyticsController.java`
**Services**: 
- `AnalyticsCalculationService.java`
- `WeeklyReportService.java`
- `StreakService.java`
- `ComparisonService.java`

**Endpoints**:
- `GET /api/analytics/today` - Today's metrics
- `GET /api/analytics/range?days=N` - Range of days
- `GET /api/analytics/compare` - Compare periods
- `GET /api/analytics/streak` - Streak information
- `POST /api/analytics/calculate/{date}` - Trigger calculation

**Caching Strategy**: @Cacheable

```java
@Cacheable(value = "dailyAnalytics", key = "#userId + '_' + #date")
@Transactional
public DailyAnalyticsDTO calculateDailyAnalytics(Long userId, LocalDate date)
```

**Cache Details**:
- Cache name: `dailyAnalytics`
- Cache key: `{userId}_{date}`
- Scope: Per-user, per-day
- Indefinite TTL (until evicted)

**Metrics Calculated**:
- Task metrics: Created, completed, completion rate
- Pomodoro metrics: Work sessions, break sessions, completion rate
- Focus metrics: Total minutes, average session length, quality
- Time distribution: Morning/Afternoon/Evening/Night focus time
- Burnout risk: Late night sessions, overwork minutes, interruption rate
- Productivity score: 40% task completion + 40% focus time + 20% work-break ratio
- Eisenhower distribution: Urgent/Important quadrant counts

**Scheduled Calculation**:
```java
@Scheduled(cron = "0 0 2 * * ?")  // Daily at 2 AM
public void calculateDailyAnalytics() {
  // Calculates for all users for yesterday
}
```

---

### 7. AI FEATURES
**Controller**: `AIController.java`

**Services**:
- `RateLimitService.java`
- `TaskBreakdownService.java`
- `DescriptionEnhancementService.java`
- `DailyBriefingService.java`
- `ClaudeAPIClientService.java`

**Endpoints**:
- `POST /api/ai/breakdown/{taskId}` - Break down task (10 requests/day)
- `POST /api/ai/breakdown-preview` - Preview breakdown
- `POST /api/ai/enhance-description` - Enhance task description
- `GET /api/ai/daily-briefing` - Generate daily briefing
- `GET /api/ai/rate-limit` - Check rate limit status
- `DELETE /api/ai/rate-limit/reset` - Reset rate limit (admin)
- `POST /api/ai/rate-limit/simulate/{count}` - Simulate usage (dev)

**Rate Limiting**:
```java
private static final int MAX_REQUESTS_PER_DAY = 10;
```
- 10 requests per 24 hours per user
- Tracks in database via AIUsageRepository
- Throws RateLimitExceededException when limit exceeded

**Caching Strategy**:

1. **DailyBriefingService**:
```java
@Cacheable(value = "dailyBriefings", key = "#userId + '_' + T(java.time.LocalDate).now()")
public BriefingResultDTO generateDailyBriefing(Long userId)
```
- Cache name: `dailyBriefings`
- Cache key: `{userId}_{today's date}`
- Scope: One per user per day
- TTL: Until midnight (day boundary)

2. **TaskBreakdownService**:
```java
@Cacheable(value = "taskBreakdowns", key = "#title + '_' + (#description != null ? #description : '')")
public TaskBreakdownResultDTO breakdownTask(String title, String description, LocalDateTime dueDate, Long userId)
```
- Cache name: `taskBreakdowns`
- Cache key: `{title}_{description}`
- Scope: By task content (not user)
- Benefit: Same task breakdown reused across users

3. **RateLimitService**:
```java
@CacheEvict(value = "rateLimitCounters", key = "#userId")
public void resetRateLimit(Long userId)

@CacheEvict(value = "rateLimitCounters", key = "#userId")
public void simulateUsage(Long userId, int count)
```
- Cache name: `rateLimitCounters`
- Cache key: `{userId}`
- Evict on: Reset or simulation

**AI Usage Tracking**:
- Stores every AI request in `AIUsage` table
- Records: user, feature type, tokens used, cost, request details, timestamp
- Uses for rate limiting and usage analytics

---

### 8. AUTHENTICATION & USERS
**Controller**: `AuthController.java`
**Services**: 
- `AuthService.java`
- `CustomUserDetailsService.java`
- `UserService.java`

**Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login with JWT
- `POST /api/auth/refresh` - Refresh token
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

**Caching Strategy**: NONE
- User data is personal and sensitive
- No caching recommended

---

## CACHING & PERFORMANCE ANALYSIS

### Frontend Caching Summary

| Feature | Hook/Method | StaleTime | Cache Key | Current Issue |
|---------|------------|-----------|-----------|--------------|
| Statistics | useStatisticsData | Infinity | "statistics-page" | Stale data between sessions |
| Analytics - Today | useTodayAnalytics | 1 hour | ["analytics", "today"] | Good |
| Analytics - Range | useAnalyticsRange | 1 hour | ["analytics", "range", days] | Good |
| Analytics - Comparison | useComparisonAnalytics | 1 hour | ["analytics", "compare", ...] | Good |
| Analytics - Streak | useStreak | 1 minute | ["analytics", "streak"] | Good |
| Analytics - Velocity | useTaskVelocity | 1 hour | ["analytics", "velocity", ...] | Good |
| Goals | useGoals | 0 (default) | ["goals"] | Gets stale immediately |
| Categories | useCategories | Infinity | ["categories"] | Good |
| Matrix | useMatrix | Infinity | ["matrix"] | Good |
| Badges | Query | 0 (default) | ["badges"] | Gets stale immediately |
| Tasks | Manual | None | None | NO CACHING - refetch on every action |

### Backend Caching Summary

| Service | Cache Name | Cache Key | TTL | Coverage |
|---------|-----------|-----------|-----|----------|
| AnalyticsCalculationService | dailyAnalytics | {userId}_{date} | Until eviction | One record per user/day |
| DailyBriefingService | dailyBriefings | {userId}_{today} | Until midnight | One per user/day |
| TaskBreakdownService | taskBreakdowns | {title}_{description} | Until eviction | Cross-user (global scope) |
| RateLimitService | rateLimitCounters | {userId} | Until eviction | Evicted on reset |

### Cache Hit Opportunities

**High Priority** (Currently missing, high impact):
1. Categories - Currently Infinity staleTime, good but could add backend cache
2. Tasks list - Currently NO cache, causes repeated queries
3. Goals - Currently stale immediately, should add staleTime

**Medium Priority**:
1. Statistics - Change staleTime from Infinity to 1 hour
2. Badges - Add staleTime (e.g., 1 hour)
3. Matrix - Working well, low priority

**Low Priority**:
1. Analytics - Already well cached (1 hour)
2. Focus sessions - Real-time data, shouldn't cache

---

## SCHEDULED JOBS

### Daily Analytics Calculation
**Location**: `DailyAnalyticsScheduler.java`
**Cron**: `0 0 2 * * ?` (Daily at 2:00 AM)
**Function**: Pre-calculates analytics for previous day for all users
**Duration**: Async, iterates all users
**Error Handling**: Logs errors, continues with other users

**TODO Items in Code**:
```java
// TODO: add to calculate consecutive work days
// TODO: add to cleanup old analytics
```

---

## RATE LIMITING

### AI Features Rate Limit
- **Limit**: 10 requests per 24 hours
- **Reset**: Automatic at 24-hour boundary
- **Enforcement**: Per user, checked before each AI call
- **Storage**: Database (AIUsage table)
- **Features Limited**:
  - Task Breakdown
  - Description Enhancement
  - Daily Briefing

### Rate Limit Status Endpoint
- Returns: `{limit: 10, remaining: X, used: Y}`
- Admin endpoints: Reset (DELETE), Simulate (POST) for testing

---

## EVENT-DRIVEN ARCHITECTURE

### Events Published
1. **TaskCompletedEvent** - When task status → COMPLETED
2. **PomodoroCompletedEvent** - When focus session completes
3. **GoalCompletedEvent** - When goal reaches 100%

### Event Listeners
- Statistics invalidation on task/pomodoro completion
- Goals progress update on task completion
- Badge achievement checks

---

## DATA FRESHNESS REQUIREMENTS SUMMARY

| Domain | Freshness | Reasoning |
|--------|-----------|-----------|
| Tasks | Real-time | Frequently modified |
| Focus Sessions | Real-time | Active user sessions |
| Goals | Daily | Updated with task completion |
| Categories | Static | Rarely modified |
| Analytics | Daily | Calculated once per day |
| Badges | Weekly | Earned infrequently |
| Statistics | Hourly | Based on session data |

---

## RECOMMENDATIONS FOR OPTIMIZATION

### Immediate Actions

1. **Add React Query caching to Tasks**
   - Add staleTime: 5 minutes
   - Implement pagination cache keys
   - Expected: 60% reduction in task list API calls

2. **Fix Goals caching**
   - Change from default (0) to staleTime: 30 minutes
   - Expected: Reduce unnecessary refetches

3. **Improve Statistics freshness**
   - Change from Infinity to staleTime: 1 hour
   - More accurate with fresh data

4. **Add backend caching to Categories**
   - @Cacheable with TTL: 1 day
   - Expected: Reduce database queries

### Medium-term Improvements

5. **Implement Redis for distributed caching**
   - Use for cross-instance cache (if deployed on multiple servers)
   - Replace default in-memory Spring Cache

6. **Add cache warming scheduler**
   - Pre-load frequently accessed data at off-peak times
   - Reduce initial load time

7. **Implement cache invalidation strategy**
   - Category changes invalidate related task cache
   - Task changes invalidate goal progress cache

### Code Cleanup

8. **Remove TODO items in DailyAnalyticsScheduler**
   - Implement consecutive work days calculation
   - Add analytics cleanup for data older than 1 year

9. **Add unit tests for caching**
   - Verify cache hit/miss rates
   - Test cache invalidation logic

---

## DEPLOYMENT CONSIDERATIONS

### Current Setup
- Single instance
- In-memory Spring Cache (default)
- No distributed caching

### For Production (Multi-instance)
- Switch to Redis Cache
- Configure cache TTLs per feature
- Monitor cache hit rates
- Implement cache warming

---

## FILES MODIFIED/ANALYZED

### Frontend (React + TypeScript)
- `frontend/src/pages/` - All 9 page components
- `frontend/src/hooks/` - 7 custom hooks
- `frontend/src/services/` - API service layer
- `frontend/src/context/` - Timer and Auth context

### Backend (Spring Boot + Java)
- `backend/src/main/java/com/lockin/lockin_app/features/` - 8 feature packages
  - tasks, goals, focus_sessions, categories, badges, analytics, ai, users/auth
- `backend/src/main/java/com/lockin/lockin_app/scheduler/` - DailyAnalyticsScheduler
- 9 Controllers, 15 Services, 8 Entities/Repositories

---

## APPENDIX: API ENDPOINTS BY FEATURE

### Tasks
- GET /api/tasks?page=0&size=20
- POST /api/tasks
- PUT /api/tasks/{id}
- DELETE /api/tasks/{id}
- GET /api/tasks/statistics
- GET /api/tasks/search?q=term
- POST /api/tasks/filter
- GET /api/tasks/matrix
- PATCH /api/tasks/{id}/quadrant

### Focus Sessions  
- GET /api/sessions
- POST /api/sessions/start
- POST /api/sessions/{id}/complete
- PATCH /api/sessions/{id}

### Goals
- GET /api/goals
- POST /api/goals
- PUT /api/goals/{id}
- DELETE /api/goals/{id}

### Categories
- GET /api/categories
- POST /api/categories
- PUT /api/categories/{id}
- DELETE /api/categories/{id}

### Analytics
- GET /api/analytics/today
- GET /api/analytics/range?days=N
- GET /api/analytics/compare?...
- GET /api/analytics/streak

### AI Features
- POST /api/ai/breakdown/{taskId}
- POST /api/ai/breakdown-preview
- POST /api/ai/enhance-description
- GET /api/ai/daily-briefing
- GET /api/ai/rate-limit
- DELETE /api/ai/rate-limit/reset

### Badges
- GET /api/badges?earnedOnly=false

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- GET /api/users/profile

