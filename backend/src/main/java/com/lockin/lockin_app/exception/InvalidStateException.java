package com.lockin.lockin_app.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when an operation is attempted on an entity in an invalid state
 *
 * <p>HTTP Status: 409 CONFLICT
 *
 * <p>Use cases: - Completing an already completed session - Updating a completed goal - Starting a
 * session when another is active
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class InvalidStateException extends RuntimeException {

    public InvalidStateException(String message) {
        super(message);
    }

    public InvalidStateException(String resourceName, String currentState, String attemptedAction) {
        super(
                String.format(
                        "%s is in state '%s' and cannot perform action: %s",
                        resourceName, currentState, attemptedAction));
    }
}
