package com.lockin.lockin_app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

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
    @Column(name = "token_expires_at", nullable = false)
    private ZonedDateTime tokenExpiresAt;

    /**
     * Scope granted by user
     * e.g., "https://www.googleapis.com/auth/calendar"
     */
    @Column(name = "scope", length = 500)
    private String scope;

    /**
     * Whether the calendar connection is active
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * When the user first connected their calendar
     */
    @Column(name = "connected_at")
    private ZonedDateTime connectedAt;

    /**
     * When the calendar was last synced
     */
    @Column(name = "last_sync_at")
    private ZonedDateTime lastSyncAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = ZonedDateTime.now();
        updatedAt = ZonedDateTime.now();
        if (connectedAt == null) {
            connectedAt = ZonedDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = ZonedDateTime.now();
    }

    /**
     * Check if the access token is expired
     */
    public boolean isExpired() {
        return ZonedDateTime.now().isAfter(tokenExpiresAt);
    }

    /**
     * Check if token needs refresh (expires within 5 minutes)
     */
    public boolean needsRefresh() {
        return ZonedDateTime.now().plusMinutes(5).isAfter(tokenExpiresAt);
    }
}
