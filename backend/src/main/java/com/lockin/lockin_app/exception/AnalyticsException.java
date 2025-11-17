package com.lockin.lockin_app.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when analytics calculation or processing fails
 *
 * <p>HTTP Status: 500 INTERNAL SERVER ERROR
 *
 * <p>Use cases: - Analytics calculation failures - Invalid date ranges for analytics - Missing
 * required data for calculations
 */
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class AnalyticsException extends RuntimeException {

    public AnalyticsException(String message) {
        super(message);
    }

    public AnalyticsException(String message, Throwable cause) {
        super(message, cause);
    }

    public AnalyticsException(String operation, String reason) {
        super(String.format("Analytics operation '%s' failed: %s", operation, reason));
    }
}
