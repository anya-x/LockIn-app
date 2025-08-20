package com.lockin.lockin_app.features.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class RateLimitStatusDTO {
    int limit;
    int remaining;
    int used;
}