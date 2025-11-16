package com.lockin.lockin_app.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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

@ExtendWith(MockitoExtension.class)
class AnalyticsCalculationServiceTest {

    @Mock private TaskRepository taskRepository;

    @Mock private FocusSessionRepository focusSessionRepository;

    @Mock private DailyAnalyticsRepository dailyAnalyticsRepository;

    @Mock private UserRepository userRepository;

    @InjectMocks private AnalyticsCalculationService analyticsService;

    private User testUser;
    private LocalDate testDate;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testDate = LocalDate.now();
    }

    @Test
    void testProductivityScoreCalculation() {
        // Setup
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(dailyAnalyticsRepository.findByUserAndDate(any(), any()))
                .thenReturn(Optional.empty());

        // Create test data: 10 tasks created, 8 completed (80% rate)
        List<Task> tasks = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            Task task = new Task();
            task.setCreatedAt(testDate.atStartOfDay().plusHours(i));
            task.setStatus(i < 8 ? TaskStatus.COMPLETED : TaskStatus.PENDING);
            task.setUpdatedAt(testDate.atStartOfDay().plusHours(i + 1));
            tasks.add(task);
        }

        // Create test focus sessions: 3 hours total (180 minutes)
        List<FocusSession> sessions = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            FocusSession session = new FocusSession();
            session.setStartedAt(testDate.atStartOfDay().plusHours(i + 9));
            session.setWorkDuration(25);
            session.setBreakMinutes(5);
            session.setCompleted(true);
            sessions.add(session);
        }

        when(taskRepository.findByUserAndCreatedBetween(any(), any(), any())).thenReturn(tasks);
        when(focusSessionRepository.findByUserAndStartedAtBetween(any(), any(), any()))
                .thenReturn(sessions);
        when(taskRepository.findByUserId(any())).thenReturn(new ArrayList<>());
        when(dailyAnalyticsRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        // Execute
        DailyAnalyticsDTO result = analyticsService.calculateDailyAnalytics(1L, testDate);

        // Assert
        assertNotNull(result);
        assertTrue(result.getProductivityScore() > 0 && result.getProductivityScore() <= 100);
        // Should have decent score: 80% completion rate + 3h focus
        assertTrue(result.getProductivityScore() > 60);
        assertEquals(10, result.getTasksCreated());
        assertEquals(8, result.getTasksCompleted());
        assertEquals(150, result.getFocusMinutes()); // 6 sessions * 25 min
    }

    @Test
    void testBurnoutDetection_HighRisk() {
        // Setup for high burnout scenario
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(dailyAnalyticsRepository.findByUserAndDate(any(), any()))
                .thenReturn(Optional.empty());
        when(taskRepository.findByUserAndCreatedBetween(any(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(taskRepository.findByUserId(any())).thenReturn(new ArrayList<>());

        // Many late night sessions, very long work hours
        List<FocusSession> sessions = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            FocusSession session = new FocusSession();
            session.setStartedAt(testDate.atTime(22 + (i % 2), 0)); // Late night sessions
            session.setWorkDuration(50); // Very long sessions
            session.setCompleted(true);
            sessions.add(session);
        }

        when(focusSessionRepository.findByUserAndStartedAtBetween(any(), any(), any()))
                .thenReturn(sessions);
        when(dailyAnalyticsRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        // Execute
        DailyAnalyticsDTO result = analyticsService.calculateDailyAnalytics(1L, testDate);

        // Assert - should show high burnout risk
        assertNotNull(result);
        assertTrue(result.getBurnoutRiskScore() > 50); // High burnout
        assertEquals(10, result.getLateNightSessions());
        assertTrue(result.getOverworkMinutes() > 0);
    }

    @Test
    void testEdgeCase_NoData() {
        // Setup - new user with no data
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(dailyAnalyticsRepository.findByUserAndDate(any(), any()))
                .thenReturn(Optional.empty());
        when(taskRepository.findByUserAndCreatedBetween(any(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(taskRepository.findByUserId(any())).thenReturn(new ArrayList<>());
        when(focusSessionRepository.findByUserAndStartedAtBetween(any(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(dailyAnalyticsRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        // Execute
        DailyAnalyticsDTO result = analyticsService.calculateDailyAnalytics(1L, testDate);

        // Assert - should not crash, return empty analytics
        assertNotNull(result);
        assertEquals(0, result.getTasksCreated());
        assertEquals(0, result.getFocusMinutes());
        assertEquals(0.0, result.getProductivityScore());
        assertEquals(0.0, result.getBurnoutRiskScore());
    }

    @Test
    void testEdgeCase_DivisionByZero() {
        // Setup - tasks but all failed
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(dailyAnalyticsRepository.findByUserAndDate(any(), any()))
                .thenReturn(Optional.empty());

        List<Task> tasks = new ArrayList<>();
        Task task = new Task();
        task.setCreatedAt(testDate.atStartOfDay());
        task.setStatus(TaskStatus.PENDING); // Not completed
        tasks.add(task);

        when(taskRepository.findByUserAndCreatedBetween(any(), any(), any())).thenReturn(tasks);
        when(taskRepository.findByUserId(any())).thenReturn(new ArrayList<>());
        when(focusSessionRepository.findByUserAndStartedAtBetween(any(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(dailyAnalyticsRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        // Execute
        DailyAnalyticsDTO result = analyticsService.calculateDailyAnalytics(1L, testDate);

        // Assert - should handle division by zero gracefully
        assertNotNull(result);
        assertEquals(0.0, result.getCompletionRate());
        assertFalse(Double.isNaN(result.getProductivityScore()));
    }

    @Test
    void testTimeOfDayTracking() {
        // Setup
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(dailyAnalyticsRepository.findByUserAndDate(any(), any()))
                .thenReturn(Optional.empty());
        when(taskRepository.findByUserAndCreatedBetween(any(), any(), any()))
                .thenReturn(new ArrayList<>());
        when(taskRepository.findByUserId(any())).thenReturn(new ArrayList<>());

        // Create sessions at different times of day
        List<FocusSession> sessions = new ArrayList<>();

        // Morning session (9 AM)
        FocusSession morning = new FocusSession();
        morning.setStartedAt(testDate.atTime(9, 0));
        morning.setWorkDuration(60);
        morning.setCompleted(true);
        sessions.add(morning);

        // Afternoon session (2 PM)
        FocusSession afternoon = new FocusSession();
        afternoon.setStartedAt(testDate.atTime(14, 0));
        afternoon.setWorkDuration(45);
        afternoon.setCompleted(true);
        sessions.add(afternoon);

        // Evening session (7 PM)
        FocusSession evening = new FocusSession();
        evening.setStartedAt(testDate.atTime(19, 0));
        evening.setWorkDuration(30);
        evening.setCompleted(true);
        sessions.add(evening);

        when(focusSessionRepository.findByUserAndStartedAtBetween(any(), any(), any()))
                .thenReturn(sessions);
        when(dailyAnalyticsRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        // Execute
        DailyAnalyticsDTO result = analyticsService.calculateDailyAnalytics(1L, testDate);

        // Assert
        assertNotNull(result);
        assertEquals(60, result.getMorningFocusMinutes());
        assertEquals(45, result.getAfternoonFocusMinutes());
        assertEquals(30, result.getEveningFocusMinutes());
        assertEquals(0, result.getNightFocusMinutes());
    }
}
