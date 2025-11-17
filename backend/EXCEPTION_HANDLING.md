# Exception Handling Guide

## Overview
The LockIn backend uses custom exceptions for clear, consistent error handling across all API endpoints. Each exception maps to a specific HTTP status code and provides meaningful error messages to clients.

## Custom Exceptions

### 1. ResourceNotFoundException
**Status Code:** `404 NOT FOUND`

**Use When:** A requested resource doesn't exist in the database.

**Example Usage:**
```java
// Simple message
throw new ResourceNotFoundException("Task not found");

// Formatted message with resource details
throw new ResourceNotFoundException("Task", "id", taskId);
// Returns: "Task not found with id: '123'"
```

**Common Scenarios:**
- Finding a user by ID that doesn't exist
- Accessing a task, category, or session that was deleted
- Fetching analytics for a non-existent date range

---

### 2. DuplicateResourceException
**Status Code:** `409 CONFLICT`

**Use When:** Attempting to create a resource that already exists.

**Example Usage:**
```java
// Check if email exists before registration
if (userRepository.existsByEmail(email)) {
    throw new DuplicateResourceException("User", "email", email);
    // Returns: "User already exists with email: 'user@example.com'"
}

// Check for duplicate category names
if (categoryRepository.existsByUserIdAndName(userId, name)) {
    throw new DuplicateResourceException("Category", "name", name);
}
```

**Common Scenarios:**
- User registration with existing email
- Creating a category with a duplicate name
- Adding a goal that conflicts with an existing one

---

### 3. ValidationException
**Status Code:** `400 BAD REQUEST`

**Use When:** Business logic validation fails (beyond basic field validation).

**Example Usage:**
```java
// Validate positive values
if (actualMinutes < 0) {
    throw new ValidationException("actualMinutes", "cannot be negative");
    // Returns: "Validation failed for actualMinutes: cannot be negative"
}

// Validate date ranges
if (startDate.isAfter(endDate)) {
    throw new ValidationException("Start date must be before end date");
}

// Validate goal targets
if (!hasAtLeastOneTarget()) {
    throw new ValidationException("At least one target (tasks, pomodoros, or focus minutes) must be set");
}
```

**Common Scenarios:**
- Negative values where positive expected
- Invalid date ranges
- Missing required combinations of fields
- Business rule violations

---

### 4. InvalidStateException
**Status Code:** `409 CONFLICT`

**Use When:** An operation is attempted on an entity in an incompatible state.

**Example Usage:**
```java
// Prevent completing an already completed session
if (session.getCompleted()) {
    throw new InvalidStateException("FocusSession", "completed", "complete again");
    // Returns: "FocusSession is in state 'completed' and cannot perform action: complete again"
}

// Prevent updating a completed goal
if (goal.getCompleted()) {
    throw new InvalidStateException("Goal", "completed", "update targets");
}

// Prevent starting a new session when one is active
if (hasActiveSession(userId)) {
    throw new InvalidStateException("User has an active session and cannot start a new one");
}
```

**Common Scenarios:**
- Modifying completed/finalized entities
- State machine violations
- Concurrent operation conflicts

---

### 5. UnauthorizedException
**Status Code:** `403 FORBIDDEN`

**Use When:** User doesn't have permission to access a resource.

**Example Usage:**
```java
// Validate resource ownership
if (!task.getUser().getId().equals(userId)) {
    throw new UnauthorizedException("You do not have permission to access this task");
}

// Simple usage
throw new UnauthorizedException();
// Returns: "You do not have permission to access this resource"

// With custom message
throw new UnauthorizedException("Admin access required for this operation");
```

**Common Scenarios:**
- Accessing another user's tasks, sessions, or goals
- Modifying resources you don't own
- Accessing admin-only endpoints

---

### 6. AnalyticsException
**Status Code:** `500 INTERNAL SERVER ERROR`

**Use When:** Analytics calculation or processing fails unexpectedly.

**Example Usage:**
```java
try {
    // Complex analytics calculation
    calculateDailyAnalytics(userId, date);
} catch (RuntimeException ex) {
    throw new AnalyticsException("Daily analytics calculation failed", ex);
}

// Operation-specific error
throw new AnalyticsException("productivity score calculation", "invalid data range");
// Returns: "Analytics operation 'productivity score calculation' failed: invalid data range"
```

**Common Scenarios:**
- Database query failures during analytics
- Data integrity issues
- Calculation errors with missing data

---

## Global Exception Handler

All exceptions are caught by `GlobalExceptionHandler` which returns consistent error responses:

```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Task not found with id: '123'",
  "path": "/api/tasks/123"
}
```

### Validation Errors (MethodArgumentNotValidException)

Field validation errors include detailed field-level information:

