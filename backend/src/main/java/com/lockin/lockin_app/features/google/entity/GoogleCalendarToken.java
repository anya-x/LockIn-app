package com.lockin.lockin_app.features.google.entity;

import com.lockin.lockin_app.features.users.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;

@Entity
@Table(name = "google_calendar_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GoogleCalendarToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 500)
    private String encryptedAccessToken;

    @Column(nullable = false, length = 500)
    private String encryptedRefreshToken;

    @Column(nullable = false)
    private ZonedDateTime tokenExpiresAt;

    @Column(nullable = false)
    private ZonedDateTime connectedAt;

    @Column(nullable = false)
    private ZonedDateTime lastSyncAt;

    @Column(nullable = false)
    private Boolean isActive = true;
}