package com.lockin.lockin_app.features.google.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.lockin.lockin_app.config.GoogleOAuthConfig;
import com.lockin.lockin_app.features.google.entity.GoogleCalendarToken;
import com.lockin.lockin_app.features.google.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.features.users.repository.UserRepository;
import com.lockin.lockin_app.security.TokenEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;


@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleOAuthService {

    private final GoogleCalendarTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final TokenEncryptionService encryptionService;
    private final GoogleOAuthConfig oauthConfig;

    @Transactional
    public void exchangeCodeForTokens(String code, Long userId) {
        log.info("Exchanging authorization code for tokens (user: {})", userId);

        try {
            GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance(),
                    "https://oauth2.googleapis.com/token",
                    oauthConfig.getClientId(),
                    oauthConfig.getClientSecret(),
                    code,
                    oauthConfig.getRedirectUri()
            ).execute();

            String accessToken = tokenResponse.getAccessToken();
            String refreshToken = tokenResponse.getRefreshToken();
            Long expiresInSeconds = tokenResponse.getExpiresInSeconds();

            log.info("Token exchange successful! Access token expires in {} seconds",
                     expiresInSeconds);

            if (refreshToken == null) {
                log.warn("No refresh token received! User may have already authorized before.");
            }

            String encryptedAccessToken = encryptionService.encrypt(accessToken);
            String encryptedRefreshToken = refreshToken != null
                    ? encryptionService.encrypt(refreshToken)
                    : null;

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

            tokenRepository.findByUser(user).ifPresent(tokenRepository::delete);

            tokenRepository.save(token);

            log.info("Tokens stored successfully for user {}", userId);

        } catch (Exception e) {
            log.error("Failed to exchange code for tokens", e);
            throw new RuntimeException("OAuth token exchange failed: " + e.getMessage(), e);
        }
    }
}