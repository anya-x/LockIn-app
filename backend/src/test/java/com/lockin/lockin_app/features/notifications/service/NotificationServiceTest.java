package com.lockin.lockin_app.features.notifications.service;

import com.lockin.lockin_app.features.notifications.dto.NotificationDTO;
import com.lockin.lockin_app.features.notifications.entity.Notification;
import com.lockin.lockin_app.features.notifications.repository.NotificationRepository;
import com.lockin.lockin_app.features.users.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for NotificationService.
 *
 * Tests notification creation, retrieval, and read status updates.
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");

        testNotification = new Notification();
        testNotification.setId(1L);
        testNotification.setUser(testUser);
        testNotification.setType("AI_BREAKDOWN");
        testNotification.setTitle("Task Breakdown Complete");
        testNotification.setMessage("Your task has been broken down");
        testNotification.setActionUrl("/tasks/1");
        testNotification.setIsRead(false);
        testNotification.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should create notification and send via WebSocket")
    void createNotification_shouldSaveAndSendViaWebSocket() {
        // Arrange
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> {
                    Notification n = invocation.getArgument(0);
                    n.setId(1L);
                    n.setCreatedAt(LocalDateTime.now());
                    return n;
                });

        // Act
        Notification result = notificationService.createNotification(
                testUser,
                "AI_BREAKDOWN",
                "Task Breakdown Complete",
                "Your task has been broken down",
                "/tasks/1"
        );

        // Assert
        assertNotNull(result);
        assertEquals("AI_BREAKDOWN", result.getType());
        assertEquals("Task Breakdown Complete", result.getTitle());
        assertFalse(result.getIsRead());

        // Verify save was called
        verify(notificationRepository, times(1)).save(any(Notification.class));

        // Verify WebSocket message was sent
        verify(messagingTemplate, times(1)).convertAndSendToUser(
                eq("test@example.com"),
                eq("/queue/notifications"),
                any(NotificationDTO.class)
        );
    }

    @Test
    @DisplayName("Should get paginated notifications for user")
    void getNotifications_shouldReturnPaginatedResults() {
        // Arrange
        Page<Notification> page = new PageImpl<>(List.of(testNotification));
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(page);

        // Act
        Page<NotificationDTO> result = notificationService.getNotifications(1L, 0, 20);

        // Assert
        assertEquals(1, result.getContent().size());
        assertEquals("Task Breakdown Complete", result.getContent().get(0).getTitle());
    }

    @Test
    @DisplayName("Should get unread count for user")
    void getUnreadCount_shouldReturnCorrectCount() {
        // Arrange
        when(notificationRepository.countByUserIdAndIsReadFalse(1L)).thenReturn(5L);

        // Act
        long count = notificationService.getUnreadCount(1L);

        // Assert
        assertEquals(5L, count);
    }

    @Test
    @DisplayName("Should mark notification as read")
    void markAsRead_shouldUpdateNotification() {
        // Arrange
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(testNotification));

        // Act
        notificationService.markAsRead(1L, 1L);

        // Assert
        assertTrue(testNotification.getIsRead());
        assertNotNull(testNotification.getReadAt());
        verify(notificationRepository, times(1)).save(testNotification);
    }

    @Test
    @DisplayName("Should not mark notification as read if user doesn't own it")
    void markAsRead_shouldNotUpdateIfWrongUser() {
        // Arrange
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(testNotification));

        // Act
        notificationService.markAsRead(1L, 999L); // Different user ID

        // Assert
        assertFalse(testNotification.getIsRead());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should mark all notifications as read")
    void markAllAsRead_shouldCallRepository() {
        // Arrange
        when(notificationRepository.markAllAsReadByUserId(1L)).thenReturn(5);

        // Act
        int updated = notificationService.markAllAsRead(1L);

        // Assert
        assertEquals(5, updated);
        verify(notificationRepository, times(1)).markAllAsReadByUserId(1L);
    }

    @Test
    @DisplayName("Should handle WebSocket failure gracefully")
    void createNotification_shouldHandleWebSocketFailure() {
        // Arrange
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> {
                    Notification n = invocation.getArgument(0);
                    n.setId(1L);
                    n.setCreatedAt(LocalDateTime.now());
                    return n;
                });
        doThrow(new RuntimeException("WebSocket error"))
                .when(messagingTemplate).convertAndSendToUser(anyString(), anyString(), any());

        // Act - Should not throw despite WebSocket failure
        Notification result = notificationService.createNotification(
                testUser,
                "AI_BREAKDOWN",
                "Task Breakdown",
                "Test message",
                null
        );

        // Assert - Notification should still be created
        assertNotNull(result);
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }
}
