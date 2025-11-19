package com.lockin.lockin_app.features.focus_sessions.controller;

import com.lockin.lockin_app.features.focus_sessions.dto.FocusSessionRequestDTO;
import com.lockin.lockin_app.features.focus_sessions.dto.FocusSessionResponseDTO;
import com.lockin.lockin_app.features.focus_sessions.service.FocusSessionService;
import com.lockin.lockin_app.features.users.service.UserService;
import com.lockin.lockin_app.shared.controller.BaseController;

import jakarta.validation.Valid;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/sessions")
public class FocusSessionController extends BaseController {

    private final FocusSessionService sessionService;

    public FocusSessionController(UserService userService, FocusSessionService sessionService) {
        super(userService);
        this.sessionService = sessionService;
    }

    @GetMapping
    public ResponseEntity<List<FocusSessionResponseDTO>> getUserSessions(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/sessions: User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        List<FocusSessionResponseDTO> sessions = sessionService.getUserSessions(userId);

        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/start")
    public ResponseEntity<FocusSessionResponseDTO> startSession(
            @Valid @RequestBody FocusSessionRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/sessions/start: User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        FocusSessionResponseDTO session = sessionService.startSession(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<FocusSessionResponseDTO> completeSession(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/sessions/{}/complete: User: {}", id, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        Integer actualMinutes = request.get("actualMinutes");

        FocusSessionResponseDTO session = sessionService.completeSession(id, userId, actualMinutes);

        return ResponseEntity.ok(session);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FocusSessionResponseDTO> updateSession(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("PUT /api/sessions/{}: User: {}", id, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        Integer actualMinutes = request.get("actualMinutes");

        FocusSessionResponseDTO session = sessionService.updateSession(id, userId, actualMinutes);

        return ResponseEntity.ok(session);
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayStats(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/sessions/today: User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        Integer totalMinutes = sessionService.getTotalFocusMinutesToday(userId);
        List<FocusSessionResponseDTO> sessions = sessionService.getTodaysSessions(userId);

        return ResponseEntity.ok(
                Map.of("totalMinutes", totalMinutes, "sessionsCompleted", sessions.size()));
    }

    @PutMapping("/{id}/notes")
    public ResponseEntity<FocusSessionResponseDTO> updateSessionNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("PUT /api/sessions/{}/notes: User: {}", id, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        String notes = request.get("notes");

        FocusSessionResponseDTO session = sessionService.updateSessionNotes(id, userId, notes);

        return ResponseEntity.ok(session);
    }
}
