package com.lockin.lockin_app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

/**
 * Notification entity for user alerts.
 *
 * TODO: Figure out if we need a read_at timestamp or just boolean
 * TODO: Should we have priority levels?
 */
@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String type; // "AI_BREAKDOWN", "TASK_DUE", "CALENDAR_SYNC", etc.

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column
    private String actionUrl; // Link to relevant page

    @Column(nullable = false)
    private Boolean isRead = false;

    @Column(nullable = false)
    private ZonedDateTime createdAt;

    // Not sure if we need this yet
    @Column
    private ZonedDateTime readAt;
}
