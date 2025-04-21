package com.lockin.lockin_app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
public class CategoryRequestDTO {

    @NotBlank(message = "Category name is required")
    @Size(max = 50, message = "Name must be under 50 characters")
    private String name;

    @Pattern(
            regexp = "^#[0-9A-Fa-f]{6}$",
            message = "Color must be a valid hex code")
    private String color;

    @Size(max = 50, message = "Icon name must be under 50 characters")
    private String icon;
}