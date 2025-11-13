package com.lockin.lockin_app.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
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

    @Value("${google.oauth.redirect-uri}")
    private String redirectUri;

    @Value("${google.oauth.scopes}")
    private String scopes;

    // TODO: Move this to a proper session store or Redis
    // For now just using in-memory map (will break with multiple instances!)
    private final Map<String, String> stateTokens = new HashMap<>();

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
     *
     * WIP: Need to implement token exchange
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
            // TODO: Redirect to frontend with error
            return new RedirectView("http://localhost:5173/settings?error=" + error);
        }

        // TODO: Exchange code for tokens
        // TODO: Store encrypted tokens
        // TODO: Redirect to frontend success page

        return new RedirectView("http://localhost:5173/settings?success=true");
    }
}
