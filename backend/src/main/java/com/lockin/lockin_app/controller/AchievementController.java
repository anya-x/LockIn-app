package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.AchievementDTO;
import com.lockin.lockin_app.service.AchievementService;
import com.lockin.lockin_app.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<AchievementDTO>> getUserAchievements(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("GET /api/achievements: User: {}", userDetails.getUsername());

        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        List<AchievementDTO> achievements = achievementService.getUserAchievements(userId);

        return ResponseEntity.ok(achievements);
    }
}
