package com.lockin.lockin_app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.List;

@AllArgsConstructor
@Data
public class BriefingResultDTO {
    String summary;
    int urgentImportantCount;
    int importantCount;
    int urgentCount;
    int otherCount;
    List<String> topPriorities;
    int tokensUsed;
    double costUSD;
}