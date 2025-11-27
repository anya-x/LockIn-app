package com.lockin.lockin_app.features.google.controller;

import com.lockin.lockin_app.config.GoogleOAuthConfig;
import com.lockin.lockin_app.features.google.service.GoogleCalendarService;
import com.lockin.lockin_app.features.google.service.GoogleOAuthService;
import com.lockin.lockin_app.features.users.service.UserService;
import com.lockin.lockin_app.shared.controller.BaseController;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import java.util.Base64;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/calendar")
public class GoogleCalendarController extends BaseController {

    private final GoogleCalendarService calendarService;
    private final GoogleOAuthService oauthService;
    private final GoogleOAuthConfig oauthConfig;

    public GoogleCalendarController(
            UserService userService,
            GoogleCalendarService calendarService,
            GoogleOAuthService oauthService,
            GoogleOAuthConfig oauthConfig) {
        super(userService);
        this.calendarService = calendarService;
        this.oauthService = oauthService;
        this.oauthConfig = oauthConfig;
    }

    @GetMapping("/connect")
    public ResponseEntity<?> connectCalendar(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("User {} initiating Google Calendar connection",
                 getCurrentUserEmail(userDetails));

        try {
            // Build Google OAuth authorization URL using config
            String authUrl = String.format(
                    "https://accounts.google.com/o/oauth2/v2/auth?" +
                            "client_id=%s&" +
                            "redirect_uri=%s&" +
                            "response_type=code&" +
                            "scope=%s&" +
                            "access_type=offline&" +
                            "prompt=consent&" +
                            "state=%s",
                    oauthConfig.getClientId(),
                    oauthConfig.getRedirectUri(),
                    oauthConfig.getScopes(),
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
            String decodedState = new String(Base64.getDecoder().decode(state));
            String[] parts = decodedState.split(":");
            String userEmail = parts[0];

            log.info("Extracted user email from state: {}", userEmail);

            Long userId = userService.getUserIdFromEmail(userEmail);

            oauthService.exchangeCodeForTokens(code, userId);

            log.info("OAuth flow completed successfully for user {}", userId);
            return new RedirectView("http://localhost:5173/settings?connected=true");

        } catch (Exception e) {
            log.error("OAuth callback failed", e);
            return new RedirectView("http://localhost:5173/settings?error=token_exchange_failed");
        }
    }


    private String generateStateToken(String username) {
        return Base64.getEncoder().encodeToString(
                (username + ":" + System.currentTimeMillis()).getBytes()
        );
    }

    /**
     * Get calendar connection status.
     * Used by frontend to show current state.
     */
    @GetMapping("/status")
    public ResponseEntity<?> getStatus(
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            Long userId = userService.getUserIdFromEmail(getCurrentUserEmail(userDetails));
            var user = userService.getUserById(userId);

            var status = calendarService.getConnectionStatus(user);

            return ResponseEntity.ok(status);

        } catch (Exception e) {
            log.error("Failed to get calendar status", e);
            return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * Manual sync trigger.
     */
    @PostMapping("/sync-now")
    public ResponseEntity<?> syncNow(
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            Long userId = userService.getUserIdFromEmail(getCurrentUserEmail(userDetails));
            var user = userService.getUserById(userId);

            int created = calendarService.syncCalendarToTasks(user);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "tasksCreated", created
            ));

        } catch (Exception e) {
            log.error("Failed to sync calendar", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Disconnect calendar.
     * Removes stored tokens.
     */
    @DeleteMapping("/disconnect")
    public ResponseEntity<?> disconnect(
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            Long userId = userService.getUserIdFromEmail(getCurrentUserEmail(userDetails));
            var user = userService.getUserById(userId);

            calendarService.disconnectCalendar(user);

            log.info("User {} disconnected Google Calendar", userId);

            return ResponseEntity.ok(Map.of("disconnected", true));

        } catch (Exception e) {
            log.error("Failed to disconnect calendar", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
