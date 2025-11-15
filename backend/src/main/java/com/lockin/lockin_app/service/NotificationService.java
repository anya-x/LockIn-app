package com.lockin.lockin_app.service;

import com.lockin.lockin_app.entity.Notification;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;

/**
 * Service for managing notifications.
 *
 * Trying to reuse WebSocket from Month 3.
 *
 * BUG: This might not work with React Query! Need to test.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

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
        notification.setCreatedAt(ZonedDateTime.now());
        notification.setIsRead(false);

        notification = notificationRepository.save(notification);

        // Send via WebSocket
        // BUG: This destination might be wrong? Need to check Month 3 code
        messagingTemplate.convertAndSendToUser(
            user.getEmail(),
            "/queue/notifications",
            notification
        );

        return notification;
    }

    // TODO: Add other methods later
}
