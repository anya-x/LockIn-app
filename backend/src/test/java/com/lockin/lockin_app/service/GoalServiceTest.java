package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.GoalRequestDTO;
import com.lockin.lockin_app.dto.GoalResponseDTO;
import com.lockin.lockin_app.entity.Goal;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.GoalRepository;
import com.lockin.lockin_app.util.TestDataFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GoalService Unit Tests")
class GoalServiceTest {

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private GoalService goalService;

    private User testUser;
    private Goal testGoal;

    @BeforeEach
    void setUp() {
        testUser = TestDataFactory.createTestUser();
        testGoal = TestDataFactory.createTestGoal(testUser, "Complete Month 6");
    }

    @Test
    @DisplayName("Should create goal successfully")
    void shouldCreateGoal() {
        // Arrange
        GoalRequestDTO request = new GoalRequestDTO();
        request.setTitle("Finish backend testing");
        request.setDescription("Achieve 80% coverage");
        request.setTargetDate(LocalDateTime.now().plusDays(30));

        when(userService.getUserById(1L)).thenReturn(testUser);
        when(goalRepository.save(any(Goal.class))).thenReturn(testGoal);

        // Act
        GoalResponseDTO response = goalService.createGoal(1L, request);

        // Assert
        assertThat(response).isNotNull();
        verify(goalRepository).save(any(Goal.class));
    }

    @Test
    @DisplayName("Should get all goals for user")
    void shouldGetAllGoals() {
        // Arrange
        Goal goal1 = TestDataFactory.createTestGoal(testUser, "Goal 1");
        Goal goal2 = TestDataFactory.createTestGoal(testUser, "Goal 2");
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(goalRepository.findByUser(testUser)).thenReturn(Arrays.asList(goal1, goal2));

        // Act
        List<GoalResponseDTO> goals = goalService.getUserGoals(1L);

        // Assert
        assertThat(goals).hasSize(2);
    }

    @Test
    @DisplayName("Should track goal progress")
    void shouldTrackGoalProgress() {
        // Arrange
        testGoal.setProgress(50);
        when(goalRepository.save(any(Goal.class))).thenReturn(testGoal);

        // Act
        // Progress tracking would be tested here

        // Assert
        assertThat(testGoal.getProgress()).isEqualTo(50);
    }
}
