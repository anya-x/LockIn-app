package com.lockin.lockin_app.features.notifications.dto;

import com.lockin.lockin_app.features.notifications.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for notification data transfer.
 * Used for both REST API and WebSocket messages.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {

    private Long id;
    private String type;
    private String title;
    private String message;
    private String actionUrl;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;

    /**
     * Convert entity to DTO.
     */
    public static NotificationDTO fromEntity(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setActionUrl(notification.getActionUrl());
        dto.setIsRead(notification.getIsRead());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setReadAt(notification.getReadAt());
        return dto;
    }
}
