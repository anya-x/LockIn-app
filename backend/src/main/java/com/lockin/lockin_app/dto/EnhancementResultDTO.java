package com.lockin.lockin_app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@AllArgsConstructor
@Data
public class EnhancementResultDTO {
    String enhancedDescription;
    int tokensUsed;
    double costUSD;
}
