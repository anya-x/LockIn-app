package com.lockin.lockin_app.features.notifications.service;

import com.lockin.lockin_app.features.notifications.dto.NotificationDTO;
import com.lockin.lockin_app.features.notifications.entity.Notification;
import com.lockin.lockin_app.features.notifications.repository.NotificationRepository;
import com.lockin.lockin_app.features.users.entity.User;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Notification createNotification(
            User user,
            String type,
            String title,
            String message,
            String actionUrl) {

        log.info("Creating notification for user {}: {}", user.getEmail(), title);

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setActionUrl(actionUrl);
        notification.setIsRead(false);

        notification = notificationRepository.save(notification);

        sendRealTimeNotification(user.getEmail(), notification);

        return notification;
    }

    private void sendRealTimeNotification(String userEmail, Notification notification) {
        try {
            NotificationDTO dto = NotificationDTO.fromEntity(notification);
            messagingTemplate.convertAndSendToUser(
                    userEmail,
                    "/queue/notifications",
                    dto
            );
            log.debug("Sent real-time notification to user: {}", userEmail);
        } catch (Exception e) {
            log.error("Failed to send real-time notification to {}: {}", userEmail, e.getMessage());
        }
    }


    @Transactional(readOnly = true)
    public Page<NotificationDTO> getNotifications(Long userId, int page, int size) {
        log.debug("Getting notifications for user {} (page: {}, size: {})", userId, page, size);

        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationDTO::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getAllNotifications(Long userId) {
        log.debug("Getting all notifications for user {}", userId);

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadNotifications(Long userId) {
        log.debug("Getting unread notifications for user {}", userId);

        return notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        log.debug("Marking notification {} as read for user {}", notificationId, userId);

        notificationRepository.findById(notificationId)
                              .ifPresent(notification -> {
                                  if (notification.getUser().getId().equals(userId)) {
                                      notification.setIsRead(true);
                                      notification.setReadAt(LocalDateTime.now());
                                      notificationRepository.save(notification);
                                  }
                              });
    }

    @Transactional
    public int markAllAsRead(Long userId) {
        log.info("Marking all notifications as read for user {}", userId);

        return notificationRepository.markAllAsReadByUserId(userId);
    }
}
