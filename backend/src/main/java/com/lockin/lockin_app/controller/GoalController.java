package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.GoalRequestDTO;
import com.lockin.lockin_app.dto.GoalResponseDTO;
import com.lockin.lockin_app.service.GoalService;
import com.lockin.lockin_app.service.UserService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;
    private final UserService userService;

    /**
     * Gets all goals of a user
     *
     * @return all goals of user
     */
    @GetMapping
    public ResponseEntity<List<GoalResponseDTO>> getAllGoals(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/goals: User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());

        List<GoalResponseDTO> goals = goalService.getUserGoals(userId);

        return ResponseEntity.ok(goals);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoalResponseDTO> getGoal(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/goals/{} : User: {}", id, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        GoalResponseDTO goal = goalService.getGoal(id, userId);

        return ResponseEntity.ok(goal);
    }

    /**
     * Creates a new goal
     *
     * @param request goal details
     * @return created goal with generated ID
     */
    @PostMapping
    public ResponseEntity<GoalResponseDTO> createGoal(
            @Valid @RequestBody GoalRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("POST /api/goals : User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        GoalResponseDTO created = goalService.createGoal(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponseDTO> updateGoal(
            @PathVariable Long id,
            @Valid @RequestBody GoalRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("PUT /api/goals/{} : User: {}", id, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        GoalResponseDTO updated = goalService.updateGoal(id, userId, request);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("DELETE /api/goals/{} : User: {}", id, userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        goalService.deleteGoal(id, userId);

        return ResponseEntity.noContent().build();
    }
}
