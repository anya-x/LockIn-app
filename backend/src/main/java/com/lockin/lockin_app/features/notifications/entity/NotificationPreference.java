package com.lockin.lockin_app.features.notifications.entity;

import com.lockin.lockin_app.features.users.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * User notification preferences.
 *
 * Controls which types of notifications a user receives.
 */
@Entity
@Table(name = "notification_preferences")
@Getter
@Setter
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Enable browser push notifications.
     */
    @Column(nullable = false)
    private Boolean browserNotifications = true;

    /**
     * AI feature notifications (task breakdown, daily briefing).
     */
    @Column(nullable = false)
    private Boolean aiNotifications = true;

    /**
     * Calendar sync notifications.
     */
    @Column(nullable = false)
    private Boolean calendarNotifications = true;

    /**
     * Task due date reminders.
     */
    @Column(nullable = false)
    private Boolean taskReminders = true;
}
