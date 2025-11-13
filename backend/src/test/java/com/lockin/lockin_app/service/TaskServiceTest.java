package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.TaskRequestDTO;
import com.lockin.lockin_app.dto.TaskResponseDTO;
import com.lockin.lockin_app.entity.Task;
import com.lockin.lockin_app.entity.TaskStatus;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.repository.TaskRepository;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskService Unit Tests")
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserService userService;

    @Mock
    private CategoryService categoryService;

    @Mock
    private GoalService goalService;

    @InjectMocks
    private TaskService taskService;

    private User testUser;
    private Task testTask;
    private TaskRequestDTO taskRequest;

    @BeforeEach
    void setUp() {
        testUser = TestDataFactory.createTestUser();
        testTask = TestDataFactory.createTestTask(testUser);

        taskRequest = new TaskRequestDTO();
        taskRequest.setTitle("New Task");
        taskRequest.setDescription("New Description");
        taskRequest.setIsUrgent(false);
        taskRequest.setIsImportant(true);
        taskRequest.setDueDate(LocalDateTime.now().plusDays(3));
    }

    @Test
    @DisplayName("Should create task successfully")
    void shouldCreateTaskSuccessfully() {
        // Arrange
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        // Act
        TaskResponseDTO response = taskService.createTask(1L, taskRequest);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo(testTask.getTitle());
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    @DisplayName("Should get all tasks for user")
    void shouldGetAllTasksForUser() {
        // Arrange
        Task task1 = TestDataFactory.createTestTask(testUser, "Task 1");
        Task task2 = TestDataFactory.createTestTask(testUser, "Task 2");
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(taskRepository.findByUser(testUser)).thenReturn(Arrays.asList(task1, task2));

        // Act
        List<TaskResponseDTO> tasks = taskService.getAllTasks(1L);

        // Assert
        assertThat(tasks).hasSize(2);
        assertThat(tasks.get(0).getTitle()).isEqualTo("Task 1");
        assertThat(tasks.get(1).getTitle()).isEqualTo("Task 2");
    }

    @Test
    @DisplayName("Should throw exception when task not found")
    void shouldThrowExceptionWhenTaskNotFound() {
        // Arrange
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> taskService.getTaskById(1L, 999L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Task not found");
    }

    @Test
    @DisplayName("Should update task status to IN_PROGRESS")
    void shouldUpdateTaskStatus() {
        // Arrange
        when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
        when(taskRepository.save(any(Task.class))).thenReturn(testTask);

        TaskRequestDTO updateRequest = new TaskRequestDTO();
        updateRequest.setTitle(testTask.getTitle());
        updateRequest.setStatus(TaskStatus.IN_PROGRESS);

        // Act
        TaskResponseDTO response = taskService.updateTask(testUser.getId(), 1L, updateRequest);

        // Assert
        assertThat(response).isNotNull();
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    @DisplayName("Should delete task successfully")
    void shouldDeleteTaskSuccessfully() {
        // Arrange
        when(taskRepository.findById(1L)).thenReturn(Optional.of(testTask));
        doNothing().when(taskRepository).delete(testTask);

        // Act
        taskService.deleteTask(testUser.getId(), 1L);

        // Assert
        verify(taskRepository).delete(testTask);
    }
}
