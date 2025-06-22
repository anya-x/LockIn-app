package com.lockin.lockin_app.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateResourceException extends BusinessException {

    public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
        super(
                String.format(
                        "%s already exists with %s: '%s'", resourceName, fieldName, fieldValue),
                "DUPLICATE_RESOURCE");
    }

    public DuplicateResourceException(String message) {
        super(message, "DUPLICATE_RESOURCE");
    }
}
