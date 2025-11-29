package com.lockin.lockin_app.features.users.dto;

import com.lockin.lockin_app.features.users.entity.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesDTO {

    private Boolean aiNotifications;
    private Boolean calendarNotifications;
    private Boolean taskReminders;

    public static NotificationPreferencesDTO fromUser(User user) {
        return NotificationPreferencesDTO.builder()
                .aiNotifications(user.getNotifyAiFeatures())
                .calendarNotifications(user.getNotifyCalendarSync())
                .taskReminders(user.getNotifyTaskReminders())
                .build();
    }
}
