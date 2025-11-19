package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.FocusSessionRequestDTO;
import com.lockin.lockin_app.dto.FocusSessionResponseDTO;
import com.lockin.lockin_app.service.FocusSessionService;
import com.lockin.lockin_app.features.users.service.UserService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class FocusSessionController {

    private final FocusSessionService sessionService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<FocusSessionResponseDTO>> getUserSessions(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/sessions: User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        List<FocusSessionResponseDTO> sessions = sessionService.getUserSessions(userId);

        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/start")
    public ResponseEntity<FocusSessionResponseDTO> startSession(
            @Valid @RequestBody FocusSessionRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/sessions/start: User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        FocusSessionResponseDTO session = sessionService.startSession(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<FocusSessionResponseDTO> completeSession(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/sessions/{}/complete: User: {}", id, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        Integer actualMinutes = request.get("actualMinutes");

        FocusSessionResponseDTO session = sessionService.completeSession(id, userId, actualMinutes);

        return ResponseEntity.ok(session);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FocusSessionResponseDTO> updateSession(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("PUT /api/sessions/{}: User: {}", id, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        Integer actualMinutes = request.get("actualMinutes");

        FocusSessionResponseDTO session = sessionService.updateSession(id, userId, actualMinutes);

        return ResponseEntity.ok(session);
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayStats(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/sessions/today: User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
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

        log.debug("PUT /api/sessions/{}/notes: User: {}", id, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        String notes = request.get("notes");

        FocusSessionResponseDTO session = sessionService.updateSessionNotes(id, userId, notes);

        return ResponseEntity.ok(session);
    }
}
