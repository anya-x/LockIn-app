package com.lockin.lockin_app.features.google.controller;

import com.lockin.lockin_app.features.google.service.GoogleCalendarService;
import com.lockin.lockin_app.features.google.service.GoogleOAuthService;
import com.lockin.lockin_app.features.users.service.UserService;
import com.lockin.lockin_app.shared.controller.BaseController;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Base64;
import java.util.Map;

/**
 * Controller for Google Calendar OAuth integration.
 *
 * Handles OAuth flow and calendar connection management.
 */
@Slf4j
@RestController
@RequestMapping("/api/calendar")
public class GoogleCalendarController extends BaseController {

    private final GoogleCalendarService calendarService;
    private final GoogleOAuthService oauthService;

    @Value("${google.oauth.client-id}")
    private String clientId;

    @Value("${google.oauth.redirect-uri}")
    private String redirectUri;

    @Value("${google.oauth.scopes}")
    private String scopes;

    public GoogleCalendarController(
            UserService userService,
            GoogleCalendarService calendarService,
            GoogleOAuthService oauthService) {
        super(userService);
        this.calendarService = calendarService;
        this.oauthService = oauthService;
    }

    /**
     * Initiates Google Calendar OAuth connection flow.
     *
     * @param userDetails authenticated user
     * @return OAuth authorization URL
     */
    @GetMapping("/connect")
    public ResponseEntity<?> connectCalendar(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("User {} initiating Google Calendar connection",
                getCurrentUserEmail(userDetails));

        try {
            // Build Google authorization URL
            String authUrl = String.format(
                "https://accounts.google.com/o/oauth2/v2/auth?" +
                "client_id=%s&" +
                "redirect_uri=%s&" +
                "response_type=code&" +
                "scope=%s&" +
                "access_type=offline&" +  // Request refresh token
                "prompt=consent&" +        // Force consent screen
                "state=%s",                // CSRF protection
                clientId,
                redirectUri,
                scopes,
                generateStateToken(getCurrentUserEmail(userDetails))
            );

            log.info("Generated auth URL for user");

            return ResponseEntity.ok(Map.of("authorizationUrl", authUrl));

        } catch (Exception e) {
            log.error("Failed to generate authorization URL", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to generate authorization URL"));
        }
    }

    /**
     * Handles OAuth callback from Google.
     *
     * Exchanges authorization code for access tokens and stores encrypted tokens.
     *
     * @param code authorization code from Google
     * @param state state parameter for CSRF protection
     * @param error error message if authorization failed
     * @return redirect to frontend with success or error status
     */
    @GetMapping("/oauth/callback/")
    public RedirectView oauthCallback(
            @RequestParam String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {

        log.info("OAuth callback received");

        if (error != null) {
            log.error("OAuth error: {}", error);
            return new RedirectView("http://localhost:5173/settings?error=" + error);
        }

        try {
            // TODO: Validate state parameter!
            // TODO: Extract userId from state

            // For now, hardcoding user ID for testing
            // BUG: This won't work in production!
            Long userId = 1L;

            oauthService.exchangeCodeForTokens(code, userId);

            log.info("OAuth flow completed successfully");
            return new RedirectView("http://localhost:5173/settings?connected=true");

        } catch (Exception e) {
            log.error("OAuth callback failed", e);
            return new RedirectView("http://localhost:5173/settings?error=token_exchange_failed");
        }
    }

    /**
     * Generate CSRF state token.
     * TODO: Store in session or database for validation
     */
    private String generateStateToken(String username) {
        // Simple state token (username + timestamp)
        // TODO: Make this more secure!
        return Base64.getEncoder().encodeToString(
            (username + ":" + System.currentTimeMillis()).getBytes()
        );
    }
}
