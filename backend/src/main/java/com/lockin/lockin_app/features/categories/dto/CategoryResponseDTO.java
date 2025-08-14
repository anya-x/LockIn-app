package com.lockin.lockin_app.features.categories.dto;

import com.lockin.lockin_app.features.categories.entity.Category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponseDTO {

    private Long id;
    private String name;
    private String color;
    private String icon;
    private Long taskCount;
    private LocalDateTime createdAt;

    public static CategoryResponseDTO fromEntity(Category category) {
        return CategoryResponseDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .color(category.getColor())
                .icon(category.getIcon())
                .taskCount((long) category.getTasks().size())
                .createdAt(category.getCreatedAt())
                .build();
    }

    public static CategoryResponseDTO fromEntity(Category category, Long taskCount) {
        return CategoryResponseDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .color(category.getColor())
                .icon(category.getIcon())
                .taskCount(taskCount)
                .createdAt(category.getCreatedAt())
                .build();
    }
}
