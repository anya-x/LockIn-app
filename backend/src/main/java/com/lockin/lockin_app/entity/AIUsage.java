package com.lockin.lockin_app.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Tracks AI feature usage for cost monitoring and rate limiting.
 *
 * WIP: Basic entity structure
 * TODO: Add indexes for querying
 * TODO: Add aggregation methods
 */
@Entity
@Table(name = "ai_usage")
@Getter
@Setter
public class AIUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String featureType; // BREAKDOWN, ENHANCE, BRIEFING

    @Column(nullable = false)
    private Integer tokensUsed;

    @Column(nullable = false)
    private Double costUSD;

    @Column(length = 1000)
    private String requestDetails; // JSON with task title, etc.

    @Column(length = 2000)
    private String responseDetails; // JSON with subtasks count, etc.

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
