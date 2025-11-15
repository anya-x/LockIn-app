# LockIn App - Build and Run Guide

Complete instructions for building, running, and verifying the LockIn application with Phase 1 Observability features.

## Prerequisites

Ensure you have the following installed:

- **Java 21** (or Java 17+)
- **Maven 3.8+**
- **Docker** (with Docker Compose)
- **curl** (for testing)
- **Python 3** (for validation scripts)

### Check prerequisites:
```bash
java -version       # Should show Java 21 or 17+
mvn -version        # Should show Maven 3.8+
docker --version    # Should show Docker 20.10+
docker compose version
```

---

## Quick Start (TL;DR)

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Build and run the application
cd backend
./mvnw spring-boot:run

# 3. Access the dashboards
# Grafana: http://localhost:3001 (admin/lockin123)
# Prometheus: http://localhost:9090
# App Health: http://localhost:8080/actuator/health
```

---

## Detailed Setup

### Step 1: Start the Database and Monitoring Stack

```bash
# From project root
docker compose up -d

# Verify services are running
docker compose ps

# Expected output:
# NAME                  STATUS              PORTS
# lockin-postgres       Up (healthy)        0.0.0.0:5432->5432/tcp
# lockin-prometheus     Up                  0.0.0.0:9090->9090/tcp
# lockin-grafana        Up                  0.0.0.0:3001->3000/tcp
```

**Wait 30 seconds** for services to fully initialize.

### Step 2: Verify Monitoring Services

```bash
# Check Prometheus is running
curl http://localhost:9090/-/healthy
# Should return: Prometheus Server is Healthy.

# Check Grafana is running
curl http://localhost:3001/api/health
# Should return: {"database":"ok"}
```

### Step 3: Build the Spring Boot Application

```bash
cd backend

# Clean and compile
./mvnw clean compile

# Run tests (optional)
./mvnw test

# Build JAR
./mvnw package -DskipTests
```

**Expected output:**
```
[INFO] BUILD SUCCESS
[INFO] Total time: 45.678 s
```

### Step 4: Run the Application

#### Option A: Using Maven (Development)

```bash
cd backend
./mvnw spring-boot:run
```

#### Option B: Using JAR (Production-like)

```bash
cd backend
java -jar target/lockin-app-0.0.1-SNAPSHOT.jar
```

#### Option C: With Production Logging (JSON format)

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

**Wait for startup message:**
```
Started LockinAppApplication in 8.234 seconds
```

### Step 5: Verify Application Health

```bash
# Check application health
curl http://localhost:8080/actuator/health

# Expected output:
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "diskSpace": {"status": "UP"},
    "ping": {"status": "UP"}
  }
}
```

### Step 6: Verify Metrics Endpoint

```bash
# Get all Prometheus metrics
curl http://localhost:8080/actuator/prometheus

# Check for custom business metrics
curl http://localhost:8080/actuator/prometheus | grep lockin_

# You should see:
# lockin_tasks_created_total
# lockin_tasks_completed_total
# lockin_tasks_deleted_total
# lockin_focus_sessions_started_total
# lockin_focus_sessions_completed_total
# lockin_focus_session_duration_seconds
# lockin_goals_created_total
# lockin_goals_achieved_total
# lockin_categories_created_total
```

### Step 7: Verify Prometheus is Scraping

1. Open Prometheus: http://localhost:9090
2. Go to **Status → Targets**
3. Look for the `lockin-app` target
4. **State should be "UP"** with green indicator

**Query metrics:**
```promql
# Go to Graph tab
lockin_tasks_created_total
rate(lockin_tasks_created_total[1m]) * 60
```

### Step 8: Access Grafana Dashboard

1. Open Grafana: http://localhost:3001
2. Login:
   - Username: `admin`
   - Password: `lockin123`
3. Navigate to **Dashboards**
4. Open **"LockIn Task Manager - Production Metrics"**

**Expected panels:**
- Tasks Created vs Completed
- Focus Session Completion Rate
- API Response Time percentiles
- HTTP Request & Error Rate
- JVM Memory Usage
- Database Connection Pool
- And more...

---

## Testing the Observability Features

### Test 1: Create Tasks and Watch Metrics

1. Create a task via the API:
```bash
# First, get a JWT token (adjust credentials as needed)
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# Create a task
curl -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Observability",
    "description": "Testing metrics collection",
    "status": "TODO"
  }'
```

2. Check the metric incremented:
```bash
curl http://localhost:8080/actuator/prometheus | grep lockin_tasks_created_total
# Should show: lockin_tasks_created_total{...} 1.0
```

3. **Watch it update in Grafana:**
   - Open the dashboard
   - Watch the "Tasks Created vs Completed" panel
   - The line should go up!

### Test 2: API Response Time Monitoring

```bash
# Make several API calls
for i in {1..10}; do
  curl -s http://localhost:8080/actuator/health > /dev/null
  sleep 0.5
done

# Check response time metrics in Prometheus:
# Go to http://localhost:9090 and query:
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[1m]))
```

### Test 3: Structured Logging

With the app running in production mode:

```bash
# Start with production profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod

# Create a task (as above)

# Check logs - should see JSON:
{
  "timestamp": "2025-11-15T15:30:45.123Z",
  "level": "INFO",
  "logger": "com.lockin.lockin_app.service.TaskService",
  "message": "Created task successfully",
  "userId": "123",
  "operation": "createTask",
  "taskId": "456"
}
```

### Test 4: Alerting Rules

```bash
# Check alert rules are loaded in Prometheus
curl http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[].name'

