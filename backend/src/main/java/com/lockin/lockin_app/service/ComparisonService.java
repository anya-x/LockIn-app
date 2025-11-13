package com.lockin.lockin_app.service;

import org.springframework.stereotype.Service;

/**
 * Utility service for safely comparing analytics values
 *
 * <p>Handles null values and edge cases in percentage calculations
 */
@Service
public class ComparisonService {

    /**
     * Calculates percentage change between two values, safely handling nulls
     *
     * @param oldValue previous value (can be null)
     * @param newValue current value (can be null)
     * @return percentage change, or 0 if both null, or 100 if only oldValue is null/zero
     */
    public double calculatePercentageChange(Double oldValue, Double newValue) {
        // FIX: Handle null values
        if (oldValue == null) oldValue = 0.0;
        if (newValue == null) newValue = 0.0;

        // Handle division by zero
        if (oldValue == 0) {
            return newValue > 0 ? 100.0 : 0.0;
        }

        return ((newValue - oldValue) / oldValue) * 100.0;
    }

    /**
     * Calculates percentage change for integer values
     *
     * @param oldValue previous value (can be null)
     * @param newValue current value (can be null)
     * @return percentage change
     */
    public double calculatePercentageChange(Integer oldValue, Integer newValue) {
        Double oldDouble = oldValue != null ? oldValue.doubleValue() : null;
        Double newDouble = newValue != null ? newValue.doubleValue() : null;
        return calculatePercentageChange(oldDouble, newDouble);
    }

    /**
     * Safely compares two values, treating null as zero
     *
     * @param value1 first value
     * @param value2 second value
     * @return true if value1 is greater than value2
     */
    public boolean isGreaterThan(Double value1, Double value2) {
        double v1 = value1 != null ? value1 : 0.0;
        double v2 = value2 != null ? value2 : 0.0;
        return v1 > v2;
    }
}
