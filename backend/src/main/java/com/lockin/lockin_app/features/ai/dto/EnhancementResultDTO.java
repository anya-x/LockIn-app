package com.lockin.lockin_app.features.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class EnhancementResultDTO {
    String enhancedDescription;
    int tokensUsed;
    double costUSD;
}
