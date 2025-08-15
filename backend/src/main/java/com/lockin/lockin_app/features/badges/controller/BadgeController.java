package com.lockin.lockin_app.features.badges.controller;

import com.lockin.lockin_app.features.badges.dto.BadgeDTO;
import com.lockin.lockin_app.features.badges.service.BadgeService;
import com.lockin.lockin_app.features.users.service.UserService;
import com.lockin.lockin_app.shared.controller.BaseController;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/badges")
public class BadgeController extends BaseController {

    private final BadgeService badgeService;

    public BadgeController(UserService userService, BadgeService badgeService) {
        super(userService);
        this.badgeService = badgeService;
    }

    /**
     * Get all badges for the authenticated user
     *
     * @param earnedOnly if true, only return earned badges; if false, return all badges
     */
    @GetMapping
    public ResponseEntity<List<BadgeDTO>> getUserBadges(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "false") boolean earnedOnly) {

        Long userId = getCurrentUserId(userDetails);
        log.debug("Fetching badges for user {}, earnedOnly={}", userId, earnedOnly);

        List<BadgeDTO> badges;
        if (earnedOnly) {
            badges = badgeService.getEarnedBadges(userId);
        } else {
            badges = badgeService.getUserBadges(userId);
        }

        return ResponseEntity.ok(badges);
    }
}