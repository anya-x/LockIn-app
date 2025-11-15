# LockIn App - Complete API Documentation

## Base URL
```
http://localhost:8080
```

## Authentication
All API endpoints (except `/api/auth/*`) require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 2. Task Management Endpoints

### Create Task
```http
POST /api/tasks
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Complete project documentation",
  "description": "Write API docs and README",
  "isUrgent": true,
  "isImportant": true,
  "status": "TODO",
  "dueDate": "2025-12-31T23:59:59",
  "categoryId": 1
}
```

**Observability:**
- Increments `lockin_tasks_created_total` metric
- Creates MDC context with `userId`, `taskId`, `operation`
- Triggers Google Calendar sync if configured

**Response (201):**
```json
{
  "id": 1,
  "title": "Complete project documentation",
  "description": "Write API docs and README",
  "isUrgent": true,
  "isImportant": true,
  "status": "TODO",
  "dueDate": "2025-12-31T23:59:59",
  "categoryId": 1,
  "createdAt": "2025-01-15T10:30:00",
  "googleEventId": "abc123xyz"
}
```

### Get All User Tasks
```http
GET /api/tasks
Authorization: Bearer <token>
```

**Performance:**
- Uses `@Timed` annotation to track `lockin.database.getUserTasks` metric
- Database query optimized with indexes on `user_id` and `created_at`

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "Complete project documentation",
    "description": "Write API docs and README",
    "isUrgent": true,
    "isImportant": true,
    "status": "TODO",
    "dueDate": "2025-12-31T23:59:59",
    "categoryId": 1,
    "createdAt": "2025-01-15T10:30:00"
  }
]
```

### Get Specific Task
```http
GET /api/tasks/{taskId}
Authorization: Bearer <token>
```

**Response (200):** Same as single task object above

### Update Task
```http
PUT /api/tasks/{taskId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Updated title",
  "description": "Updated description",
  "isUrgent": false,
  "isImportant": true,
  "status": "COMPLETED",
  "dueDate": "2025-12-31T23:59:59"
}
```

**Observability:**
- When status changes to `COMPLETED`, increments `lockin_tasks_completed_total` metric
- Updates goal progress automatically
- Syncs to Google Calendar if configured

**Response (200):** Updated task object

### Delete Task
```http
DELETE /api/tasks/{taskId}
Authorization: Bearer <token>
```

**Observability:**
- Increments `lockin_tasks_deleted_total` metric

**Response (204):** No content

### Get Task Statistics
```http
GET /api/tasks/statistics
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "totalTasks": 50,
  "completedTasks": 30,
  "pendingTasks": 15,
  "inProgressTasks": 5,
  "completionRate": 60.0,
  "averageCompletionTime": 3.5
}
```

### Get Eisenhower Matrix
```http
GET /api/tasks/matrix
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "urgentImportant": [...],
  "notUrgentImportant": [...],
  "urgentNotImportant": [...],
  "notUrgentNotImportant": [...]
}
```

### Get Tasks by Quadrant
```http
GET /api/tasks/quadrant?isUrgent=true&isImportant=true
Authorization: Bearer <token>
```

**Response (200):** Array of tasks matching the quadrant

---

## 3. Category Endpoints

### Create Category
```http
POST /api/categories
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Work",
  "color": "#FF5733",
  "icon": "💼"
}
```

**Observability:**
- Increments `lockin_categories_created_total` metric

**Response (201):**
```json
{
  "id": 1,
  "name": "Work",
  "color": "#FF5733",
  "icon": "💼",
  "taskCount": 0
}
```

### Get All Categories
```http
GET /api/categories
Authorization: Bearer <token>
```

**Response (200):** Array of category objects

### Update Category
```http
PUT /api/categories/{categoryId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Work Updated",
  "color": "#00FF00",
  "icon": "💻"
}
```

**Response (200):** Updated category object

### Delete Category
```http
DELETE /api/categories/{categoryId}
Authorization: Bearer <token>
```

**Response (204):** No content

---

## 4. Focus Session Endpoints

### Start Focus Session
```http
POST /api/focus-sessions/start
Content-Type: application/json
Authorization: Bearer <token>