# Expected alerts:
# - HighErrorRate
# - SlowResponseTime
# - LowFocusSessionCompletion
# - DatabaseConnectionPoolExhausted
# - HighMemoryUsage
# - NoTaskActivityDetected
```

---

## Automated Verification

Run the comprehensive verification script:

```bash
./verify-setup.sh
```

This script will:
- ✓ Check all prerequisites
- ✓ Validate configuration files
- ✓ Verify Docker services
- ✓ Test Spring Boot endpoints
- ✓ Confirm custom metrics
- ✓ Verify Prometheus scraping
- ✓ Check Grafana accessibility

---

## Troubleshooting

### Problem: Maven build fails

**Solution:**
```bash
# Clear Maven cache and retry
rm -rf ~/.m2/repository
./mvnw clean install -U
```

### Problem: Port already in use

**Solution:**
```bash
# Check what's using the port (example: 8080)
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or change the port in application.yml
server:
  port: 8081  # Use different port
```

### Problem: Docker services won't start

**Solution:**
```bash
# Stop all services
docker compose down

# Remove volumes and restart
docker compose down -v
docker compose up -d

# Check logs
docker compose logs -f
```

### Problem: Prometheus shows target as DOWN

**Symptoms:**
- Prometheus UI shows `lockin-app` target with red "DOWN" status
- Error: "Get 'http://host.docker.internal:8080/actuator/prometheus': dial tcp: lookup host.docker.internal: no such host"

**Solution:**

On Linux, Docker's `host.docker.internal` doesn't exist by default. Fix the Prometheus configuration:

```bash
# Option 1: Use host network mode (Linux only)
# Edit docker-compose.yml:
services:
  prometheus:
    network_mode: "host"
    # Change target in prometheus.yml to:
    # - targets: ['localhost:8080']

# Option 2: Use container networking
# Edit monitoring/prometheus.yml:
scrape_configs:
  - job_name: 'lockin-app'
    static_configs:
      - targets: ['172.17.0.1:8080']  # Docker bridge IP on Linux

# Option 3: Add extra_hosts to docker-compose.yml
services:
  prometheus:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

After changes:
```bash
docker compose down
docker compose up -d
```

### Problem: Metrics not showing up

**Solution:**
```bash
# Restart application to ensure MetricsService is initialized
./mvnw spring-boot:run

# Check actuator endpoint directly
curl http://localhost:8080/actuator/prometheus | grep lockin

# Verify services are injected (check application logs for errors)
```

### Problem: Grafana dashboard is empty

**Solution:**
```bash
# 1. Verify Prometheus datasource
# Go to Grafana > Configuration > Data Sources
# Test connection to Prometheus

# 2. Check Prometheus has data
# Go to http://localhost:9090
# Run query: up{job="lockin-app"}
# Should return: up{...} 1

# 3. Re-import dashboard
# Dashboards > Import > Upload lockin-dashboard.json
```

---

## Performance Benchmarking

Test the application under load:

```bash
# Install Apache Bench (if needed)
sudo apt-get install apache2-utils

# Run load test
ab -n 1000 -c 10 http://localhost:8080/actuator/health

# Watch metrics in Grafana during the test:
# - API Response Time should spike
# - HTTP Request Rate should increase
# - JVM Memory might increase slightly
```

---

## Stopping the Application

```bash
# Stop Spring Boot (Ctrl+C in terminal)

# Stop Docker services
docker compose down

# Or stop but keep data
docker compose stop
```

---

## Next Steps

Once everything is verified:

1. **Take screenshots** of the Grafana dashboard for your portfolio
2. **Practice explaining** the observability setup in interviews
3. **Experiment with queries** in Prometheus to understand the data
4. **Proceed to Phase 2:** AWS Infrastructure with Terraform
5. **Continue to Phase 3:** CI/CD Pipeline with GitHub Actions

---

## Quick Reference

### Useful URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Spring Boot App | http://localhost:8080 | - |
| Actuator Health | http://localhost:8080/actuator/health | - |
| Prometheus Metrics | http://localhost:8080/actuator/prometheus | - |
| Prometheus UI | http://localhost:9090 | - |
| Grafana Dashboard | http://localhost:3001 | admin/lockin123 |
| PostgreSQL | localhost:5432 | lockin_user/password123 |

### Useful Commands

```bash
# View application logs
docker compose logs -f

# Restart a specific service
docker compose restart prometheus

# Execute command in container
docker compose exec database psql -U lockin_user -d lockin_db

# Export Prometheus data
curl http://localhost:9090/api/v1/query?query=lockin_tasks_created_total

# Check memory usage
docker stats
```

### Example Prometheus Queries

```promql
# Task creation rate (per minute)
rate(lockin_tasks_created_total[1m]) * 60

# Focus session completion percentage
(rate(lockin_focus_sessions_completed_total[5m]) / rate(lockin_focus_sessions_started_total[5m])) * 100

# API P95 response time
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket{uri!~"/actuator.*"}[5m]))

# Database connection usage
hikaricp_connections_active / hikaricp_connections_max

# JVM heap usage percentage
(jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"}) * 100
```

---

## Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review logs: `docker compose logs` and application console output
3. Verify all services are running: `docker compose ps`
4. Check port availability: `lsof -i :8080` (and ports 9090, 3001, 5432)
5. Ensure network connectivity for Maven downloads

---

**Phase 1 Complete!** 🎉

Your LockIn app now has production-grade observability. When you're ready, proceed to Phase 2 for AWS deployment with Terraform.
