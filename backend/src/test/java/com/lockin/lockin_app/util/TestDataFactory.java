package com.lockin.lockin_app.util;

import com.lockin.lockin_app.entity.*;

import java.time.LocalDateTime;

/**
 * Factory for creating test data objects.
 *
 * Keeps test data consistent across all tests.
 * Reduces boilerplate in test methods.
 */
public class TestDataFactory {

    public static User createTestUser() {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setPassword("$2a$10$encoded.password.hash");  // BCrypt hash
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return user;
    }

    public static User createTestUser(String email) {
        User user = createTestUser();
        user.setEmail(email);
        return user;
    }

    public static Task createTestTask(User user) {
        Task task = new Task();
        task.setId(1L);
        task.setUser(user);
        task.setTitle("Test Task");
        task.setDescription("Test Description");
        task.setStatus(TaskStatus.TODO);
        task.setIsUrgent(true);
        task.setIsImportant(true);
        task.setDueDate(LocalDateTime.now().plusDays(7));
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        return task;
    }

    public static Task createTestTask(User user, String title) {
        Task task = createTestTask(user);
        task.setTitle(title);
        return task;
    }

    // Focus session from Month 3!
    public static FocusSession createTestFocusSession(User user) {
        FocusSession session = new FocusSession();
        session.setId(1L);
        session.setUser(user);
        session.setSessionType(SessionType.WORK);
        session.setPlannedMinutes(25);  // 25-minute Pomodoro
        session.setStartedAt(LocalDateTime.now());
        session.setCompleted(false);
        return session;
    }

    public static FocusSession createTestFocusSession(User user, int minutes) {
        FocusSession session = createTestFocusSession(user);
        session.setPlannedMinutes(minutes);
        return session;
    }

    public static Category createTestCategory(User user, String name) {
        Category category = new Category();
        category.setId(1L);
        category.setUser(user);
        category.setName(name);
        category.setColor("#FF5722");
        category.setCreatedAt(LocalDateTime.now());
        return category;
    }

    public static Goal createTestGoal(User user, String title) {
        Goal goal = new Goal();
        goal.setId(1L);
        goal.setUser(user);
        goal.setTitle(title);
        goal.setDescription("Test goal description");
        goal.setStartDate(java.time.LocalDate.now());
        goal.setEndDate(java.time.LocalDate.now().plusDays(30));
        goal.setType(Goal.GoalType.WEEKLY);
        goal.setTargetTasks(10);
        goal.setCurrentTasks(0);
        goal.setCreatedAt(LocalDateTime.now());
        return goal;
    }
}