{
  "duration": 25,
  "taskId": 1
}
```

**Observability:**
- Increments `lockin_focus_sessions_started_total` metric

**Response (201):**
```json
{
  "id": 1,
  "duration": 25,
  "taskId": 1,
  "startedAt": "2025-01-15T14:30:00",
  "completed": false
}
```

### Complete Focus Session
```http
POST /api/focus-sessions/{sessionId}/complete
Authorization: Bearer <token>
```

**Observability:**
- Increments `lockin_focus_sessions_completed_total` metric
- Records session duration in `lockin_focus_session_duration_seconds` histogram

**Response (200):**
```json
{
  "id": 1,
  "duration": 25,
  "taskId": 1,
  "startedAt": "2025-01-15T14:30:00",
  "completedAt": "2025-01-15T14:55:00",
  "actualDuration": 25.2,
  "completed": true
}
```

### Abandon Focus Session
```http
POST /api/focus-sessions/{sessionId}/abandon
Authorization: Bearer <token>
```

**Observability:**
- Increments `lockin_focus_sessions_abandoned_total` metric

**Response (200):** Session object with `abandoned: true`

### Get Active Session
```http
GET /api/focus-sessions/active
Authorization: Bearer <token>
```

**Response (200):** Current active session or `null`

### Get Session History
```http
GET /api/focus-sessions/history
Authorization: Bearer <token>
```

**Response (200):** Array of past focus sessions

---

## 5. Goal Endpoints

### Create Goal
```http
POST /api/goals
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Complete 50 tasks",
  "description": "Monthly productivity goal",
  "targetValue": 50,
  "currentValue": 0,
  "category": "TASKS",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "completed": false
}
```

**Observability:**
- Increments `lockin_goals_created_total` metric

**Response (201):** Goal object with id

### Get All Goals
```http
GET /api/goals
Authorization: Bearer <token>
```

**Response (200):** Array of goal objects

### Update Goal
```http
PUT /api/goals/{goalId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Complete 50 tasks",
  "description": "Updated description",
  "targetValue": 50,
  "currentValue": 25,
  "category": "TASKS",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "completed": false
}
```

**Observability:**
- When goal is marked `completed: true`, increments `lockin_goals_achieved_total` metric

**Response (200):** Updated goal object

### Delete Goal
```http
DELETE /api/goals/{goalId}
Authorization: Bearer <token>
```

**Response (204):** No content

---

## 6. Analytics Endpoints

### Get Daily Analytics
```http
GET /api/analytics/daily
Authorization: Bearer <token>
```

**Performance:**
- Uses database indexes on `user_id` and `created_at`
- Caches results for 5 minutes

**Response (200):**
```json
{
  "date": "2025-01-15",
  "tasksCompleted": 5,
  "focusMinutes": 125,
  "productivityScore": 85.5,
  "streakDays": 7
}
```

### Get Period Comparison
```http
GET /api/analytics/comparison?period=WEEK
Authorization: Bearer <token>
```

**Query Parameters:**
- `period`: `DAY`, `WEEK`, `MONTH`

**Response (200):**
```json
{
  "current": {
    "tasksCompleted": 25,
    "focusMinutes": 600,
    "productivityScore": 82.0
  },
  "previous": {
    "tasksCompleted": 20,
    "focusMinutes": 480,
    "productivityScore": 75.0
  },
  "percentageChange": {
    "tasks": 25.0,
    "focus": 25.0,
    "productivity": 9.3
  }
}
```

---

## 7. Achievement Endpoints

### Get Achievements
```http
GET /api/achievements
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "title": "First Task",
    "description": "Complete your first task",
    "icon": "🎯",
    "category": "TASKS",
    "earned": true,
    "earnedAt": "2025-01-15T10:30:00"
  },
  {
    "id": 2,
    "title": "Focus Master",
    "description": "Complete 10 focus sessions",
    "icon": "🧘",
    "category": "FOCUS",
    "earned": false,
    "progress": 5,
    "target": 10
  }
]
```

---

## 8. Notification Endpoints

### Get Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "type": "GOAL_ACHIEVED",
    "title": "Goal Completed!",
    "message": "You completed your weekly task goal",
    "read": false,
    "createdAt": "2025-01-15T16:00:00"
  }
]
```

### Get Unread Count
```http
GET /api/notifications/unread/count
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "count": 3
}
```

### Mark as Read
```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer <token>
```

**Response (200):** Updated notification

### Mark All as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer <token>
```

**Response (200):** Success message

---

## 9. Google Calendar Integration

### Get OAuth URL
```http
GET /api/calendar/auth-url
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### Handle OAuth Callback
```http
GET /api/calendar/callback?code=<auth-code>
Authorization: Bearer <token>
```

**Response (200):** Success message with connection status

