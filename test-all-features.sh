#!/bin/bash

# LockIn App - Comprehensive Feature Testing Script
# This script tests ALL features from the beginning to ensure everything works

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Base URL
BASE_URL="http://localhost:8080"

# Test user credentials
TEST_EMAIL="test@lockin.app"
TEST_PASSWORD="Test123!"
TOKEN=""
USER_ID=""

echo "================================================"
echo "LockIn App - Comprehensive Feature Test Suite"
echo "================================================"
echo ""

# Helper functions
pass_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓${NC} $1"
}

fail_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}✗${NC} $1"
    echo -e "${RED}  Error: $2${NC}"
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "$expected_status" ]; then
        pass_test "$description"
        echo "$body"
    else
        fail_test "$description" "Expected $expected_status, got $http_code"
        echo "$body" | head -5
    fi
}

check_service() {
    if curl -sf "$1" > /dev/null 2>&1; then
        pass_test "$2 is accessible"
    else
        fail_test "$2 is not accessible" "Cannot reach $1"
    fi
}

echo "Step 1: Checking infrastructure services..."
echo "---------------------------------------------"
check_service "$BASE_URL/actuator/health" "Spring Boot Application"
check_service "http://localhost:9090/-/healthy" "Prometheus"
check_service "http://localhost:3001/api/health" "Grafana"
check_service "http://localhost:5432" "PostgreSQL" || echo -e "${YELLOW}  (Database runs on TCP, not HTTP - this is expected)${NC}"
echo ""

echo "Step 2: Testing observability endpoints..."
echo "-------------------------------------------"
test_endpoint "GET" "/actuator/health" "" "200" "Health check endpoint"
test_endpoint "GET" "/actuator/prometheus" "" "200" "Prometheus metrics endpoint"

# Check for custom metrics
echo ""
echo "Checking custom business metrics..."
METRICS=$(curl -s $BASE_URL/actuator/prometheus)
if echo "$METRICS" | grep -q "lockin_tasks_created_total"; then
    pass_test "Custom metric: lockin_tasks_created_total"
else
    fail_test "Custom metric: lockin_tasks_created_total" "Metric not found"
fi

if echo "$METRICS" | grep -q "lockin_focus_sessions_started_total"; then
    pass_test "Custom metric: lockin_focus_sessions_started_total"
else
    fail_test "Custom metric: lockin_focus_sessions_started_total" "Metric not found"
fi

if echo "$METRICS" | grep -q "lockin_goals_created_total"; then
    pass_test "Custom metric: lockin_goals_created_total"
else
    fail_test "Custom metric: lockin_goals_created_total" "Metric not found"
fi
echo ""

echo "Step 3: Testing authentication..."
echo "----------------------------------"

# Register new user
echo "Registering test user..."
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"testuser_$$\",\"email\":\"test_$$@lockin.app\",\"password\":\"Test123!\"}" \
    "$BASE_URL/api/auth/register")

REGISTER_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | head -n-1)

