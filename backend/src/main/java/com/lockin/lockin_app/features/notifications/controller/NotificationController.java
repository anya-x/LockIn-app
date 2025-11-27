package com.lockin.lockin_app.features.notifications.controller;

import com.lockin.lockin_app.features.notifications.dto.NotificationDTO;
import com.lockin.lockin_app.features.notifications.service.NotificationService;
import com.lockin.lockin_app.features.users.service.UserService;
import com.lockin.lockin_app.shared.controller.BaseController;

import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for notification operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/notifications")
public class NotificationController extends BaseController {

    private final NotificationService notificationService;

    public NotificationController(
            UserService userService,
            NotificationService notificationService) {
        super(userService);
        this.notificationService = notificationService;
    }

    /**
     * Get all notifications for current user (paginated).
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.debug("Getting notifications for user {} (page: {}, size: {})",
                getCurrentUserEmail(userDetails), page, size);

        Long userId = getCurrentUserId(userDetails);
        Page<NotificationDTO> notifications = notificationService.getNotifications(userId, page, size);

        return ResponseEntity.ok(notifications);
    }

    /**
     * Get all notifications (non-paginated, for small lists).
     */
    @GetMapping("/all")
    public ResponseEntity<List<NotificationDTO>> getAllNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("Getting all notifications for user {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        List<NotificationDTO> notifications = notificationService.getAllNotifications(userId);

        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notifications.
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("Getting unread notifications for user {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        List<NotificationDTO> notifications = notificationService.getUnreadNotifications(userId);

        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notification count.
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("Getting unread count for user {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        long count = notificationService.getUnreadCount(userId);

        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Mark a specific notification as read.
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("Marking notification {} as read for user {}",
                notificationId, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        notificationService.markAsRead(notificationId, userId);

        return ResponseEntity.noContent().build();
    }

    /**
     * Mark all notifications as read.
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("Marking all notifications as read for user {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        int updated = notificationService.markAllAsRead(userId);

        return ResponseEntity.ok(Map.of("updated", updated));
    }
}
