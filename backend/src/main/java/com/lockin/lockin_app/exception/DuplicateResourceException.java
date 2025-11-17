package com.lockin.lockin_app.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when attempting to create a resource that already exists
 *
 * <p>HTTP Status: 409 CONFLICT
 *
 * <p>Use cases: - Duplicate email registration - Duplicate category names - Duplicate goal
 * creations
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }

    public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
        super(
                String.format(
                        "%s already exists with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}
