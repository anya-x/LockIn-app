package com.lockin.lockin_app.service;

import com.lockin.lockin_app.dto.BadgeDTO;
import com.lockin.lockin_app.entity.Badge;
import com.lockin.lockin_app.entity.BadgeType;
import com.lockin.lockin_app.entity.User;
import com.lockin.lockin_app.repository.BadgeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserService userService;

    /**
     * Get all badges for a user (both earned and unearned)
     */
    @Transactional(readOnly = true)
    public List<BadgeDTO> getUserBadges(Long userId) {
        log.debug("Fetching badges for user: {}", userId);

        List<Badge> earnedBadges = badgeRepository.findByUserIdOrderByEarnedAtDesc(userId);

        List<BadgeDTO> allBadges = new ArrayList<>();

        // Add all possible badges
        for (BadgeType badgeType : BadgeType.values()) {
            Badge earned =
                    earnedBadges.stream()
                            .filter(b -> b.getBadgeType() == badgeType)
                            .findFirst()
                            .orElse(null);

            if (earned != null) {
                allBadges.add(BadgeDTO.fromEntity(earned));
            } else {
                allBadges.add(BadgeDTO.fromBadgeType(badgeType));
            }
        }

        return allBadges;
    }

    /**
     * Get only earned badges for a user
     */
    @Transactional(readOnly = true)
    public List<BadgeDTO> getEarnedBadges(Long userId) {
        log.debug("Fetching earned badges for user: {}", userId);

        return badgeRepository.findByUserIdOrderByEarnedAtDesc(userId).stream()
                .map(BadgeDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Award a badge to a user
     */
    @Transactional
    public BadgeDTO awardBadge(Long userId, BadgeType badgeType) {
        log.info("Awarding badge {} to user {}", badgeType, userId);

        // Check if already has badge
        if (badgeRepository.existsByUserIdAndBadgeType(userId, badgeType)) {
            log.debug("User {} already has badge {}", userId, badgeType);
            return null;
        }

        User user = userService.getUserById(userId);

        Badge badge = new Badge();
        badge.setUser(user);
        badge.setBadgeType(badgeType);

        Badge saved = badgeRepository.save(badge);

        log.info("Badge {} awarded to user {}", badgeType, userId);

        return BadgeDTO.fromEntity(saved);
    }

    /**
     * Check and award all applicable badges for a user
     */
    @Transactional
    public void checkAndAwardBadges(Long userId) {
        log.debug("Checking badges for user: {}", userId);

        // This method is called by BadgeEventListener
        // The actual badge awarding logic is in the listener
        // This method exists for manual badge checks if needed
    }
}
