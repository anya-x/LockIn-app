package com.lockin.lockin_app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity to store encrypted Google Calendar OAuth2 tokens
 * Tokens are encrypted before storage for security
 */
@Entity
@Table(name = "google_calendar_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleCalendarToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Encrypted access token
     * Encrypted using AES-256 before storage
     */
    @Column(name = "encrypted_access_token", nullable = false, length = 1000)
    private String encryptedAccessToken;

    /**
     * Encrypted refresh token
     * Encrypted using AES-256 before storage
     */
    @Column(name = "encrypted_refresh_token", length = 1000)
    private String encryptedRefreshToken;

    /**
     * Token expiry time
     * Used to determine when to refresh the token
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Scope granted by user
     * e.g., "https://www.googleapis.com/auth/calendar"
     */
    @Column(name = "scope", length = 500)
    private String scope;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Check if the access token is expired
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Check if token needs refresh (expires within 5 minutes)
     */
    public boolean needsRefresh() {
        return LocalDateTime.now().plusMinutes(5).isAfter(expiresAt);
    }
}
