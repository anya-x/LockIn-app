package com.lockin.lockin_app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Service for comparing analytics between time periods
 *
 * WIP: Trying to auto-calculate "previous period" for comparison
 * This is getting more complex than expected...
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComparisonService {

    /**
     * Compare current period with automatically calculated previous period
     *
     * WIP: This approach has issues:
     * - What if user account was created after the "previous period" start?
     * - Months have different lengths (28-31 days)
     * - Leap years complicate February comparisons
     * - Week-over-week: what if user joined mid-week?
     * - Year-over-year: 365 vs 366 days
     *
     * Maybe auto-calculating is too complex?
     */
    public void comparePeriods(LocalDate start, LocalDate end) {
        long daysBetween = ChronoUnit.DAYS.between(start, end);

        // Calculate "previous period" of same length
        LocalDate prevStart = start.minusDays(daysBetween);
        LocalDate prevEnd = start.minusDays(1);

        log.debug("Comparing {} to {} (current) with {} to {} (previous)",
                start, end, prevStart, prevEnd);

        // But wait... edge cases:
        //
        // Case 1: Month comparison
        // Current: Feb 1-28 (28 days)
        // Previous: Jan 4-31 (28 days)
        // Is this the right comparison? Should it be Jan 1-31?
        //
        // Case 2: User joined mid-period
        // User joined: Jan 15
        // Current: Jan 15 - Feb 15
        // Previous: Dec 15 - Jan 14 (but user didn't exist yet!)
        //
        // Case 3: Leap year
        // Current: Feb 1-29, 2024 (leap year)
        // Previous: Jan 3-31 (28 days)
        // Different month! Is this fair?
        //
        // This is getting too complicated...
        // Maybe let the frontend decide the date ranges?

        throw new UnsupportedOperationException(
            "Auto-calculation of previous period is too complex. " +
            "Consider letting the frontend specify both date ranges explicitly."
        );
    }
}
