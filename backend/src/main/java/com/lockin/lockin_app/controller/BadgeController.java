package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.dto.BadgeDTO;
import com.lockin.lockin_app.security.UserPrincipal;
import com.lockin.lockin_app.service.BadgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;

    /**
     * Get all badges for the authenticated user
     *
     * @param earnedOnly if true, only return earned badges; if false, return all badges
     */
    @GetMapping
    public ResponseEntity<List<BadgeDTO>> getUserBadges(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "false") boolean earnedOnly) {

        Long userId = userPrincipal.getId();
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
