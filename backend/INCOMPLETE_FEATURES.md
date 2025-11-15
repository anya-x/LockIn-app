# Incomplete Features

This document tracks features that were started but not yet completed.

## Work in Progress Features

### 1. Google Calendar Integration

**Status:** 🚧 Incomplete - Missing dependencies and implementation

**Files:**
- `src/main/java/com/lockin/lockin_app/controller/GoogleCalendarController.java.incomplete`
- `src/main/java/com/lockin/lockin_app/service/GoogleCalendarService.java.incomplete`

**Missing Components:**
- `GoogleCalendarToken` entity
- `GoogleCalendarTokenRepository` repository
- `TokenEncryptionService` for secure token storage
- Google Calendar API dependencies in pom.xml

**Required Dependencies:**
```xml
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.2.0</version>
</dependency>
<dependency>
    <groupId>com.google.apis</groupId>
    <artifactId>google-api-services-calendar</artifactId>
    <version>v3-rev20230825-2.0.0</version>
</dependency>
<dependency>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-oauth2-http</artifactId>
    <version>1.19.0</version>
</dependency>
```

**Implementation Plan:**
1. Create `GoogleCalendarToken` entity with encrypted token storage
2. Implement `TokenEncryptionService` using AES-256
3. Create `GoogleCalendarTokenRepository`
4. Add Google Calendar API dependencies to pom.xml
5. Complete OAuth2 flow implementation
6. Add calendar sync endpoints
7. Write tests for calendar integration
8. Update API documentation

**Why Disabled:**
- Missing critical components would prevent compilation
- Google Calendar API requires proper OAuth2 setup
- Token encryption needs secure key management
- Feature is non-essential for core application functionality

---

### 2. Real-Time Notifications (WebSocket)

**Status:** 🚧 Incomplete - Missing WebSocket dependency

**Files:**
- `src/main/java/com/lockin/lockin_app/service/NotificationService.java.incomplete`

**Missing Components:**
- Spring WebSocket dependency
- WebSocket configuration
- STOMP endpoint setup
- Frontend WebSocket client

**Required Dependencies:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

**Implementation Plan:**
1. Add spring-boot-starter-websocket dependency
2. Create WebSocket configuration class
3. Implement STOMP endpoints for real-time notifications
4. Add WebSocket security configuration
5. Create frontend WebSocket client
6. Test real-time notification delivery
7. Add reconnection logic for dropped connections

**Why Disabled:**
- Missing spring-boot-starter-websocket dependency
- WebSocket requires additional configuration
- Frontend integration not yet implemented
- Basic REST API notifications work for MVP

---

## Re-enabling Features

To re-enable these features:

1. **Rename files back:**
   ```bash
   cd backend/src/main/java/com/lockin/lockin_app
   mv controller/GoogleCalendarController.java.incomplete controller/GoogleCalendarController.java
   mv service/GoogleCalendarService.java.incomplete service/GoogleCalendarService.java
   mv service/NotificationService.java.incomplete service/NotificationService.java
   ```

2. **Add missing dependencies to `pom.xml`**

3. **Implement missing classes:**
   - `entity/GoogleCalendarToken.java`
   - `repository/GoogleCalendarTokenRepository.java`
   - `security/TokenEncryptionService.java`

4. **Run tests:**
   ```bash
   mvn clean test
   ```

5. **Update API documentation**

---

## Architecture Decision

**ADR Reference:** This relates to ADR-011 (Monolith Over Microservices)

**Decision:** Disable incomplete features rather than shipping broken code.

**Rationale:**
- CI/CD pipeline must pass with working code only
- Incomplete features create technical debt
- Better to ship working core features than broken advanced features
- Demonstrates professional software development practices

**Future Consideration:**
- Google Calendar integration is valuable for task management
- WebSocket notifications improve UX for real-time updates
- Both features should be implemented when bandwidth allows

---

## Current Feature Status

### ✅ Completed Features
- User authentication (JWT)
- Task management (CRUD)
- Category management
- Goal tracking
- Focus sessions
- Analytics and statistics
- Achievements system
- Eisenhower Matrix
- Observability (Prometheus/Grafana)
- REST API documentation

### 🚧 Incomplete Features
- Google Calendar integration
- Real-time WebSocket notifications

### 📋 Planned Features
- Email notifications
- Mobile app
- Pomodoro timer enhancements
- Team/shared tasks
- Task templates
- Export/import functionality

---

*Last updated: 2025-11-15*
*This document should be updated when features are completed or new incomplete features are added.*
