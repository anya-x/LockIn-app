package com.lockin.lockin_app.features.google.controller;

import com.lockin.lockin_app.config.GoogleOAuthConfig;
import com.lockin.lockin_app.features.google.service.GoogleCalendarService;
import com.lockin.lockin_app.features.google.service.GoogleOAuthService;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.features.users.service.UserService;
import com.lockin.lockin_app.shared.controller.BaseController;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
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
    public ResponseEntity<Map<String, String>> connectCalendar(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/calendar/connect : User: {}", getCurrentUserEmail(userDetails));

        try {
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

            return ResponseEntity.ok(Map.of("authorizationUrl", authUrl));

        } catch (Exception e) {
            log.error("Failed to generate authorization URL", e);
            return ResponseEntity.internalServerError()
                                 .body(Map.of("error", "Failed to generate authorization URL"));
        }
    }

    @GetMapping("/oauth/callback")
    public RedirectView oauthCallback(
            @RequestParam String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {

        log.debug("GET /api/calendar/oauth/callback/");

        if (error != null) {
            log.error("OAuth error: {}", error);
            return new RedirectView("http://localhost:5173/settings?error=" + error);
        }

        try {
            String decodedState = new String(Base64.getDecoder().decode(state));
            String[] parts = decodedState.split(":");
            String userEmail = parts[0];

            Long userId = userService.getUserIdFromEmail(userEmail);

            oauthService.exchangeCodeForTokens(code, userId);

            log.info("OAuth flow completed for user {}", userId);
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

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/calendar/status : User: {}", getCurrentUserEmail(userDetails));

        try {
            Long userId = getCurrentUserId(userDetails);
            User user = userService.getUserById(userId);

            Map<String, Object> status = calendarService.getConnectionStatus(user);

            return ResponseEntity.ok(status);

        } catch (Exception e) {
            log.error("Failed to get calendar status", e);
            return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/sync-now")
    public ResponseEntity<Map<String, Object>> syncNow(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/calendar/sync-now : User: {}", getCurrentUserEmail(userDetails));

        try {
            Long userId = getCurrentUserId(userDetails);
            User user = userService.getUserById(userId);

            // Bidirectional sync: pull from Google and push to Google
            int imported = calendarService.syncCalendarToTasks(user);
            int exported = calendarService.syncTasksToGoogle(user);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "tasksImported", imported,
                    "tasksExported", exported
            ));

        } catch (Exception e) {
            log.error("Failed to sync calendar", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/push-to-google")
    public ResponseEntity<Map<String, Object>> pushToGoogle(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/calendar/push-to-google : User: {}", getCurrentUserEmail(userDetails));

        try {
            Long userId = getCurrentUserId(userDetails);
            User user = userService.getUserById(userId);

            int exported = calendarService.syncTasksToGoogle(user);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "tasksExported", exported
            ));

        } catch (Exception e) {
            log.error("Failed to push tasks to Google", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<Map<String, Object>> disconnect(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("DELETE /api/calendar/disconnect : User: {}", getCurrentUserEmail(userDetails));

        try {
            Long userId = getCurrentUserId(userDetails);
            User user = userService.getUserById(userId);

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
