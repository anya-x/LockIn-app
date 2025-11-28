package com.lockin.lockin_app.features.notifications.dto;

import com.lockin.lockin_app.features.notifications.entity.NotificationPreference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for notification preferences.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceDTO {

    private Boolean browserNotifications;
    private Boolean aiNotifications;
    private Boolean calendarNotifications;
    private Boolean taskReminders;

    public static NotificationPreferenceDTO fromEntity(NotificationPreference entity) {
        return NotificationPreferenceDTO.builder()
                .browserNotifications(entity.getBrowserNotifications())
                .aiNotifications(entity.getAiNotifications())
                .calendarNotifications(entity.getCalendarNotifications())
                .taskReminders(entity.getTaskReminders())
                .build();
    }

    /**
     * Default preferences for new users.
     */
    public static NotificationPreferenceDTO defaults() {
        return NotificationPreferenceDTO.builder()
                .browserNotifications(true)
                .aiNotifications(true)
                .calendarNotifications(true)
                .taskReminders(true)
                .build();
    }
}
