package com.lockin.lockin_app.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when business logic validation fails
 *
 * <p>HTTP Status: 400 BAD REQUEST
 *
 * <p>Use cases: - Invalid date ranges - Negative values where positive expected - Session already
 * completed - Goal target validation failures
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }

    public ValidationException(String field, String reason) {
        super(String.format("Validation failed for %s: %s", field, reason));
    }
}