### Get Connection Status
```http
GET /api/calendar/status
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "connected": true,
  "email": "user@gmail.com"
}
```

### Disconnect Calendar
```http
POST /api/calendar/disconnect
Authorization: Bearer <token>
```

**Response (200):** Success message

---

## 10. Observability Endpoints

### Health Check
```http
GET /actuator/health
```

**Response (200):**
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP"
    }
  }
}
```

### Prometheus Metrics
```http
GET /actuator/prometheus
```

**Response (200):** Prometheus-formatted metrics

**Key Custom Metrics:**
- `lockin_tasks_created_total` - Counter: Total tasks created
- `lockin_tasks_completed_total` - Counter: Total tasks completed
- `lockin_tasks_deleted_total` - Counter: Total tasks deleted
- `lockin_focus_sessions_started_total` - Counter: Focus sessions started
- `lockin_focus_sessions_completed_total` - Counter: Focus sessions completed
- `lockin_focus_sessions_abandoned_total` - Counter: Focus sessions abandoned
- `lockin_focus_session_duration_seconds` - Histogram: Session duration distribution
- `lockin_goals_created_total` - Counter: Goals created
- `lockin_goals_achieved_total` - Counter: Goals achieved
- `lockin_categories_created_total` - Counter: Categories created

**Standard Spring Boot Metrics:**
- `http_server_requests_seconds` - HTTP request latency (P50, P95, P99)
- `jvm_memory_used_bytes` - JVM memory usage
- `jvm_memory_max_bytes` - JVM max memory
- `hikaricp_connections_active` - Active DB connections
- `hikaricp_connections_idle` - Idle DB connections

### Application Info
```http
GET /actuator/info
```

**Response (200):**
```json
{
  "app": {
    "name": "LockIn Task Manager",
    "version": "1.0.0",
    "description": "Production-ready task management with observability"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "timestamp": "2025-01-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed: title is required",
  "path": "/api/tasks"
}
```

### 401 Unauthorized
```json
{
  "timestamp": "2025-01-15T10:30:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "path": "/api/tasks"
}
```

### 404 Not Found
```json
{
  "timestamp": "2025-01-15T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Task with id 999 not found",
  "path": "/api/tasks/999"
}
```

### 500 Internal Server Error
```json
{
  "timestamp": "2025-01-15T10:30:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Observability Features

### Structured Logging
All API requests generate structured JSON logs in production mode:
```json
{
  "@timestamp": "2025-01-15T10:30:00.123Z",
  "level": "INFO",
  "logger_name": "com.lockin.lockin_app.service.TaskService",
  "message": "Creating task for user: 1",
  "userId": "1",
  "operation": "createTask",
  "service": "lockin-task-manager",
  "environment": "production"
}
```

### MDC Context
The following fields are automatically added to logs:
- `userId` - Current user ID
- `operation` - Operation being performed
- `taskId` - Task ID (when applicable)

### Metrics Collection
All business operations automatically record metrics:
- Task creation, completion, deletion
- Focus session lifecycle
- Goal achievement
- Category management

### Performance Monitoring
- All API endpoints tracked with `http_server_requests_seconds` histogram
- Database queries timed with `@Timed` annotations
- Custom slow query alerts (>500ms)

---

## Testing with cURL

### Complete Flow Example
```bash
# 1. Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test123!"}'

# Save the token from response
TOKEN="<your-token-here>"

# 2. Create Task
curl -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"Testing","isUrgent":true,"isImportant":false,"status":"TODO"}'

# 3. Get Tasks
curl -X GET http://localhost:8080/api/tasks \
  -H "Authorization: Bearer $TOKEN"

# 4. Check Metrics
curl http://localhost:8080/actuator/prometheus | grep lockin_tasks
```

---

## Monitoring Stack

### Prometheus
- URL: `http://localhost:9090`
- Scrapes metrics every 5 seconds
- Retention: 15 days

### Grafana
- URL: `http://localhost:3001`
- Username: `admin`
- Password: `lockin123`
- Pre-configured dashboard with 10 panels

---

## Production Deployment Notes

1. **Authentication:** Use HTTPS in production
2. **Rate Limiting:** Consider adding rate limits to prevent abuse
3. **CORS:** Configure allowed origins in `application.yml`
4. **Database:** Use connection pooling (HikariCP configured)
5. **Caching:** Redis recommended for production caching
6. **Metrics:** Export to external monitoring (Datadog, New Relic, etc.)
7. **Logging:** Ship logs to ELK stack or CloudWatch
