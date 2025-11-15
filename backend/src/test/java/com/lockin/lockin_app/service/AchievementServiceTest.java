package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.AchievementDTO;
import com.lockin.lockin_app.entity.FocusSession;
import com.lockin.lockin_app.entity.Goal;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;
import com.lockin.lockin_app.repository.FocusSessionRepository;
import com.lockin.lockin_app.repository.GoalRepository;
import com.lockin.lockin_app.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AchievementService
 *
 * Tests the achievement calculation logic to ensure users earn badges correctly
 * Based on their activity (tasks completed, focus sessions, goals achieved)
 */
@ExtendWith(MockitoExtension.class)
class AchievementServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private FocusSessionRepository sessionRepository;

    @Mock
    private GoalRepository goalRepository;

    @InjectMocks
    private AchievementService achievementService;

    private Long testUserId;

    @BeforeEach
    void setUp() {
        testUserId = 1L;
    }

    @Test
    void shouldCalculateCenturyClubWhenUser100Tasks() {
        // Given: User has completed exactly 100 tasks
        List<Task> completedTasks = Collections.nCopies(100, null);

        when(taskRepository.findByUserIdAndStatus(testUserId, TaskStatus.COMPLETED))
            .thenReturn(completedTasks);
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(testUserId))
            .thenReturn(Collections.emptyList());
        when(goalRepository.findByUserIdOrderByCreatedAtDesc(testUserId))
            .thenReturn(Collections.emptyList());

        // When: We get the user's achievements
        List<AchievementDTO> achievements = achievementService.getUserAchievements(testUserId);

        // Then: Century Club achievement should be unlocked
        AchievementDTO centuryClub = achievements.stream()
            .filter(a -> a.getId().equals("task_100"))
            .findFirst()
            .orElse(null);

        assertNotNull(centuryClub, "Century Club achievement should exist");
        assertTrue(centuryClub.isUnlocked(), "Century Club should be unlocked at 100 tasks");
        assertEquals(100, centuryClub.getProgress(), "Progress should be 100");
        assertEquals(100, centuryClub.getTarget(), "Target should be 100");

        verify(taskRepository, times(1)).findByUserIdAndStatus(testUserId, TaskStatus.COMPLETED);
    }

    @Test
    void shouldNotUnlockCenturyClubBelow100Tasks() {
        // Given: User has only 99 tasks (so close!)
        List<Task> completedTasks = Collections.nCopies(99, null);

        when(taskRepository.findByUserIdAndStatus(testUserId, TaskStatus.COMPLETED))
            .thenReturn(completedTasks);
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(testUserId))
            .thenReturn(Collections.emptyList());
        when(goalRepository.findByUserIdOrderByCreatedAtDesc(testUserId))
            .thenReturn(Collections.emptyList());

        // When
        List<AchievementDTO> achievements = achievementService.getUserAchievements(testUserId);

        // Then: Century Club should NOT be unlocked
        AchievementDTO centuryClub = achievements.stream()
            .filter(a -> a.getId().equals("task_100"))
            .findFirst()
            .orElse(null);

        assertNotNull(centuryClub);
        assertFalse(centuryClub.isUnlocked(), "Should not be unlocked with only 99 tasks");
        assertEquals(99, centuryClub.getProgress());
    }

    @Test
    void shouldAwardFocusMasterAt100Sessions() {
        // Given: User completed 100 focus sessions
        List<FocusSession> sessions = Collections.nCopies(100, null);

        when(sessionRepository.findByUserIdOrderByStartedAtDesc(testUserId))
            .thenReturn(sessions);
        when(taskRepository.findByUserIdAndStatus(testUserId, TaskStatus.COMPLETED))
            .thenReturn(Collections.emptyList());
        when(goalRepository.findByUserIdOrderByCreatedAtDesc(testUserId))
            .thenReturn(Collections.emptyList());

        // When
        List<AchievementDTO> achievements = achievementService.getUserAchievements(testUserId);

        // Then: Focus Warrior achievement should be unlocked
        AchievementDTO focusWarrior = achievements.stream()
            .filter(a -> a.getId().equals("session_100"))
            .findFirst()
            .orElse(null);

        assertNotNull(focusWarrior);
        assertTrue(focusWarrior.isUnlocked());
        assertEquals("Focus Warrior", focusWarrior.getTitle());
        assertEquals("FOCUS", focusWarrior.getCategory());
    }

    @Test
    void shouldReturnAllAchievementCategories() {
        // Given: User with some activity
        when(taskRepository.findByUserIdAndStatus(anyLong(), any()))
            .thenReturn(Collections.emptyList());
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(anyLong()))
            .thenReturn(Collections.emptyList());
        when(goalRepository.findByUserIdOrderByCreatedAtDesc(anyLong()))
            .thenReturn(Collections.emptyList());

        // When
        List<AchievementDTO> achievements = achievementService.getUserAchievements(testUserId);

        // Then: Should have achievements from all categories
        boolean hasTaskAchievements = achievements.stream()
            .anyMatch(a -> a.getCategory().equals("TASKS"));
        boolean hasFocusAchievements = achievements.stream()
            .anyMatch(a -> a.getCategory().equals("FOCUS"));
        boolean hasGoalAchievements = achievements.stream()
            .anyMatch(a -> a.getCategory().equals("GOALS"));

        assertTrue(hasTaskAchievements, "Should have task achievements");
        assertTrue(hasFocusAchievements, "Should have focus achievements");
        assertTrue(hasGoalAchievements, "Should have goal achievements");

        // Should have multiple achievements per category
        assertTrue(achievements.size() >= 9, "Should have at least 9 achievements total");
    }

    @Test
    void shouldCapProgressAtTarget() {
        // Given: User has way more than 100 tasks (overachiever!)
        List<Task> completedTasks = Collections.nCopies(250, null);

        when(taskRepository.findByUserIdAndStatus(testUserId, TaskStatus.COMPLETED))
            .thenReturn(completedTasks);
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(testUserId))
            .thenReturn(Collections.emptyList());
        when(goalRepository.findByUserIdOrderByCreatedAtDesc(testUserId))
            .thenReturn(Collections.emptyList());

        // When
        List<AchievementDTO> achievements = achievementService.getUserAchievements(testUserId);

        // Then: Progress should not exceed target for any achievement
        for (AchievementDTO achievement : achievements) {
            assertTrue(achievement.getProgress() <= achievement.getTarget(),
                "Progress should never exceed target for achievement: " + achievement.getId());
        }
    }

    @Test
    void shouldUnlockFirstTaskAchievementEarly() {
        // Given: User just completed their very first task!
        List<Task> completedTasks = Collections.nCopies(1, null);

        when(taskRepository.findByUserIdAndStatus(testUserId, TaskStatus.COMPLETED))
            .thenReturn(completedTasks);
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(testUserId))
            .thenReturn(Collections.emptyList());
        when(goalRepository.findByUserIdOrderByCreatedAtDesc(testUserId))
            .thenReturn(Collections.emptyList());

        // When
        List<AchievementDTO> achievements = achievementService.getUserAchievements(testUserId);

        // Then: First task achievement should be unlocked
        AchievementDTO firstTask = achievements.stream()
            .filter(a -> a.getId().equals("first_task"))
            .findFirst()
            .orElse(null);

        assertNotNull(firstTask);
        assertTrue(firstTask.isUnlocked(), "First task achievement should unlock immediately");
        assertEquals(1, firstTask.getProgress());
        assertEquals(1, firstTask.getTarget());
    }
}
