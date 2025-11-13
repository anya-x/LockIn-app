package com.lockin.lockin_app.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * User notification preferences entity
 *
 * Stores user preferences for different notification types.
 * Currently stores preferences only - actual notification sending
 * will be implemented in Month 5 when SMTP is configured.
 *
 * TODO Month 5: Implement actual email sending (SendGrid/AWS SES)
 * TODO Month 5: Add browser notification API integration
 */
@Entity
@Table(name = "user_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Email notification preferences
    // Note: SMTP not configured yet - just storing user choices
    @Column(name = "email_notifications_enabled", nullable = false)
    private Boolean emailNotificationsEnabled = false;

    @Column(name = "weekly_report_email", nullable = false)
    private Boolean weeklyReportEmail = true;

    @Column(name = "achievement_email", nullable = false)
    private Boolean achievementEmail = true;

    @Column(name = "goal_completion_email", nullable = false)
    private Boolean goalCompletionEmail = true;

    // Browser notification preferences
    // TODO: Implement in Month 5
    @Column(name = "browser_notifications_enabled", nullable = false)
    private Boolean browserNotificationsEnabled = false;

    // Common pattern: Some devs would add timestamps here
    // but I'm keeping it simple for now since this is just
    // preference storage. Can always add later if needed.
}
