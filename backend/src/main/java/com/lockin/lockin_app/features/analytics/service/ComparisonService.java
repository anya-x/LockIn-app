package com.lockin.lockin_app.features.analytics.service;

import com.lockin.lockin_app.features.analytics.dto.ComparisonDTO;
import com.lockin.lockin_app.features.analytics.dto.DailyAnalyticsDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComparisonService {

    /** Creates a comparison DTO with calculated changes and trends */
    public ComparisonDTO createComparison(DailyAnalyticsDTO current, DailyAnalyticsDTO previous) {
        ComparisonDTO comparison = new ComparisonDTO();
        comparison.setCurrent(current);
        comparison.setPrevious(previous);

        comparison.setTasksChange(
                calculatePercentageChange(
                        previous.getTasksCompleted(), current.getTasksCompleted()));
        comparison.setProductivityChange(
                calculatePercentageChange(
                        previous.getProductivityScore(), current.getProductivityScore()));
        comparison.setFocusChange(
                calculatePercentageChange(previous.getFocusMinutes(), current.getFocusMinutes()));
        comparison.setBurnoutChange(
                calculatePercentageChange(
                        previous.getBurnoutRiskScore(), current.getBurnoutRiskScore()));
                        
        comparison.setTasksTrend(getTrend(comparison.getTasksChange()));
        comparison.setProductivityTrend(getTrend(comparison.getProductivityChange()));
        comparison.setFocusTrend(getTrend(comparison.getFocusChange()));
        comparison.setBurnoutTrend(getTrend(comparison.getBurnoutChange()));

        return comparison;
    }

    /** Calculates percentage change between two values */
    private Double calculatePercentageChange(Number oldValue, Number newValue) {
        if (oldValue == null || newValue == null) {
            return 0.0;
        }
        double old = oldValue.doubleValue();
        double newVal = newValue.doubleValue();
        if (old == 0) {
            return newVal > 0 ? 100.0 : 0.0;
        }
        return ((newVal - old) / old) * 100;
    }

    /**
     * Determines trend direction based on percentage change
     *
     * @param change percentage change value
     * @return "up", "down", or "stable"
     */
    private String getTrend(Double change) {
        if (change == null || Math.abs(change) < 5) {
            return "stable";
        }
        return change > 0 ? "up" : "down";
    }
}
