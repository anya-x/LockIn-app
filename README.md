# LockIn Task Manager

A science based task management tool that's going to change how you view productivity.

## Tech Stack

- **Backend:** Spring Boot 3.2, PostgreSQL 17, JWT Authentication
- **Frontend:** React 18, TypeScript, Material-UI v7, Vite
- **Architecture:** RESTful API, responsive SPA
- **AI:** Claude API (Anthropic) with response caching
- **Real-time:** WebSocket (STOMP) for notifications
- **Integrations:** Google Calendar OAuth2

## Prerequisites

- Java
- Node.js
- PostgreSQL
- Maven

## API Endpoints

### Authentication

- POST `/api/auth/register` - register a new user
- POST `/api/auth/login` - login as user

### Tasks (Authenticated)

- GET `/api/tasks` - get all user tasks (paginated)
- GET `/api/tasks/{id}` - get a single task
- POST `/api/tasks` - create a new task
- PUT `/api/tasks/{id}` - update a task
- DELETE `/api/tasks/{id}` - delete a task
- GET `/api/tasks/incomplete` - get all incomplete tasks
- GET `/api/tasks/statistics` - get task statistics

### Categories (Authenticated)

- GET `/api/categories` - get all categories
- GET `/api/categories/{id}` - get a single category
- POST `/api/categories` - create a category
- PUT `/api/categories/{id}` - update a category
- DELETE `/api/categories/{id}` - delete a category

### Goals (Authenticated)

- GET `/api/goals` - get all user goals
- GET `/api/goals/{id}` - get a single goal
- POST `/api/goals` - create a goal
- PUT `/api/goals/{id}` - update a goal
- DELETE `/api/goals/{id}` - delete a goal

### Focus Sessions (Authenticated)

- GET `/api/sessions` - get all user focus sessions
- POST `/api/sessions/start` - start a new focus session
- POST `/api/sessions/{id}/complete` - complete a session
- PUT `/api/sessions/{id}` - update a session
- PUT `/api/sessions/{id}/notes` - update session notes
- GET `/api/sessions/today` - get today's session stats

### Analytics (Authenticated)

- GET `/api/analytics/today` - get today's analytics
- GET `/api/analytics/range?days={number}` - get analytics for date range
- POST `/api/analytics/calculate/{date}` - calculate analytics for specific date
- GET `/api/analytics/weekly-report` - get weekly performance report
- POST `/api/analytics/compare` - period comparison
- POST `/api/analytics/refresh` - refresh analytics cache
- GET `/api/analytics/streak` - get streak statistics

### Eisenhower Matrix Endpoints

- GET `/api/tasks/quadrant?isUrgent=...&isImportant=...` - get tasks by quadrant
- GET `/api/tasks/matrix` - get complete matrix
- PATCH `/api/tasks/{id}/quadrant?isUrgent=...&isImportant=...` - move a task between quadrants

### Search & Filter Endpoints

- GET `/api/tasks/search?query={term}` - search tasks
- GET `/api/tasks/filter?status=...&categoryId=...&isUrgent=...&isImportant=...` - multi-criteria filtering

### AI Endpoints (Authenticated)

- POST `/api/ai/breakdown/{taskId}` - AI-powered task breakdown
- POST `/api/ai/breakdown-preview` - preview breakdown before saving
- POST `/api/ai/enhance-description` - enhance task description
- GET `/api/ai/daily-briefing` - get personalized daily briefing
- GET `/api/ai/rate-limit` - get rate limit status

### Google Calendar Endpoints (Authenticated)

- GET `/api/calendar/connect` - generate OAuth authorization URL
- GET `/api/calendar/oauth/callback` - OAuth2 callback handler
- GET `/api/calendar/status` - get connection status
- POST `/api/calendar/sync-now` - trigger manual sync
- POST `/api/calendar/push-to-google` - export tasks to Google Calendar
- DELETE `/api/calendar/disconnect` - revoke access and disconnect

### Notification Endpoints (Authenticated)

- GET `/api/notifications` - get paginated notifications
- GET `/api/notifications/all` - get all notifications
- GET `/api/notifications/unread` - get unread notifications
- GET `/api/notifications/unread/count` - get unread count
- PUT `/api/notifications/{id}/read` - mark as read
- PUT `/api/notifications/read-all` - mark all as read

## Features & Roadmap

## Epic 1: Authentication & Foundation

### User Stories Completed:

#### [x] US-1.1: User Registration

**As a** new user
**I want to** create an account with email and password
**So that** I can securely access the task manager

**ACs**

