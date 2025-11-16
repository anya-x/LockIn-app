package com.lockin.lockin_app.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DateRangeDTO {
    private LocalDate currentStart;
    private LocalDate currentEnd;
    private LocalDate previousStart;
    private LocalDate previousEnd;
}
