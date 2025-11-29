# LockIn Task Manager

A science-based productivity application combining Eisenhower Matrix prioritization, Pomodoro time management, AI-powered assistance, and comprehensive analytics.

## Tech Stack

- **Backend:** Spring Boot 3.2, PostgreSQL 17, JWT Authentication, WebSocket
- **Frontend:** React 18, TypeScript, Material-UI v7, Vite, React Query
- **AI:** Claude API (Anthropic) for intelligent task management
- **Integrations:** Google Calendar OAuth2, Browser Notifications
- **Architecture:** RESTful API, Real-time WebSocket, Responsive SPA

## Prerequisites

- Java 17+
- Node.js 18+
- PostgreSQL 17
- Maven 3.9+

---

## Features Overview

### Month 1: Foundation (Commits 1-52)

- [x] User authentication (JWT-based login/register)
- [x] Basic task CRUD (create, read, update, delete)
- [x] React frontend with Material-UI v7
- [x] Spring Boot backend with PostgreSQL
- [x] Protected routes and API security
- [x] User model with firstName/lastName

### Month 2: Task Management (Commits 53-104)

- [x] Category system (CRUD, colors, emoji icons)
- [x] Eisenhower Matrix with drag-and-drop (@dnd-kit)
- [x] Advanced search (case-insensitive, debounced)
- [x] Filtering by status, category, urgency, importance
- [x] Task statistics dashboard
- [x] Pagination for task lists (10/20/50 items)
- [x] Task archiving with status restoration
- [x] Bulk actions (delete, complete, archive)

### Month 3: Pomodoro Timer (Commits 105-135)

- [x] Full Pomodoro timer (25/5/15 minute sessions)
- [x] FocusSession entity and tracking
- [x] Session history with notes
- [x] Task linking to sessions
- [x] Keyboard shortcuts (Space/Esc)
- [x] Browser notifications
- [x] Timer stats display
- [x] localStorage persistence
- [x] ZonedDateTime (timezone-aware)
- [x] Multiple focus profiles (Classic, Extended, Flow State, Quick Focus, Ultra Focus)

### Month 4: Analytics (Commits 136-190)

- [x] DailyAnalytics entity with aggregations
- [x] Productivity scoring algorithm (research-backed)
- [x] Burnout detection algorithm (Maslach-adapted)
- [x] Analytics dashboard with Recharts visualizations
- [x] Line, Area, and Bar charts
- [x] Productivity heatmap
- [x] Weekly reports with recommendations
- [x] Goal tracking system (Daily/Weekly/Monthly)
- [x] Scheduled analytics calculation (cron jobs)
- [x] Streak tracking (consecutive productive days)
- [x] Period comparison (week-over-week, month-over-month)
- [x] Task velocity metrics
- [x] CSV export for analytics data

### Month 5: AI & Integrations (Commits 191-251)

#### AI Features (Claude API)
- [x] Smart task breakdown (with prompt engineering)
- [x] Description enhancement
- [x] Daily AI briefing (personalized)
- [x] Response caching (40% cost savings)
- [x] Rate limiting (10 requests/day/user)
- [x] Usage tracking and cost monitoring

#### Google Calendar Integration
- [x] Full OAuth2 flow
- [x] Token encryption (AES-256)
- [x] Two-way sync (tasks to calendar events)
- [x] Duplicate event prevention
- [x] Calendar connection UI in settings

#### Notification System
- [x] WebSocket real-time delivery
- [x] Browser push notifications
- [x] Notification center drawer UI
- [x] Read/unread status tracking
- [x] Notification preferences per type

### Additional Features

- [x] Achievement/Badge system (Task, Focus, Goal milestones)
- [x] Theme customization (Indigo, Rose, Sage color themes)
- [x] Dark/Light mode toggle
- [x] GDPR compliance (data export, account deletion)
- [x] Today dashboard with priority tasks and AI briefing
- [x] Compact navigation drawer
- [x] Theme-aware color system for accessibility

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and receive JWT |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get paginated tasks |
| GET | `/api/tasks/{id}` | Get single task |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| GET | `/api/tasks/incomplete` | Get incomplete tasks |
| GET | `/api/tasks/statistics` | Get task statistics |
| GET | `/api/tasks/search?query={term}` | Search tasks |
| GET | `/api/tasks/filter` | Filter with multiple criteria |
| GET | `/api/tasks/quadrant` | Get tasks by matrix quadrant |
| GET | `/api/tasks/matrix` | Get complete Eisenhower matrix |
| PATCH | `/api/tasks/{id}/quadrant` | Move task between quadrants |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/{id}` | Get single category |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/{id}` | Update category |
| DELETE | `/api/categories/{id}` | Delete category |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | Get all goals |
| GET | `/api/goals/{id}` | Get single goal |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/{id}` | Update goal |
| DELETE | `/api/goals/{id}` | Delete goal |

### Focus Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | Get all sessions |
| POST | `/api/sessions/start` | Start new session |
| POST | `/api/sessions/{id}/complete` | Complete session |
| PUT | `/api/sessions/{id}` | Update session |
| PUT | `/api/sessions/{id}/notes` | Update session notes |
| GET | `/api/sessions/today` | Get today's session stats |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/today` | Get today's analytics |
| GET | `/api/analytics/range?days={n}` | Get analytics for date range |
| POST | `/api/analytics/calculate/{date}` | Calculate analytics for date |
| GET | `/api/analytics/weekly-report` | Get weekly performance report |
| GET | `/api/analytics/streak` | Get productivity streak |
| GET | `/api/analytics/comparison` | Get period comparison |
| GET | `/api/analytics/task-velocity` | Get task velocity metrics |

