package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.BadgeDTO;
import com.lockin.lockin_app.service.BadgeService;
import com.lockin.lockin_app.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<BadgeDTO>> getUserBadges(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        List<BadgeDTO> badges = badgeService.getUserBadges(userId);
        return ResponseEntity.ok(badges);
    }

    @PostMapping("/check")
    public ResponseEntity<List<BadgeDTO>> checkAndAwardBadges(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = userService.getUserIdFromEmail(userDetails.getUsername());
        List<BadgeDTO> newBadges = badgeService.checkAndAwardBadges(userId);
        return ResponseEntity.ok(newBadges);
    }
}
