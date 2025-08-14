package com.lockin.lockin_app.features.badges.service;

import com.lockin.lockin_app.features.badges.dto.BadgeDTO;
import com.lockin.lockin_app.features.badges.entity.Badge;
import com.lockin.lockin_app.features.badges.entity.BadgeType;
import com.lockin.lockin_app.features.users.entity.User;
import com.lockin.lockin_app.features.badges.repository.BadgeRepository;

import com.lockin.lockin_app.features.users.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<BadgeDTO> getUserBadges(Long userId) {
        log.debug("Fetching badges for user: {}", userId);

        List<Badge> earnedBadges = badgeRepository.findByUserIdOrderByEarnedAtDesc(userId);

        List<BadgeDTO> allBadges = new ArrayList<>();

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

    @Transactional(readOnly = true)
    public List<BadgeDTO> getEarnedBadges(Long userId) {
        log.debug("Fetching earned badges for user: {}", userId);

        return badgeRepository.findByUserIdOrderByEarnedAtDesc(userId).stream()
                              .map(BadgeDTO::fromEntity)
                              .collect(Collectors.toList());
    }


    @Transactional
    public BadgeDTO awardBadge(Long userId, BadgeType badgeType) {
        log.info("Awarding badge {} to user {}", badgeType, userId);
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

    @Transactional
    public void checkAndAwardBadges(Long userId) {
        log.debug("Checking badges for user: {}", userId);

    }
}