- Email validation
- Password strength requirements
- First name and last name captured
- Auto-login after successful registration

---

#### [x] US-1.2: User Login

**As a** registered user
**I want to** login with my credentials
**So that** I can access my tasks

**ACs**

- Email and password authentication
- JWT token generation
- Token stored
- Generic error messages (prevents user enumeration)
- Session persistence across browser refreshes

**Known Issues**

- JWT secret hardcoded (TODO: Move to environment variables in prod)
- Token stored in localStorage
- No refresh token mechanism
- No rate limiting on login endpoint

#### [x] US-1.3: Basic Task CRUD

**As a** user
**I want to** create, read, update, and delete tasks
**So that** I can manage my to-do list

**AC**

- Create tasks with title and description
- View all my tasks
- Edit task details
- Confirmation dialog when deleting tasks
- Tasks unique to authenticated user

**Known Issues**

- n+1 query problem

## Epic 2: Productivity Framework

#### [x] US-2.1: Task Categories

**As a** user
**I want to** organise tasks into categories
**So that** I can group related work

**AC**

- Create custom categories with name, color, and icon
- Assign tasks to categories
- Edit and delete categories
- Category uniqueness per user
- Tasks retain when category deleted (no cascade)

**Known Issues**

- when creating a new category along with task, category filter doesn't refresh with new category
- TaskResponseDTO missing categoryIcon field (entity has it, DTO doesn't return it)

#### [x] US-2.2: Eisenhower Matrix

**As a** user
**I want to** visualise tasks in an Eisenhower Matrix
**So that** I can prioritise by urgency and importance

**ACs**

- 2x2 grid showing four quadrants
- Urgent + Important: Do First
- Not Urgent + Important: Schedule
- Urgent + Not Important: Delegate
- Not Urgent + Not Important: Eliminate
- Drag-and-drop tasks between quadrants (@dnd-kit v6.3.1)
- Color-coded by priority (red, blue, orange, purple)

**Known Issues**

- drag and drop on mobile not working properly

#### [x] US-2.3: Task Search

**As a** user
**I want to** search tasks by title or description
**So that** I can quickly find specific tasks

**ACs**

- Real-time search with 300ms debounce (lodash)
- Case insensitive matching (SQL LOWER())
- Searches title and description fields
- Loading indicator during search

#### [x] US-2.4: Advanced Filtering

**As a** user
**I want to** filter tasks by status, category, urgency and importance
**So that** I can focus on specific task groups

**ACs**

- Filter by status (TODO, IN_PROGRESS, COMPLETED)
- Filter by category
- Filter by urgency
- Filter by importance
- Combine multiple filters (dynamic WHERE clause)
- Show active filter count badge
- Button to clear all filters (x)

#### [x] US-2.5: Task Statistics Dashboard

**As a** user
**I want to** see task statistics at a glance
**So that** I can track my progress

**ACs**

- Total tasks count
- To Do / In Progress / Completed counts
- Completion rate percentage
- Tasks by category distribution
- Weekly activity (created/completed this week)
- Color-coded stat cards

## Epic 3: Focus Management

#### [x] US-3.1: Pomodoro Timer

**As a** user
**I want to** use a Pomodoro timer (multiple choices: 25/5, 50/10...)
**So that** I can deep focus during sessions

**ACs**

- 6 configurable focus profiles:
  - Classic Focus (25/5/15) - Research-backed
  - Extended Focus (50/10/30) - Research-backed
  - Flow State (90/20/40) - Research-backed (ultradian rhythms)
  - Quick Wins (15/3/5) - Research-backed (ADHD research)
  - Deep Work (52/17/30) - Community favorite
  - Balanced Focus (75/33/45) - Community favorite
- Audio/visual notifications
- Browser notifications (with permission via Notification API)
- Pause/resume functionality
- Session history tracking with notes
- Visual progress indicator (dots)
- Large MM:SS timer display
- Profile selector with research badges

**Known Issues**

- Keyboard shortcuts (Space/Esc) NOT IMPLEMENTED
- Timer stops when changing tabs

#### [x] US-3.2: Focus Session Tracking

**As a** user
**I want to** track my focus sessions
**So that** I can analyse my patterns

**ACs**

- FocusSession entity (start time, planned/actual duration, task link)
- Session notes and reflection
- Daily/weekly session statistics
- Peak productivity hour detection (time-of-day analytics)
- Task linking with ownership validation
- localStorage persistence for timer state
- Event-driven architecture (PomodoroCompletedEvent)

**Known Issues**

- Uses LocalDateTime instead of ZonedDateTime (no timezone awareness)
- Session history doesn't automatically refresh after session complete

## Epic 4: Analytics & Insights

#### [x] US-4.1: Productivity Dashboard

**As a** user
**I want to** see my productivity trends
**So that** I can identify patterns and improve

**ACs**

- DailyAnalytics entity with 20+ aggregated fields
- Productivity score algorithm (40% tasks + 40% focus + 20% work-break balance)
- Completion rate trends
- Focus time tracking (morning/afternoon/evening/night breakdown)
- Break/work ratio analysis
- Recharts visualizations:
  - Line Chart: Performance trend (productivity + focus scores)
  - Area Chart: Task progress (created vs completed)
  - Bar Chart: Peak hours analysis
- Productivity heatmap (12-week GitHub-style)
- Period comparison (week vs week, month vs month)
- Streak tracking (current + longest)

#### [x] US-4.2: Burnout Detection

**As a** user concerned about well-being
**I want to** be alerted when showing burnout signs
**So that** I can adjust my workload

**ACs**

- Maslach-adapted 5-factor burnout algorithm:
  - Overwork indicator (0-40 points): >60 min over 6-hour limit
  - Late night work (0-30 points): 2+ sessions after 10 PM
  - Interrupted sessions (0-20 points): >50% interruption rate
  - Low productivity (0-10 points): productivity score <30
  - Consecutive work days (0-10 points): 7+ days straight
- Burnout risk score (0-100 scale)
- BurnOutAlert component with severity levels (high >70, warning >50, info 40-50)
- Evidence-based recommendations

#### [x] US-4.3: Goal Tracking

**As a** user
**I want to** set and track productivity goals
**So that** I can measure progress toward my objectives

**ACs**

- Goal types: DAILY, WEEKLY, MONTHLY
- Target metrics: tasks, pomodoros, focus minutes
- Progress tracking with percentage calculation
- Goal completion events (GoalCompletedEvent)
- Badge awards for goal milestones

#### [x] US-4.4: Report Generation

**As a** user
**I want to** export productivity reports
**So that** I can share with manager or reflect on my own progress

**ACs**

- Weekly report generation (WeeklyReportService)
- Report includes:
  - Total tasks, pomodoros, minutes
  - Average productivity and burnout scores
  - Best/worst day identification
  - Trend calculation
- 4 recommendation types based on metrics:
  - Low productivity (<50): focus on high-priority tasks
  - High burnout (>50): take more breaks, avoid late-night work
  - Insufficient focus (<180 min/day): maintain 3-4 hours daily
  - Low Pomodoro usage (<6/day): use timer more consistently
- Export to text/CSV
- Copy to clipboard functionality
- Shareable report generation

#### [x] US-4.5: Scheduled Analytics

**As a** developer
**I want** analytics calculated automatically
**So that** users always have up-to-date insights

**ACs**

- Cron job at 2:00 AM UTC daily (DailyAnalyticsScheduler)
- Calculates previous day's analytics for all users
- Error handling with success/error counters
- Manual calculation endpoint available

## Epic 5: Intelligent Features

#### [x] US-5.1: AI Task Breakdown

**As a** user
**I want to** break down complex tasks into subtasks using AI
**So that** I can tackle large projects systematically

**ACs**

- Claude API integration (claude-sonnet-4-20250514)
- Smart task breakdown with Eisenhower Matrix classification
- Generates 3-7 subtasks with estimated time
- Preview before saving
- Response caching (Caffeine cache, 1-hour TTL)
- Cost savings: ~40% from caching

#### [x] US-5.2: AI Description Enhancement

**As a** user
**I want to** enhance vague task descriptions
**So that** I have clear, actionable tasks

**ACs**

- Expands vague descriptions into detailed, actionable text
- Inline enhancement button in task form
- 1-hour cache TTL
- Input validation (minimum 3 characters)

#### [x] US-5.3: Daily AI Briefing

**As a** user
**I want to** receive a personalized daily briefing
**So that** I can start my day with clear priorities

**ACs**

- Analyzes all active tasks by Eisenhower quadrant
- Warm, supportive tone
- Top 3 priorities identification
- Practical tips and suggestions
- 24-hour cache per user
- Notification sent after generation

#### [x] US-5.4: AI Rate Limiting & Usage Tracking

**As a** developer
**I want** to control AI costs and usage
**So that** the service remains sustainable

**ACs**

- 10 AI requests per day per user limit
- 24-hour rolling window
- AIUsage entity tracking:
  - Feature type (BREAKDOWN, ENHANCE, BRIEFING)
  - Tokens used
  - Cost in USD (input: $3/million, output: $15/million)
- Rate limit indicator in UI
- Graceful error handling (RateLimitExceededException)

## Epic 6: Integrations

#### [x] US-6.1: Google Calendar OAuth2

**As a** user
**I want to** sync tasks with Google Calendar
**So that** I can see deadlines in my calendar

**ACs**

- Full OAuth2 flow with state parameter (CSRF protection)
- Token encryption (AES-256 via Jasypt)
- Two-way sync:
  - Tasks with due dates -> Google Calendar events
  - Google Tasks -> Lockin tasks
- Duplicate prevention (existsByGoogleEventId)
- Auto-sync every 15 minutes (CalendarSyncScheduler)
- Manual sync button
- Connection status UI with timestamps
- Disconnect/revoke functionality
- Notifications when new tasks imported

#### [x] US-6.2: Real-time Notifications

**As a** user
**I want to** receive real-time notifications
**So that** I stay informed about important events

**ACs**

- WebSocket (STOMP) real-time delivery
- User-specific queues: `/user/{email}/queue/notifications`
- Browser push notifications (Notification API)
- Notification types:
  - AI_BREAKDOWN
  - TASK_DUE
  - CALENDAR_SYNC
  - DAILY_BRIEFING
- Notification center drawer UI
- Read/unread status with visual indicators
- Mark single/all as read
- Unread count badge
- Notification preferences:
  - Browser notifications toggle
  - AI feature notifications
  - Calendar sync notifications
  - Task reminders
- localStorage persistence for preferences
- Auto-reconnection with exponential backoff (1s-30s)
- iOS Safari detection and handling

## Epic 7: Production Readiness

#### US-7.1: Comprehensive Testing

**As a** developer
**I want** atleast 70% test coverage
**So that** I can deploy with confidence and ease

#### US-7.2: Docker Deployment

**As a** developer
**I want** containerised deployment
**So that** the app runs consistently everywhere

#### US-7.3: CI/CD Pipeline

**As a** developer
**I want** automated testing and deployment
**So that** I can ship new and modify features quickly and safely

#### US-7.4: Cloud Deployment

**As a** user
**I want** the app accessible online
**So that** I can use it from anywhere

## Implementation Status Summary

| Category | Implemented | Total | Status |
|----------|-------------|-------|--------|
| Foundation | 6 | 6 | 100% |
| Task Management | 6 | 6 | 100% |
| Pomodoro Timer | 7 | 9 | 78% |
| Analytics | 9 | 9 | 100% |
| AI & Integrations | 14 | 14 | 100% |
| **TOTAL** | **42** | **44** | **95%** |

### Missing Features (2)

1. **Keyboard Shortcuts (Space/Esc)** - No keyboard event listeners in timer code
2. **ZonedDateTime** - Backend uses LocalDateTime instead of timezone-aware dates

---

**BUGS TO FIX ASAP**

- sessions marked complete when stopping [x]
- new session started when paused [x]
- filtering by time in stats issue + quality measurement odd behaviour [x]
- edit goals
- filterbycategories in matrix

**To do (low priority)**

- Dark mode
- Mobile app (React Native)
- Team collaboration
- Integration with Slack, Jira, Trello
- Custom themes
- More chart types
- Voice commands
- Multi-language support
- category chips on matrix cards and task list
- edit, add, delete tasks on matrix cards
- potential refactoring: task card in task list and matrix, empty and error state
- loader skeleton
- pomodoro: timer stops when changing tabs
- sorting asc/desc
- session history doesn't automatically refresh after session complete
- possibility to archive tasks
- focus session timer on tab
- ux/ui: redo timer page- too vertical rn
- export better formatted csv
- Add keyboard shortcuts (Space to toggle, Esc to stop timer)
- Migrate to ZonedDateTime for multi-timezone support

## Research References

All productivity features are backed by research:

1. **Covey, S. R. (1989).** "The 7 Habits of Highly Effective People" - Eisenhower Matrix
2. **Cirillo, F. (2006).** "The Pomodoro Technique" - focus sessions
3. **Newport, C. (2016).** "Deep Work" - 4 hour optimal focus time
4. **Sweller, J. (1988).** "Cognitive Load Theory" - task limits
5. **Maslach, C. (1981).** "Burnout Inventory" - overwork detection
6. **Locke & Latham (1990).** "Goal Setting Theory" - goal tracking
7. **Ultradian Rhythms Research** - 90-minute focus cycles (Flow State profile)
8. **DeskTime Study (2014)** - 52/17 work-break ratio (Deep Work profile)

**Last Updated:** 28 November 2025
