package com.lockin.lockin_app.features.google.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleRefreshTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.lockin.lockin_app.features.google.entity.GoogleCalendarToken;
import com.lockin.lockin_app.features.google.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.features.users.repository.UserRepository;
import com.lockin.lockin_app.security.TokenEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;

/**
 * Service for handling Google OAuth token exchange and storage.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleOAuthService {

    private final GoogleCalendarTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final TokenEncryptionService encryptionService;

    @Value("${google.oauth.client-id}")
    private String clientId;

    @Value("${google.oauth.client-secret}")
    private String clientSecret;

    @Value("${google.oauth.redirect-uri}")
    private String redirectUri;

    /**
     * Exchange authorization code for access/refresh tokens.
     *
     * @param code Authorization code from Google
     * @param userId User who authorized
     */
    @Transactional
    public void exchangeCodeForTokens(String code, Long userId) {
        log.info("Exchanging authorization code for tokens (user: {})", userId);

        try {
            // Exchange code for tokens using Google API
            GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                "https://oauth2.googleapis.com/token",
                clientId,
                clientSecret,
                code,
                redirectUri
            ).execute();

            String accessToken = tokenResponse.getAccessToken();
            String refreshToken = tokenResponse.getRefreshToken();
            Long expiresInSeconds = tokenResponse.getExpiresInSeconds();

            log.info("Token exchange successful! Access token expires in {} seconds",
                expiresInSeconds);

            if (refreshToken == null) {
                log.warn("No refresh token received! User may have already authorized before.");
                // This happens if user already authorized once
                // Would need to revoke and re-authorize to get new refresh token
            }

            // Encrypt tokens before storage
            String encryptedAccessToken = encryptionService.encrypt(accessToken);
            String encryptedRefreshToken = refreshToken != null
                ? encryptionService.encrypt(refreshToken)
                : null;

            // Store in database
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            GoogleCalendarToken token = new GoogleCalendarToken();
            token.setUser(user);
            token.setEncryptedAccessToken(encryptedAccessToken);
            token.setEncryptedRefreshToken(encryptedRefreshToken);
            token.setTokenExpiresAt(ZonedDateTime.now().plusSeconds(expiresInSeconds));
            token.setConnectedAt(ZonedDateTime.now());
            token.setLastSyncAt(ZonedDateTime.now());
            token.setIsActive(true);

            // Delete old token if exists
            tokenRepository.findByUser(user).ifPresent(tokenRepository::delete);

            tokenRepository.save(token);

            log.info("Tokens stored successfully for user {}", userId);

        } catch (Exception e) {
            log.error("Failed to exchange code for tokens", e);
            throw new RuntimeException("OAuth token exchange failed: " + e.getMessage(), e);
        }
    }

    /**
     * Refresh expired access token using refresh token.
     *
     * WIP: Basic implementation
     * TODO: Handle errors
     */
    @Transactional
    public void refreshAccessToken(User user) {
        log.info("Refreshing access token for user {}", user.getId());

        GoogleCalendarToken tokenEntity = tokenRepository.findByUser(user)
            .orElseThrow(() -> new RuntimeException("No calendar connection found"));

        if (tokenEntity.getEncryptedRefreshToken() == null) {
            throw new RuntimeException("No refresh token available");
        }

        try {
            String refreshToken = encryptionService.decrypt(
                tokenEntity.getEncryptedRefreshToken()
            );

            // Use Google API to refresh token
            GoogleTokenResponse response = new GoogleRefreshTokenRequest(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                refreshToken,
                clientId,
                clientSecret
            ).execute();

            String newAccessToken = response.getAccessToken();
            Long expiresInSeconds = response.getExpiresInSeconds();

            // Update token in database
            tokenEntity.setEncryptedAccessToken(
                encryptionService.encrypt(newAccessToken)
            );
            tokenEntity.setTokenExpiresAt(
                ZonedDateTime.now().plusSeconds(expiresInSeconds)
            );

            tokenRepository.save(tokenEntity);

            log.info("Token refreshed successfully for user {}", user.getId());

        } catch (Exception e) {
            log.error("Token refresh failed for user {}: {}",
                user.getId(), e.getMessage());
            throw new RuntimeException("Token refresh failed", e);
        }
    }
}
