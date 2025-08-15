package com.lockin.lockin_app.features.goals.controller;

import com.lockin.lockin_app.features.goals.dto.GoalRequestDTO;
import com.lockin.lockin_app.features.goals.dto.GoalResponseDTO;
import com.lockin.lockin_app.features.goals.service.GoalService;
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

@Slf4j
@RestController
@RequestMapping("/api/goals")
public class GoalController extends BaseController {

    private final GoalService goalService;

    public GoalController(UserService userService, GoalService goalService) {
        super(userService);
        this.goalService = goalService;
    }

    /**
     * Gets all goals of a user
     *
     * @return all goals of user
     */
    @GetMapping
    public ResponseEntity<List<GoalResponseDTO>> getAllGoals(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/goals: User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);

        List<GoalResponseDTO> goals = goalService.getUserGoals(userId);

        return ResponseEntity.ok(goals);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoalResponseDTO> getGoal(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/goals/{} : User: {}", id, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
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

        log.debug("POST /api/goals : User: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        GoalResponseDTO created = goalService.createGoal(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponseDTO> updateGoal(
            @PathVariable Long id,
            @Valid @RequestBody GoalRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("PUT /api/goals/{} : User: {}", id, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        GoalResponseDTO updated = goalService.updateGoal(id, userId, request);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("DELETE /api/goals/{} : User: {}", id, getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        goalService.deleteGoal(id, userId);

        return ResponseEntity.noContent().build();
    }
}