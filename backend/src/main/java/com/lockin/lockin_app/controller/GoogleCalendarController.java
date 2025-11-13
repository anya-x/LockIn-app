package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.entity.GoogleCalendarToken;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.repository.UserRepository;
import com.lockin.lockin_app.security.TokenEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.ZonedDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for Google Calendar OAuth and sync.
 *
 * WIP: OAuth flow implementation in progress
 * TODO: Implement callback handling
 * TODO: Error handling
 */
@Slf4j
@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class GoogleCalendarController {

    @Value("${google.oauth.client-id}")
    private String clientId;

    @Value("${google.oauth.client-secret}")
    private String clientSecret;

    @Value("${google.oauth.redirect-uri}")
    private String redirectUri;

    @Value("${google.oauth.scopes}")
    private String scopes;

    private final TokenEncryptionService encryptionService;
    private final GoogleCalendarTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    // TODO: Move this to a proper session store or Redis
    // For now just using in-memory map (will break with multiple instances!)
    private final Map<String, String> stateTokens = new HashMap<>();

    /**
     * Check if user has connected Google Calendar.
     */
    @GetMapping("/status")
    public ResponseEntity<?> getConnectionStatus(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isConnected = tokenRepository.findByUser(user)
            .map(GoogleCalendarToken::getIsActive)
            .orElse(false);

        Map<String, Object> response = new HashMap<>();
        response.put("connected", isConnected);

        if (isConnected) {
            GoogleCalendarToken token = tokenRepository.findByUser(user).get();
            response.put("connectedAt", token.getConnectedAt());
            response.put("lastSyncAt", token.getLastSyncAt());
            response.put("tokenExpiresAt", token.getTokenExpiresAt());
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Disconnect Google Calendar.
     * Removes stored tokens so user can reconnect fresh.
     *
     * This is the solution to token refresh problems:
     * Just let users disconnect and reconnect manually!
     */
    @DeleteMapping("/disconnect")
    public ResponseEntity<?> disconnectCalendar(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("User {} disconnecting Google Calendar", userDetails.getUsername());

        User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

        tokenRepository.findByUser(user).ifPresent(token -> {
            log.info("Deleting calendar tokens for user {}", user.getEmail());
            tokenRepository.delete(token);
        });

        Map<String, String> response = new HashMap<>();
        response.put("message", "Calendar disconnected successfully");

        return ResponseEntity.ok(response);
    }

    /**
     * Generate Google OAuth authorization URL.
     * User clicks "Connect Google Calendar" -> redirects here.
     */
    @GetMapping("/connect")
    public ResponseEntity<?> connectCalendar(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("User {} initiating Google Calendar connection",
            userDetails.getUsername());

        // Generate CSRF protection token
        String state = generateStateToken(userDetails.getUsername());

        // Build Google authorization URL
        String authUrl = String.format(
            "https://accounts.google.com/o/oauth2/v2/auth?" +
            "client_id=%s&" +
            "redirect_uri=%s&" +
            "response_type=code&" +
            "scope=%s&" +
            "access_type=offline&" +
            "prompt=consent&" +
            "state=%s",
            URLEncoder.encode(clientId, StandardCharsets.UTF_8),
            URLEncoder.encode(redirectUri, StandardCharsets.UTF_8),
            URLEncoder.encode(scopes, StandardCharsets.UTF_8),
            state
        );

        log.info("Generated OAuth URL for user {}", userDetails.getUsername());

        Map<String, String> response = new HashMap<>();
        response.put("authorizationUrl", authUrl);

        return ResponseEntity.ok(response);
    }

    /**
     * Generate cryptographically secure state token for CSRF protection.
     *
     * @param username User identifier to associate with this OAuth flow
     * @return Base64-encoded random token
     */
    private String generateStateToken(String username) {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        // Store token temporarily (expires after callback or 10 minutes)
        // TODO: Add expiration logic
        stateTokens.put(token, username);

        log.debug("Generated state token for user {}", username);
        return token;
    }

    /**
     * OAuth callback endpoint.
     * Google redirects here after user authorizes.
     */
    @GetMapping("/oauth/callback")
    public RedirectView oauthCallback(
            @RequestParam String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {

        log.info("OAuth callback received with code: {}",
            code != null ? "present" : "missing");

        if (error != null) {
            log.error("OAuth error: {}", error);
            return new RedirectView("http://localhost:5173/settings?error=" + error);
        }

        // Verify state token
        if (state == null || !stateTokens.containsKey(state)) {
            log.error("Invalid or missing state token");
            return new RedirectView("http://localhost:5173/settings?error=invalid_state");
        }

        String username = stateTokens.remove(state);
        log.info("State verified for user: {}", username);

        try {
            // Exchange authorization code for tokens
            Map<String, String> tokenRequest = new HashMap<>();
            tokenRequest.put("code", code);
            tokenRequest.put("client_id", clientId);
            tokenRequest.put("client_secret", clientSecret);
            // FIXED: Must match EXACTLY what was sent in authorization URL
            tokenRequest.put("redirect_uri", redirectUri);
            tokenRequest.put("grant_type", "authorization_code");

            log.info("Exchanging code for tokens...");

            ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(
                "https://oauth2.googleapis.com/token",
                tokenRequest,
                Map.class
            );

            Map<String, Object> tokens = tokenResponse.getBody();
            String accessToken = (String) tokens.get("access_token");
            String refreshToken = (String) tokens.get("refresh_token");
            Integer expiresIn = (Integer) tokens.get("expires_in");

            log.info("Tokens received successfully for user {}", username);

            // Find user and store encrypted tokens
            User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

            // Encrypt tokens before storage
            String encryptedAccessToken = encryptionService.encrypt(accessToken);
            String encryptedRefreshToken = encryptionService.encrypt(refreshToken);

            // Check if user already has tokens (reconnecting)
            GoogleCalendarToken tokenEntity = tokenRepository.findByUser(user)
                .orElse(new GoogleCalendarToken());

            tokenEntity.setUser(user);
            tokenEntity.setEncryptedAccessToken(encryptedAccessToken);
            tokenEntity.setEncryptedRefreshToken(encryptedRefreshToken);
            tokenEntity.setTokenExpiresAt(ZonedDateTime.now().plusSeconds(expiresIn));
            tokenEntity.setIsActive(true);

            // Only set connectedAt if this is a new connection
            if (tokenEntity.getId() == null) {
                tokenEntity.setConnectedAt(ZonedDateTime.now());
            }
            tokenEntity.setLastSyncAt(ZonedDateTime.now());

            tokenRepository.save(tokenEntity);

            log.info("Tokens stored successfully for user {}", username);

            return new RedirectView("http://localhost:5173/settings?success=true");

        } catch (Exception e) {
            log.error("Error during token exchange", e);
            return new RedirectView("http://localhost:5173/settings?error=token_exchange_failed");
        }
    }
}
