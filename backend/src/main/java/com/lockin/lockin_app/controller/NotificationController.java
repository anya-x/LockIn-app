package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.entity.Notification;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.NotificationRepository;
import com.lockin.lockin_app.repository.UserRepository;
import com.lockin.lockin_app.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for notifications.
 *
 * WIP: Testing WebSocket integration
 */
@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> notifications = notificationRepository
            .findByUserOrderByCreatedAtDesc(user);

        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> unread = notificationRepository
            .findByUserAndIsReadFalseOrderByCreatedAtDesc(user);

        return ResponseEntity.ok(unread);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Notification not found"));

        // TODO: Validate user owns this notification

        notification.setIsRead(true);
        notificationRepository.save(notification);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> unread = notificationRepository
            .findByUserAndIsReadFalseOrderByCreatedAtDesc(user);

        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);

        return ResponseEntity.ok().build();
    }
}
