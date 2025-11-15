# LockIn Observability Stack

This directory contains the complete observability setup for the LockIn Task Manager application.

## Stack Components

- **Prometheus**: Time-series database for metrics
- **Grafana**: Visualization and dashboards
- **Spring Boot Actuator**: Exposes application metrics
- **Micrometer**: Metrics facade (like SLF4J for metrics)
- **Logback**: Structured JSON logging

## Quick Start

### 1. Start the monitoring stack:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Prometheus on port 9090
- Grafana on port 3001

### 2. Start the Spring Boot application:

```bash
cd backend
./mvnw spring-boot:run
```

### 3. Access the dashboards:

- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `lockin123`

- **Prometheus**: http://localhost:9090

- **Application Metrics**: http://localhost:8080/actuator/prometheus

## Custom Business Metrics

The application tracks these domain-specific metrics:

### Task Metrics
- `lockin_tasks_created_total` - Total tasks created
- `lockin_tasks_completed_total` - Total tasks completed
- `lockin_tasks_deleted_total` - Total tasks deleted

### Focus Session Metrics
- `lockin_focus_sessions_started_total` - Focus sessions started
- `lockin_focus_sessions_completed_total` - Focus sessions completed
- `lockin_focus_session_duration_seconds` - Session duration distribution

### Goal Metrics
- `lockin_goals_created_total` - Goals created
- `lockin_goals_achieved_total` - Goals achieved

### Category Metrics
- `lockin_categories_created_total` - Categories created

## Example Prometheus Queries

### Task creation rate (per minute):
```promql
rate(lockin_tasks_created_total[1m]) * 60
```

### Focus session completion rate (%):
```promql
(rate(lockin_focus_sessions_completed_total[5m]) / rate(lockin_focus_sessions_started_total[5m])) * 100
```

### API P95 response time:
```promql
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket{uri!~"/actuator.*"}[5m]))
```

### Database connection pool usage:
```promql
hikaricp_connections_active / hikaricp_connections_max
```

## Alerting Rules

Configured alerts include:

- **HighErrorRate**: Triggers when 5xx errors exceed 0.1/second for 2 minutes
- **SlowResponseTime**: P95 latency > 2 seconds for 5 minutes
- **LowFocusSessionCompletion**: < 50% session completion for 30 minutes
- **DatabaseConnectionPoolExhausted**: > 90% connections in use
- **HighMemoryUsage**: JVM heap > 90% for 10 minutes

## Structured Logging

### Development Environment
Human-readable console logs:
```
15:30:45.123 [http-nio-8080-exec-1] INFO  c.l.l.service.TaskService - Creating task for user: 123
```

### Production Environment
JSON structured logs with MDC context:
```json
{
  "timestamp": "2025-11-15T15:30:45.123Z",
  "level": "INFO",
  "logger": "com.lockin.lockin_app.service.TaskService",
  "message": "Creating task for user: 123",
  "service": "lockin-task-manager",
  "environment": "production",
  "userId": "123",
  "operation": "createTask",
  "taskId": "456"
}
```

Activate production logging:
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

## Grafana Dashboard

The auto-provisioned dashboard includes:

1. **Tasks Created vs Completed** - Track task lifecycle
2. **Focus Session Completion Rate** - User engagement gauge
3. **API Response Times** - P50, P95, P99 percentiles
4. **HTTP Request & Error Rates** - Traffic patterns
5. **JVM Memory Usage** - Resource monitoring
6. **Database Connection Pool** - Database health
7. **Top 5 Slowest Endpoints** - Performance bottlenecks

## Testing the Setup

### 1. Verify Prometheus is scraping:
```bash
curl http://localhost:9090/api/v1/targets
```

Look for `lockin-app` target with state "UP"

### 2. Check metrics are exposed:
```bash
curl http://localhost:8080/actuator/prometheus | grep lockin_tasks
```

Should show your custom metrics.

### 3. Create some tasks via API:
```bash
# Login to get JWT token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"password"}'

# Create a task (use token from above)
curl -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"Testing metrics"}'
```

### 4. Watch metrics update:
```bash
curl http://localhost:8080/actuator/prometheus | grep lockin_tasks_created_total
```

The counter should increment!

## Portfolio Value

This observability setup demonstrates:

1. **Production-Ready Mindset**: Not just building features, but ensuring they're observable
2. **Custom Metrics**: Understanding what matters to the business, not just default JVM metrics
3. **Infrastructure as Code**: Auto-provisioned dashboards and datasources
4. **Alerting**: Proactive monitoring with meaningful thresholds
5. **Structured Logging**: Machine-readable logs for production debugging
6. **Industry Standards**: Prometheus + Grafana is the de-facto observability stack

## Next Steps

- [ ] Set up ELK stack for log aggregation
- [ ] Add distributed tracing with Zipkin/Jaeger
- [ ] Configure Prometheus Alertmanager for email/Slack notifications
- [ ] Add custom SLO/SLA dashboards
- [ ] Implement request tracing with correlation IDs
