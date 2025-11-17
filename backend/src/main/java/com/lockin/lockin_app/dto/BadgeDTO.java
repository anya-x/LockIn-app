package com.lockin.lockin_app.dto;

import com.lockin.lockin_app.entity.Badge;
import com.lockin.lockin_app.entity.BadgeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeDTO {

    private Long id;
    private String name;
    private String description;
    private String icon;
    private LocalDateTime earnedAt;
    private BadgeType badgeType;

    public static BadgeDTO fromEntity(Badge badge) {
        return BadgeDTO.builder()
                .id(badge.getId())
                .name(badge.getName())
                .description(badge.getDescription())
                .icon(badge.getIcon())
                .earnedAt(badge.getEarnedAt())
                .badgeType(badge.getBadgeType())
                .build();
    }
}