if [ "$REGISTER_CODE" = "201" ] || [ "$REGISTER_CODE" = "200" ]; then
    pass_test "User registration"
    TOKEN=$(echo "$REGISTER_BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    USER_ID=$(echo "$REGISTER_BODY" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo "  Token: ${TOKEN:0:20}..."
    echo "  User ID: $USER_ID"
else
    fail_test "User registration" "HTTP $REGISTER_CODE"
    echo "$REGISTER_BODY" | head -5
    echo ""
    echo -e "${YELLOW}Trying to login with existing user...${NC}"

    # Try login instead
    LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        "$BASE_URL/api/auth/login")

    LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
    LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

    if [ "$LOGIN_CODE" = "200" ]; then
        pass_test "User login (fallback)"
        TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        USER_ID=$(echo "$LOGIN_BODY" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    else
        fail_test "User login (fallback)" "HTTP $LOGIN_CODE"
        echo -e "${RED}Cannot proceed without authentication${NC}"
        exit 1
    fi
fi
echo ""

echo "Step 4: Testing task management (CRUD)..."
echo "------------------------------------------"

# Create task
TASK_DATA='{"title":"Test Task","description":"Testing task creation","isUrgent":true,"isImportant":false,"status":"TODO","dueDate":"2025-12-31T23:59:59"}'
TASK_RESPONSE=$(test_endpoint "POST" "/api/tasks" "$TASK_DATA" "201" "Create task")
TASK_ID=$(echo "$TASK_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "  Task ID: $TASK_ID"

# Get all tasks
test_endpoint "GET" "/api/tasks" "" "200" "Get all user tasks"

# Get specific task
test_endpoint "GET" "/api/tasks/$TASK_ID" "" "200" "Get specific task"

# Update task
UPDATE_DATA='{"title":"Updated Task","description":"Updated description","isUrgent":false,"isImportant":true,"status":"IN_PROGRESS","dueDate":"2025-12-31T23:59:59"}'
test_endpoint "PUT" "/api/tasks/$TASK_ID" "$UPDATE_DATA" "200" "Update task"

# Complete task
COMPLETE_DATA='{"title":"Updated Task","description":"Updated description","isUrgent":false,"isImportant":true,"status":"COMPLETED","dueDate":"2025-12-31T23:59:59"}'
test_endpoint "PUT" "/api/tasks/$TASK_ID" "$COMPLETE_DATA" "200" "Complete task (triggers metrics)"

# Get task statistics
test_endpoint "GET" "/api/tasks/statistics" "" "200" "Get task statistics"
echo ""

echo "Step 5: Testing categories..."
echo "------------------------------"

# Create category
CATEGORY_DATA='{"name":"Work","color":"#FF5733","icon":"💼"}'
CAT_RESPONSE=$(test_endpoint "POST" "/api/categories" "$CATEGORY_DATA" "201" "Create category")
CATEGORY_ID=$(echo "$CAT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

# Get categories
test_endpoint "GET" "/api/categories" "" "200" "Get all categories"

# Update category
UPDATE_CAT='{"name":"Work Updated","color":"#00FF00","icon":"💻"}'
test_endpoint "PUT" "/api/categories/$CATEGORY_ID" "$UPDATE_CAT" "200" "Update category"
echo ""

echo "Step 6: Testing goals..."
echo "------------------------"

# Create goal
GOAL_DATA='{"title":"Complete 10 tasks","description":"Weekly goal","targetValue":10,"currentValue":0,"category":"TASKS","startDate":"2025-01-01","endDate":"2025-01-07","completed":false}'
GOAL_RESPONSE=$(test_endpoint "POST" "/api/goals" "$GOAL_DATA" "201" "Create goal")
GOAL_ID=$(echo "$GOAL_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

# Get goals
test_endpoint "GET" "/api/goals" "" "200" "Get all goals"

# Update goal
UPDATE_GOAL='{"title":"Complete 10 tasks","description":"Weekly goal updated","targetValue":10,"currentValue":5,"category":"TASKS","startDate":"2025-01-01","endDate":"2025-01-07","completed":false}'
test_endpoint "PUT" "/api/goals/$GOAL_ID" "$UPDATE_GOAL" "200" "Update goal"
echo ""

echo "Step 7: Testing focus sessions..."
echo "----------------------------------"

# Start focus session
SESSION_DATA='{"duration":25,"taskId":'$TASK_ID'}'
SESSION_RESPONSE=$(test_endpoint "POST" "/api/focus-sessions/start" "$SESSION_DATA" "201" "Start focus session")
SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "  Session ID: $SESSION_ID"

# Get active session
test_endpoint "GET" "/api/focus-sessions/active" "" "200" "Get active session"

# Complete session (after a short wait)
echo "  Waiting 2 seconds to simulate session duration..."
sleep 2
test_endpoint "POST" "/api/focus-sessions/$SESSION_ID/complete" "" "200" "Complete focus session (triggers metrics)"

# Get session history
test_endpoint "GET" "/api/focus-sessions/history" "" "200" "Get focus session history"
echo ""

echo "Step 8: Testing analytics..."
echo "-----------------------------"

# Get daily analytics
test_endpoint "GET" "/api/analytics/daily" "" "200" "Get daily analytics"

# Get period comparison
test_endpoint "GET" "/api/analytics/comparison?period=WEEK" "" "200" "Get weekly comparison"

# Get achievements
test_endpoint "GET" "/api/achievements" "" "200" "Get achievements"
echo ""

echo "Step 9: Testing notifications..."
echo "---------------------------------"

# Get notifications
test_endpoint "GET" "/api/notifications" "" "200" "Get notifications"

# Get unread count
test_endpoint "GET" "/api/notifications/unread/count" "" "200" "Get unread count"
echo ""

echo "Step 10: Testing Eisenhower Matrix..."
echo "--------------------------------------"

# Get matrix
test_endpoint "GET" "/api/tasks/matrix" "" "200" "Get Eisenhower Matrix"

# Get tasks by quadrant
test_endpoint "GET" "/api/tasks/quadrant?isUrgent=true&isImportant=true" "" "200" "Get urgent & important tasks"
echo ""

echo "Step 11: Verifying metrics were recorded..."
echo "--------------------------------------------"

# Check metrics again to verify they incremented
FINAL_METRICS=$(curl -s $BASE_URL/actuator/prometheus)

# Extract metric values
TASKS_CREATED=$(echo "$FINAL_METRICS" | grep "lockin_tasks_created_total" | grep -v "#" | awk '{print $2}')
TASKS_COMPLETED=$(echo "$FINAL_METRICS" | grep "lockin_tasks_completed_total" | grep -v "#" | awk '{print $2}')
SESSIONS_STARTED=$(echo "$FINAL_METRICS" | grep "lockin_focus_sessions_started_total" | grep -v "#" | awk '{print $2}')
SESSIONS_COMPLETED=$(echo "$FINAL_METRICS" | grep "lockin_focus_sessions_completed_total" | grep -v "#" | awk '{print $2}')
GOALS_CREATED=$(echo "$FINAL_METRICS" | grep "lockin_goals_created_total" | grep -v "#" | awk '{print $2}')

echo "Metric values after tests:"
echo "  Tasks created: $TASKS_CREATED"
echo "  Tasks completed: $TASKS_COMPLETED"
echo "  Focus sessions started: $SESSIONS_STARTED"
echo "  Focus sessions completed: $SESSIONS_COMPLETED"
echo "  Goals created: $GOALS_CREATED"

if [ ! -z "$TASKS_CREATED" ] && [ "$TASKS_CREATED" != "0" ]; then
    pass_test "Tasks created metric is recording"
else
    fail_test "Tasks created metric is recording" "Value is $TASKS_CREATED"
fi

if [ ! -z "$TASKS_COMPLETED" ] && [ "$TASKS_COMPLETED" != "0" ]; then
    pass_test "Tasks completed metric is recording"
else
    fail_test "Tasks completed metric is recording" "Value is $TASKS_COMPLETED"
fi
echo ""

echo "Step 12: Verifying Prometheus is scraping..."
echo "---------------------------------------------"

# Check Prometheus targets
PROM_TARGETS=$(curl -s http://localhost:9090/api/v1/targets)
if echo "$PROM_TARGETS" | grep -q "lockin-app"; then
    pass_test "Prometheus has lockin-app target configured"

    # Check if target is UP
    if echo "$PROM_TARGETS" | grep -q '"health":"up"'; then
        pass_test "Prometheus target is UP"
    else
        fail_test "Prometheus target is UP" "Target is DOWN"
    fi
else
    fail_test "Prometheus has lockin-app target configured" "Target not found"
fi

# Query Prometheus for our metrics
PROM_QUERY=$(curl -s "http://localhost:9090/api/v1/query?query=lockin_tasks_created_total")
if echo "$PROM_QUERY" | grep -q "lockin_tasks_created_total"; then
    pass_test "Prometheus is successfully scraping our metrics"
else
    fail_test "Prometheus is successfully scraping our metrics" "Metrics not found in Prometheus"
fi
echo ""

echo "Step 13: Testing cleanup..."
echo "---------------------------"

# Delete task
test_endpoint "DELETE" "/api/tasks/$TASK_ID" "" "204" "Delete task"

# Delete category
test_endpoint "DELETE" "/api/categories/$CATEGORY_ID" "" "204" "Delete category"

# Delete goal
test_endpoint "DELETE" "/api/goals/$GOAL_ID" "" "204" "Delete goal"
echo ""

echo "================================================"
echo "TEST SUMMARY"
echo "================================================"
echo ""
echo "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
fi
echo ""

PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "Pass rate: $PASS_RATE%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}SUCCESS!${NC} All features are working correctly! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Check Grafana dashboard: http://localhost:3001"
    echo "2. Check Prometheus metrics: http://localhost:9090"
    echo "3. View logs in the backend console (JSON format)"
    echo "4. Try the frontend application to test UI features"
    exit 0
else
    echo -e "${YELLOW}PARTIAL SUCCESS${NC}"
    echo ""
    echo "Some tests failed. Review the output above for details."
    echo ""
    echo "Common issues:"
    echo "- Application not fully started (wait longer)"
    echo "- Database connection issues"
    echo "- Missing dependencies"
    echo "- Port conflicts"
    exit 1
fi
