package com.lockin.lockin_app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "badges",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "badge_type"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "badge_type", nullable = false)
    private BadgeType badgeType;

    @Column(name = "earned_at", nullable = false)
    private LocalDateTime earnedAt;

    @PrePersist
    protected void onCreate() {
        earnedAt = LocalDateTime.now();
    }
}