### Badges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/badges` | Get all badges |
| GET | `/api/badges?earnedOnly=true` | Get earned badges only |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get paginated notifications |
| GET | `/api/notifications/unread` | Get unread notifications |
| GET | `/api/notifications/unread/count` | Get unread count |
| PUT | `/api/notifications/{id}/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/{id}` | Delete notification |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/breakdown/{taskId}` | AI task breakdown |
| POST | `/api/ai/breakdown-preview` | Preview breakdown |
| POST | `/api/ai/enhance-description` | Enhance task description |
| POST | `/api/ai/daily-briefing` | Get AI daily briefing |

### User & Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/notification-preferences` | Get notification prefs |
| PUT | `/api/users/notification-preferences` | Update notification prefs |
| GET | `/api/users/export` | Export user data (GDPR) |
| DELETE | `/api/users` | Delete account (GDPR) |

### Google Calendar
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/connect` | Initiate OAuth flow |
| GET | `/api/calendar/oauth/callback` | OAuth callback |
| GET | `/api/calendar/events` | Get calendar events |
| POST | `/api/calendar/sync-task` | Sync task to calendar |
| GET | `/api/calendar/sync-status` | Get sync status |

---

## Application Views

| View | Description |
|------|-------------|
| **Today** | Daily dashboard with priority tasks, focus stats, AI briefing, streak display |
| **Tasks** | Full task management with filters, search, pagination, bulk actions |
| **Matrix** | Eisenhower Matrix with drag-and-drop prioritization |
| **Timer** | Pomodoro timer with profiles, session history, task linking |
| **Goals** | Goal tracking (Daily/Weekly/Monthly) with progress visualization |
| **Categories** | Category management with colors and emoji icons |
| **Insights** | Analytics dashboard with charts, heatmap, burnout alerts |
| **Badges** | Achievement system with earned/locked badge display |
| **Settings** | Theme, notifications, calendar integration, data privacy |

---

## Database Entities

| Entity | Description |
|--------|-------------|
| **User** | User account with preferences |
| **Task** | Task with status, priority flags, due date, category link |
| **Category** | Custom category with color and emoji |
| **FocusSession** | Pomodoro session with duration, notes, task link |
| **Goal** | Productivity goal with targets and progress |
| **Badge** | Achievement badge with earned status |
| **Notification** | User notification with read status |
| **DailyAnalytics** | Aggregated daily productivity metrics |
| **AIUsage** | AI feature usage and cost tracking |
| **GoogleCalendarToken** | OAuth tokens for calendar integration |

---

## Known Issues

- [ ] Drag and drop on mobile not working properly (touch events)
- [ ] Timer may pause when browser tab is inactive (browser throttling)
- [ ] Category filter doesn't refresh immediately after creating category with task

---

## Low Priority Backlog

- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] Integration with Slack, Jira, Trello
- [ ] Voice commands
- [ ] Multi-language support (i18n)
- [ ] More chart types in analytics
- [ ] Better formatted CSV exports
- [ ] Focus session timer in browser tab title

---

## Research References

All productivity features are backed by research:

1. **Covey, S. R. (1989).** "The 7 Habits of Highly Effective People" - Eisenhower Matrix
2. **Cirillo, F. (2006).** "The Pomodoro Technique" - Focus sessions
3. **Newport, C. (2016).** "Deep Work" - 4 hour optimal focus time
4. **Sweller, J. (1988).** "Cognitive Load Theory" - Task limits
5. **Maslach, C. (1981).** "Burnout Inventory" - Overwork detection
6. **Locke & Latham (1990).** "Goal Setting Theory" - Goal tracking

---

## Development Statistics

| Metric | Count |
|--------|-------|
| Total Commits | 251+ |
| Frontend Pages | 13 |
| Backend Controllers | 12 |
| Database Entities | 13 |
| Custom React Hooks | 15+ |
| API Endpoints | 50+ |

---

**Last Updated:** November 2025
