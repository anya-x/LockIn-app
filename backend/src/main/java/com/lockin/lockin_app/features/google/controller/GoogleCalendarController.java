package com.lockin.lockin_app.features.google.controller;

import com.lockin.lockin_app.features.google.service.GoogleCalendarService;
import com.lockin.lockin_app.features.users.service.UserService;
import com.lockin.lockin_app.shared.controller.BaseController;
import lombok.RequiredArgsConstructor;
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

@Slf4j
@RestController
@RequestMapping("/api/calendar")
public class GoogleCalendarController extends BaseController {

    private final GoogleCalendarService calendarService;

    @Value("${google.oauth.client-id}")
    private String clientId;

    @Value("${google.oauth.redirect-uri}")
    private String redirectUri;

    @Value("${google.oauth.scopes}")
    private String scopes;

    public GoogleCalendarController(
            UserService userService,
            GoogleCalendarService calendarService) {
        super(userService);
        this.calendarService = calendarService;
    }
    
    @GetMapping("/connect")
    public ResponseEntity<?> connectCalendar(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("GET /api/calendar/connect: User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);

        return ResponseEntity.ok("Not implemented yet");
    }

    @GetMapping("/oauth/callback")
    public RedirectView oauthCallback(
            @RequestParam String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error) {

        log.info("GET /api/calendar/oauth/callback: Code present: {}", code != null);

        if (error != null) {
            log.error("OAuth error received: {}", error);
            return new RedirectView("http://localhost:5173/settings?error=" + error);
        }

        return new RedirectView("http://localhost:5173/settings?success=true");
    }
}