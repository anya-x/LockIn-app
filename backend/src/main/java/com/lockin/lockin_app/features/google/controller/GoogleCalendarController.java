package com.lockin.lockin_app.features.google.controller;

import com.google.api.services.calendar.Calendar;
import com.lockin.lockin_app.features.google.entity.GoogleCalendarToken;
import com.lockin.lockin_app.features.google.repository.GoogleCalendarTokenRepository;
import com.lockin.lockin_app.features.google.service.GoogleCalendarService;
import com.lockin.lockin_app.features.google.service.GoogleOAuthService;
import com.lockin.lockin_app.features.users.entity.User;
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

import java.time.ZonedDateTime;
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
    private final GoogleCalendarTokenRepository tokenRepository;

    @Value("${google.oauth.client-id}")
    private String clientId;

    @Value("${google.oauth.redirect-uri}")
    private String redirectUri;

    @Value("${google.oauth.scopes}")
    private String scopes;

    public GoogleCalendarController(
            UserService userService,
            GoogleCalendarService calendarService,
            GoogleOAuthService oauthService,
            GoogleCalendarTokenRepository tokenRepository) {
        super(userService);
        this.calendarService = calendarService;
        this.oauthService = oauthService;
        this.tokenRepository = tokenRepository;
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
            // Decode state parameter to get user email
            String decodedState = new String(Base64.getDecoder().decode(state));
            String[] parts = decodedState.split(":");
            String userEmail = parts[0];

            log.info("Extracted user email from state: {}", userEmail);

            // Get user ID from email
            Long userId = userService.getUserIdFromEmail(userEmail);

            oauthService.exchangeCodeForTokens(code, userId);

            log.info("OAuth flow completed successfully for user {}", userId);
            return new RedirectView("http://localhost:5173/settings?connected=true");

        } catch (Exception e) {
            log.error("OAuth callback failed", e);
            return new RedirectView("http://localhost:5173/settings?error=token_exchange_failed");
        }
    }

    /**
     * Test calendar connection.
     *
     * @param userDetails authenticated user
     * @return connection status
     */
    @GetMapping("/test-connection")
    public ResponseEntity<?> testConnection(
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            Long userId = getCurrentUserId(userDetails);
            User user = userService.getUserByEmail(getCurrentUserEmail(userDetails));

            Calendar calendar = calendarService.buildCalendarClient(user);

            // Try to get calendar info
            com.google.api.services.calendar.model.Calendar primaryCalendar =
                calendar.calendars().get("primary").execute();

            return ResponseEntity.ok(Map.of(
                "connected", true,
                "calendarSummary", primaryCalendar.getSummary()
            ));

        } catch (Exception e) {
            log.error("Calendar connection test failed", e);
            return ResponseEntity.ok(Map.of(
                "connected", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Test sync - fetch recent calendar events.
     *
     * @param userDetails authenticated user
     * @return list of events
     */
    @GetMapping("/sync-now")
    public ResponseEntity<?> syncNow(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = getCurrentUserId(userDetails);
            User user = userService.getUserByEmail(getCurrentUserEmail(userDetails));

            java.util.List<com.google.api.services.calendar.model.Event> events =
                calendarService.fetchRecentEvents(user, 10);

            return ResponseEntity.ok(Map.of(
                "eventCount", events.size(),
                "events", events.stream()
                    .map(e -> Map.of(
                        "id", e.getId() != null ? e.getId() : "",
                        "summary", e.getSummary() != null ? e.getSummary() : ""
                    ))
                    .toList()
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Check calendar connection status for the authenticated user.
     *
     * @param userDetails authenticated user
     * @return connection status with details
     */
    @GetMapping("/status")
    public ResponseEntity<?> getConnectionStatus(
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            User user = userService.getUserByEmail(getCurrentUserEmail(userDetails));

            GoogleCalendarToken token = tokenRepository.findByUser(user).orElse(null);

            if (token == null) {
                return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "message", "No calendar connection found"
                ));
            }

            boolean isExpired = token.getTokenExpiresAt().isBefore(ZonedDateTime.now());
            boolean isActive = token.getIsActive() && !isExpired;

            return ResponseEntity.ok(Map.of(
                "connected", isActive,
                "isActive", token.getIsActive(),
                "isExpired", isExpired,
                "connectedAt", token.getConnectedAt().toString(),
                "lastSyncAt", token.getLastSyncAt() != null
                    ? token.getLastSyncAt().toString()
                    : "Never"
            ));

        } catch (Exception e) {
            log.error("Failed to check connection status", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to check connection status"));
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
