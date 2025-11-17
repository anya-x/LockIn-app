# Analytics API Documentation

## Overview
The Analytics API provides endpoints for tracking and analyzing user productivity metrics including tasks, focus sessions, and burnout risk.

## Base URL
```
http://localhost:8080/api/analytics
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Get Today's Analytics
Calculates and returns analytics for the current day.

**Endpoint:** `GET /analytics/today`

**Response:**
```json
{
  "date": "2024-01-15",
  "tasksCreated": 5,
  "tasksCompleted": 3,
  "tasksCompletedFromToday": 3,
  "completionRate": 60.0,
  "pomodorosCompleted": 4,
  "focusMinutes": 120,
  "breakMinutes": 20,
  "interruptedSessions": 1,
  "productivityScore": 75.5,
  "focusScore": 80.0,
  "burnoutRiskScore": 15.0,
  "lateNightSessions": 0,
  "overworkMinutes": 0,
  "consecutiveWorkDays": 3,
  "morningFocusMinutes": 60,
  "afternoonFocusMinutes": 60,
  "eveningFocusMinutes": 0,
  "nightFocusMinutes": 0,
  "urgentImportantCount": 2,
  "notUrgentImportantCount": 3,
  "urgentNotImportantCount": 1,
  "notUrgentNotImportantCount": 0
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing JWT token

---

### Get Analytics Range
Returns analytics for a specified number of days.

**Endpoint:** `GET /analytics/range?days={number}`

**Query Parameters:**
- `days` (required) - Number of days to retrieve (e.g., 7, 30)

**Example Request:**
```
GET /analytics/range?days=7
```

**Response:**
Array of DailyAnalytics objects (same structure as /today)

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid days parameter
- `401 Unauthorized` - Invalid or missing JWT token

---

### Calculate Analytics for Specific Date
Triggers analytics calculation for a specific date.

**Endpoint:** `POST /analytics/calculate/{date}`

**Path Parameters:**
- `date` (required) - Date in ISO format (YYYY-MM-DD)

**Example Request:**
```
POST /analytics/calculate/2024-01-15
```

**Response:**
DailyAnalytics object for the specified date

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid date format
- `401 Unauthorized` - Invalid or missing JWT token

---

### Get Weekly Report
Generates a comprehensive weekly performance report.

**Endpoint:** `GET /analytics/weekly-report`

**Response:**
```json
{
  "weekStart": "2024-01-08",
  "weekEnd": "2024-01-14",
  "totalTasksCompleted": 25,
  "totalPomodoros": 20,
  "totalFocusMinutes": 600,
  "averageProductivityScore": 72.5,
  "averageBurnoutRisk": 18.0,
  "bestDay": {
    "date": "2024-01-10",
    "score": 85.0,
    "reason": "Highest productivity score"
  },
  "worstDay": {
    "date": "2024-01-12",
    "score": 45.0,
    "reason": "Lowest productivity score"
  },
  "productivityTrend": "IMPROVING",
  "focusTrend": "STABLE",
  "recommendations": [
    "Great week! Your productivity is trending upward.",
    "Consider taking breaks to avoid burnout."
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `204 No Content` - No data available for the week
- `401 Unauthorized` - Invalid or missing JWT token

---

### Compare Periods
Compares analytics between two time periods.

**Endpoint:** `POST /analytics/compare`

**Request Body:**
```json
{
  "currentStart": "2024-01-08",
  "currentEnd": "2024-01-14",
  "previousStart": "2024-01-01",
  "previousEnd": "2024-01-07"
}
```

**Response:**
```json
{
  "current": { /* DailyAnalytics object */ },
  "previous": { /* DailyAnalytics object */ },
  "tasksChange": 15.5,
  "productivityChange": 10.2,
  "focusChange": -5.0,
  "burnoutChange": 2.5,
  "tasksTrend": "up",
  "productivityTrend": "up",
  "focusTrend": "down",
  "burnoutTrend": "stable"
}
```

**Trend Values:**
- `up` - Increased by >5%
- `down` - Decreased by >5%
- `stable` - Changed by <5%

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid date range
- `401 Unauthorized` - Invalid or missing JWT token

---

### Get Productivity Insights
Returns insights based on 30-day historical analysis.

**Endpoint:** `GET /analytics/insights`

**Response:**
```json
{
  "mostProductiveDay": "WEDNESDAY",
  "bestTimeOfDay": "morning",
  "averageSessionLength": 30,
  "completionRateTrend": 5.2,
  "averageProductivityScore": 75.0,
  "totalDaysAnalyzed": 25
}
```

**Fields:**
- `mostProductiveDay` - Day of week with highest productivity
- `bestTimeOfDay` - Time period (morning/afternoon/evening/night)
- `averageSessionLength` - Average focus session in minutes
- `completionRateTrend` - Percentage change in completion rate
- `averageProductivityScore` - Overall productivity average
- `totalDaysAnalyzed` - Number of days with data

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Invalid or missing JWT token

---

### Refresh Cache
Invalidates analytics cache to force recalculation.

**Endpoint:** `POST /analytics/refresh`

**Response:**
```
200 OK
```

**Use Case:**
Call this after manually updating tasks or sessions to ensure analytics reflect latest data.

**Status Codes:**
- `200 OK` - Cache cleared successfully
- `401 Unauthorized` - Invalid or missing JWT token

---

## Error Responses

All endpoints may return these error formats:

**400 Bad Request:**
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid date format",
  "path": "/api/analytics/calculate/invalid-date"
}
```

**401 Unauthorized:**
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "JWT token is invalid or expired",
  "path": "/api/analytics/today"
}
```

**500 Internal Server Error:**
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "path": "/api/analytics/today"
}
```

## Caching

The API uses Spring @Cacheable for performance optimization:

- **Daily Analytics**: Cached for 5 minutes
- **Period Analytics**: Cached for 1 hour
- **Insights**: Cached for 1 hour
- **Weekly Report**: Cached for 1 hour

Use the `/refresh` endpoint to clear cache when needed.

## Rate Limiting

Currently no rate limiting is implemented. This may be added in future versions.

## Scoring Algorithms

### Productivity Score (0-100)
- **40%** - Task completion rate
- **40%** - Focus time (optimal: 240 minutes)
- **20%** - Work-break balance (ideal ratio: 0.15-0.25)

### Burnout Risk Score (0-100)
- **40 points max** - Overwork (>60 min over healthy limit)
- **30 points max** - Late night sessions (2+ after 10 PM)
- **20 points max** - High interruption rate (>50%)
- **10 points** - Low productivity (<30)
- **10 points** - Consecutive work days (7+)

### Focus Score (0-100)
- **Optimal zone**: 240 minutes (100 points)
- **Diminishing returns**: 240-360 minutes (100-80 points)
- **Over-focus penalty**: >360 minutes (decreasing below 80)

## Notes

- All dates use ISO 8601 format (YYYY-MM-DD)
- All timestamps are in UTC
- Analytics are calculated automatically at 2:00 AM daily
- Goal progress updates run at 2:30 AM daily
