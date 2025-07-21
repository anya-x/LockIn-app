package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.Badge;
import com.lockin.lockin_app.entity.BadgeType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BadgeDTO {
    private Long id;
    private String badgeType;
    private String name;
    private String description;
    private String icon;
    private int requirement;
    private LocalDateTime earnedAt;
    private boolean earned;

    public static BadgeDTO fromEntity(Badge badge) {
        BadgeDTO dto = new BadgeDTO();
        dto.setId(badge.getId());
        dto.setBadgeType(badge.getBadgeType().name());
        dto.setName(badge.getBadgeType().getName());
        dto.setDescription(badge.getBadgeType().getDescription());
        dto.setIcon(badge.getBadgeType().getIcon());
        dto.setRequirement(badge.getBadgeType().getRequirement());
        dto.setEarnedAt(badge.getEarnedAt());
        dto.setEarned(true);
        return dto;
    }

    public static BadgeDTO fromBadgeType(BadgeType badgeType) {
        BadgeDTO dto = new BadgeDTO();
        dto.setBadgeType(badgeType.name());
        dto.setName(badgeType.getName());
        dto.setDescription(badgeType.getDescription());
        dto.setIcon(badgeType.getIcon());
        dto.setRequirement(badgeType.getRequirement());
        dto.setEarned(false);
        return dto;
    }
}