```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for one or more fields",
  "path": "/api/tasks",
  "fieldErrors": {
    "title": "Title is required",
    "dueDate": "Due date must be in the future"
  }
}
```

---

## Best Practices

### 1. Choose the Right Exception

```java
// ❌ Wrong: Using ResourceNotFoundException for validation
if (minutes < 0) {
    throw new ResourceNotFoundException("Minutes cannot be negative");
}

// ✅ Correct: Use ValidationException
if (minutes < 0) {
    throw new ValidationException("minutes", "cannot be negative");
}
```

```java
// ❌ Wrong: Using ResourceNotFoundException for duplicates
if (emailExists) {
    throw new ResourceNotFoundException("Email already registered");
}

// ✅ Correct: Use DuplicateResourceException
if (emailExists) {
    throw new DuplicateResourceException("User", "email", email);
}
```

### 2. Provide Clear Messages

```java
// ❌ Poor: Generic message
throw new ValidationException("Invalid input");

// ✅ Good: Specific message
throw new ValidationException("startDate", "must be before endDate");
```

### 3. Use Structured Constructors

```java
// ✅ Best: Use structured constructors for consistency
throw new ResourceNotFoundException("Task", "id", taskId);
throw new DuplicateResourceException("Category", "name", categoryName);
throw new InvalidStateException("Session", "completed", "complete again");
```

### 4. Log Appropriately

```java
// Validation errors: WARN level
log.warn("Validation failed for user {}: {}", userId, ex.getMessage());

// Business errors: WARN level
log.warn("Duplicate resource: {}", ex.getMessage());

// System errors: ERROR level with stack trace
log.error("Analytics calculation failed for user {}", userId, ex);
```

### 5. Don't Catch Generic RuntimeException

```java
// ❌ Bad: Catching all exceptions
try {
    updateTask(task);
} catch (Exception ex) {
    throw new ValidationException("Update failed");
}

// ✅ Good: Catch specific exceptions or wrap appropriately
try {
    updateTask(task);
} catch (ValidationException | InvalidStateException ex) {
    // Let custom exceptions propagate
    throw ex;
} catch (RuntimeException ex) {
    // Wrap unexpected errors
    log.error("Unexpected error updating task", ex);
    throw new RuntimeException("Task update failed", ex);
}
```

---

## Migration Guide

If you're updating existing code to use the new exceptions:

### Step 1: Identify Misused Exceptions

Look for patterns like:
- `ResourceNotFoundException` used for validation errors
- `IllegalArgumentException` for business logic errors
- Generic `RuntimeException` for specific scenarios

### Step 2: Replace with Appropriate Custom Exception

```java
// Before
throw new ResourceNotFoundException("Session is already completed");

// After
throw new InvalidStateException("FocusSession", "completed", "complete again");
```

### Step 3: Update Imports

```java
import com.lockin.lockin_app.exception.DuplicateResourceException;
import com.lockin.lockin_app.exception.ValidationException;
import com.lockin.lockin_app.exception.InvalidStateException;
import com.lockin.lockin_app.exception.AnalyticsException;
```

### Step 4: Test Error Responses

Verify that the API returns correct HTTP status codes:
- 400 for validation errors
- 403 for unauthorized access
- 404 for not found
- 409 for conflicts (duplicates, invalid states)
- 500 for server errors

---

## Testing Exceptions

```java
@Test
void testDuplicateEmail_ThrowsDuplicateResourceException() {
    // Given
    when(userService.existsByEmail("test@example.com")).thenReturn(true);

    // When & Then
    assertThrows(DuplicateResourceException.class, () -> {
        authService.register(registerRequest);
    });
}

@Test
void testCompletedSession_ThrowsInvalidStateException() {
    // Given
    session.setCompleted(true);

    // When & Then
    InvalidStateException ex = assertThrows(
        InvalidStateException.class,
        () -> sessionService.completeSession(sessionId, userId, 30)
    );

    assertThat(ex.getMessage()).contains("completed");
}
```

---

## Future Enhancements

Consider adding these exceptions as needed:

- **RateLimitException** (429 TOO MANY REQUESTS) - For API rate limiting
- **ConcurrencyException** (409 CONFLICT) - For optimistic locking failures
- **ExternalServiceException** (503 SERVICE UNAVAILABLE) - For third-party API failures
- **DataIntegrityException** (409 CONFLICT) - For constraint violations

---

## Summary

| Exception | Status | Use Case |
|-----------|--------|----------|
| ResourceNotFoundException | 404 | Resource doesn't exist |
| DuplicateResourceException | 409 | Resource already exists |
| ValidationException | 400 | Business validation fails |
| InvalidStateException | 409 | Invalid state transition |
| UnauthorizedException | 403 | No permission |
| AnalyticsException | 500 | Analytics processing fails |

For questions or improvements, refer to the `GlobalExceptionHandler` class or consult the team.
