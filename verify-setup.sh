#!/bin/bash

# LockIn App - Complete Verification Script
# This script verifies that Phase 1 (Observability) is working correctly

set -e  # Exit on any error

echo "================================================"
echo "LockIn App - Phase 1 Verification Script"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track success/failure
TOTAL_CHECKS=0
PASSED_CHECKS=0

check_command() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

check_file() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $1 is missing"
        return 1
    fi
}

check_service() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if curl -sf "$1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $2 is accessible"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $2 is not accessible at $1"
        return 1
    fi
}

echo "Step 1: Checking prerequisites..."
echo "-----------------------------------"
check_command "java"
check_command "mvn"
check_command "docker"
check_command "curl"
check_command "python3"
echo ""

echo "Step 2: Validating configuration files..."
echo "------------------------------------------"
check_file "backend/pom.xml"
check_file "backend/src/main/resources/application.yml"
check_file "backend/src/main/resources/logback-spring.xml"
check_file "docker-compose.yml"
check_file "monitoring/prometheus.yml"
check_file "monitoring/prometheus-rules.yml"
check_file "monitoring/grafana/provisioning/datasources/prometheus.yml"
check_file "monitoring/grafana/provisioning/dashboards/lockin-dashboard.json"
echo ""

echo "Step 3: Validating YAML syntax..."
echo "----------------------------------"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if python3 -c "import yaml; yaml.safe_load(open('backend/src/main/resources/application.yml'))" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} application.yml is valid YAML"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}✗${NC} application.yml has syntax errors"
fi

TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if python3 -c "import yaml; yaml.safe_load(open('monitoring/prometheus.yml'))" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} prometheus.yml is valid YAML"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}✗${NC} prometheus.yml has syntax errors"
fi
echo ""

echo "Step 4: Validating Java code structure..."
echo "------------------------------------------"
check_file "backend/src/main/java/com/lockin/lockin_app/service/MetricsService.java"
check_file "backend/src/main/java/com/lockin/lockin_app/config/MetricsConfig.java"
echo ""

echo "Step 5: Building the application..."
echo "------------------------------------"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
cd backend
if mvn clean compile -DskipTests > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Maven build successful"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${YELLOW}⚠${NC} Maven build failed (check network connection)"
    echo "  Run: cd backend && mvn clean compile -DskipTests"
fi
cd ..
echo ""

echo "Step 6: Starting Docker services..."
echo "------------------------------------"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if docker compose up -d > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker services started"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo "  Waiting for services to initialize..."
    sleep 10
else
    echo -e "${RED}✗${NC} Failed to start Docker services"
    echo "  Run: docker compose up -d"
fi
echo ""

echo "Step 7: Checking service health..."
echo "-----------------------------------"
check_service "http://localhost:5432" "PostgreSQL" || echo "  (Database may be running but not HTTP accessible)"
check_service "http://localhost:9090/-/healthy" "Prometheus"
check_service "http://localhost:3001/api/health" "Grafana"
echo ""

echo "Step 8: Starting Spring Boot application..."
echo "--------------------------------------------"
echo -e "${YELLOW}⚠${NC} Manual step required:"
echo "  In a separate terminal, run:"
echo "  cd backend && ./mvnw spring-boot:run"
echo ""
echo "  Press Enter when the application is running..."
read -p ""

echo "Step 9: Verifying Spring Boot Actuator..."
echo "------------------------------------------"
check_service "http://localhost:8080/actuator/health" "Spring Boot Health Endpoint"
check_service "http://localhost:8080/actuator/prometheus" "Spring Boot Prometheus Endpoint"
echo ""

echo "Step 10: Checking custom metrics..."
echo "------------------------------------"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if curl -s http://localhost:8080/actuator/prometheus | grep -q "lockin_tasks_created_total"; then
    echo -e "${GREEN}✓${NC} Custom metric 'lockin_tasks_created_total' found"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}✗${NC} Custom metric 'lockin_tasks_created_total' not found"
fi

TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if curl -s http://localhost:8080/actuator/prometheus | grep -q "lockin_focus_sessions_started_total"; then
    echo -e "${GREEN}✓${NC} Custom metric 'lockin_focus_sessions_started_total' found"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}✗${NC} Custom metric 'lockin_focus_sessions_started_total' not found"
fi

TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if curl -s http://localhost:8080/actuator/prometheus | grep -q "lockin_focus_session_duration_seconds"; then
    echo -e "${GREEN}✓${NC} Custom metric 'lockin_focus_session_duration_seconds' found"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}✗${NC} Custom metric 'lockin_focus_session_duration_seconds' not found"
fi
echo ""

echo "Step 11: Verifying Prometheus is scraping..."
echo "---------------------------------------------"
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
if curl -s http://localhost:9090/api/v1/targets | grep -q "lockin-app"; then
    echo -e "${GREEN}✓${NC} Prometheus is configured to scrape lockin-app"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}✗${NC} Prometheus scrape target not found"
fi

TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
SCRAPE_STATUS=$(curl -s http://localhost:9090/api/v1/targets | grep -o '"health":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ "$SCRAPE_STATUS" = "up" ]; then
    echo -e "${GREEN}✓${NC} Prometheus scrape target is UP"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}✗${NC} Prometheus scrape target is DOWN"
fi
echo ""

echo "Step 12: Verifying Grafana dashboard..."
echo "----------------------------------------"
check_service "http://localhost:3001/api/health" "Grafana API"
echo "  Login to Grafana at: http://localhost:3001"
echo "  Username: admin"
echo "  Password: lockin123"
echo ""

echo "Step 13: Testing metrics collection..."
echo "---------------------------------------"
echo "  Creating a test task to verify metrics increment..."
echo "  (You'll need to authenticate and create a task via the API or UI)"
echo ""

echo "================================================"
echo "VERIFICATION SUMMARY"
echo "================================================"
echo ""
echo "Passed: $PASSED_CHECKS / $TOTAL_CHECKS checks"
echo ""

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}SUCCESS!${NC} All checks passed! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Open Grafana: http://localhost:3001"
    echo "2. Open Prometheus: http://localhost:9090"
    echo "3. Create some tasks to see metrics update in real-time"
    echo "4. Check the dashboard panels update with your activity"
    exit 0
else
    echo -e "${YELLOW}PARTIAL SUCCESS${NC}"
    echo ""
    echo "Some checks failed. Review the output above."
    echo ""
    echo "Common issues:"
    echo "- Network connectivity for Maven downloads"
    echo "- Docker services not fully started (wait longer)"
    echo "- Spring Boot app not running (start manually)"
    echo "- Port conflicts (check if ports 8080, 9090, 3001, 5432 are free)"
    exit 1
fi
