package com.lockin.lockin_app.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.lockin.lockin_app.dto.DailyAnalyticsDTO;
import com.lockin.lockin_app.entity.*;
import com.lockin.lockin_app.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Unit tests for AnalyticsCalculationService
 *
 * Tests cover:
 * - Productivity score calculation
 * - Burnout risk detection
 * - Task metrics aggregation
 * - Edge cases (no data, division by zero, null values)
 */
@ExtendWith(MockitoExtension.class)
class AnalyticsCalculationServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private FocusSessionRepository focusSessionRepository;

    @Mock
    private DailyAnalyticsRepository dailyAnalyticsRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AnalyticsCalculationService analyticsService;

    private User testUser;
    private LocalDate testDate;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");

        testDate = LocalDate.now();
    }

    @Test
    void testCalculateAnalytics_NoData_ReturnsZeroScores() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(taskRepository.findByUserIdAndCreatedAtBetween(anyLong(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(taskRepository.findByUserIdAndStatusAndUpdatedAtBetween(
                        anyLong(), any(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(focusSessionRepository.findByUserAndStartedAtBetweenWithRelations(
                        any(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(taskRepository.findByUserIdAndStatusNotWithCategory(anyLong(), any()))
                .thenReturn(new ArrayList<>());
        when(dailyAnalyticsRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // When
        DailyAnalyticsDTO result = analyticsService.calculateDailyAnalytics(1L, testDate);

        // Then
        assertNotNull(result);
        assertEquals(0, result.getTasksCreated());
        assertEquals(0, result.getTasksCompleted());
        assertEquals(0.0, result.getProductivityScore());
        assertEquals(0.0, result.getBurnoutRiskScore());
    }

    @Test
    void testCalculateAnalytics_WithTasks_CalculatesCompletionRate() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        List<Task> createdTasks = createMockTasks(5, TaskStatus.PENDING);
        List<Task> completedTasks = createMockTasks(3, TaskStatus.COMPLETED);

        when(taskRepository.findByUserIdAndCreatedAtBetween(anyLong(), any(), any()))
                .thenReturn(createdTasks);
        when(taskRepository.findByUserIdAndStatusAndUpdatedAtBetween(
                        anyLong(), any(), any(), any()))
                .thenReturn(completedTasks);
        when(focusSessionRepository.findByUserAndStartedAtBetweenWithRelations(
                        any(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(taskRepository.findByUserIdAndStatusNotWithCategory(anyLong(), any()))
                .thenReturn(new ArrayList<>());
        when(dailyAnalyticsRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // When
        DailyAnalyticsDTO result = analyticsService.calculateDailyAnalytics(1L, testDate);

        // Then
        assertNotNull(result);
        assertEquals(5, result.getTasksCreated());
        assertEquals(3, result.getTasksCompleted());
        assertTrue(result.getCompletionRate() >= 0);
        assertTrue(result.getCompletionRate() <= 100);
    }

    @Test
    void testCalculateAnalytics_NoSessions_NoDivisionByZero() {
        // Given - edge case: no sessions should not cause division by zero
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(taskRepository.findByUserIdAndCreatedAtBetween(anyLong(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(taskRepository.findByUserIdAndStatusAndUpdatedAtBetween(
                        anyLong(), any(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(focusSessionRepository.findByUserAndStartedAtBetweenWithRelations(
                        any(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(taskRepository.findByUserIdAndStatusNotWithCategory(anyLong(), any()))
                .thenReturn(new ArrayList<>());
        when(dailyAnalyticsRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // When
        DailyAnalyticsDTO result = analyticsService.calculateDailyAnalytics(1L, testDate);

        // Then - should not throw exception
        assertNotNull(result);
        assertEquals(0, result.getPomodorosCompleted());
        assertEquals(0, result.getFocusMinutes());
    }

    @Test
    void testCalculateAnalytics_HighBurnoutRisk_DetectsCorrectly() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(taskRepository.findByUserIdAndCreatedAtBetween(anyLong(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(taskRepository.findByUserIdAndStatusAndUpdatedAtBetween(
                        anyLong(), any(), any(), any()))
                .thenReturn(new ArrayList<>());

        // Create sessions with burnout indicators
        List<FocusSession> sessions = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            FocusSession session = new FocusSession();
            session.setUser(testUser);
            session.setCompleted(true);
            session.setWorkDuration(45); // 450 minutes total - overwork
            session.setStartedAt(LocalDateTime.now().withHour(23)); // late night
            sessions.add(session);
        }

        when(focusSessionRepository.findByUserAndStartedAtBetweenWithRelations(
                        any(), any(), any()))
                .thenReturn(sessions);
        when(taskRepository.findByUserIdAndStatusNotWithCategory(anyLong(), any()))
                .thenReturn(new ArrayList<>());
        when(dailyAnalyticsRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // When
        DailyAnalyticsDTO result = analyticsService.calculateDailyAnalytics(1L, testDate);

        // Then
        assertNotNull(result);
        assertTrue(result.getBurnoutRiskScore() > 0, "Should detect burnout risk");
        assertTrue(result.getOverworkMinutes() > 0, "Should detect overwork");
        assertTrue(result.getLateNightSessions() > 0, "Should detect late night sessions");
    }

    @Test
    void testCalculateAnalytics_OptimalProductivity_HighScore() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        List<Task> createdTasks = createMockTasks(10, TaskStatus.PENDING);
        List<Task> completedTasks = createMockTasks(10, TaskStatus.COMPLETED);

        when(taskRepository.findByUserIdAndCreatedAtBetween(anyLong(), any(), any()))
                .thenReturn(createdTasks);
        when(taskRepository.findByUserIdAndStatusAndUpdatedAtBetween(
                        anyLong(), any(), any(), any()))
                .thenReturn(completedTasks);

        // Optimal focus time (240 minutes = 4 hours)
        List<FocusSession> sessions = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            FocusSession session = new FocusSession();
            session.setUser(testUser);
            session.setCompleted(true);
            session.setWorkDuration(60);
            session.setBreakMinutes(15);
            session.setStartedAt(LocalDateTime.now().withHour(10));
            sessions.add(session);
        }

        when(focusSessionRepository.findByUserAndStartedAtBetweenWithRelations(
                        any(), any(), any()))
                .thenReturn(sessions);
        when(taskRepository.findByUserIdAndStatusNotWithCategory(anyLong(), any()))
                .thenReturn(new ArrayList<>());
        when(dailyAnalyticsRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // When
        DailyAnalyticsDTO result = analyticsService.calculateDailyAnalytics(1L, testDate);

        // Then
        assertNotNull(result);
        assertEquals(240, result.getFocusMinutes());
        assertTrue(result.getProductivityScore() > 50, "Should have high productivity score");
        assertTrue(result.getBurnoutRiskScore() < 30, "Should have low burnout risk");
    }

    // Helper methods
    private List<Task> createMockTasks(int count, TaskStatus status) {
        List<Task> tasks = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Task task = new Task();
            task.setId((long) i);
            task.setUser(testUser);
            task.setTitle("Task " + i);
            task.setStatus(status);
            task.setIsUrgent(false);
            task.setIsImportant(false);
            task.setCreatedAt(LocalDateTime.now());
            if (status == TaskStatus.COMPLETED) {
                task.setUpdatedAt(LocalDateTime.now());
            }
            tasks.add(task);
        }
        return tasks;
    }
}
