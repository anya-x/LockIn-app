package com.lockin.lockin_app.controller;

import com.lockin.lockin_app.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Base controller providing common functionality for all REST controllers.
 * Eliminates code duplication across controller layer.
 *
 * @author LockIn Development Team
 */
@RequiredArgsConstructor
public abstract class BaseController {

    protected final UserService userService;

    /**
     * Extracts the current authenticated user's ID from Spring Security context.
     * Centralizes the repeated pattern: userService.getUserIdFromEmail(userDetails.getUsername())
     *
     * @param userDetails the authenticated user details from Spring Security
     * @return the user ID corresponding to the authenticated user
     * @throws com.lockin.lockin_app.exception.ResourceNotFoundException if user not found
     */
    protected Long getCurrentUserId(UserDetails userDetails) {
        return userService.getUserIdFromEmail(userDetails.getUsername());
    }

    /**
     * Extracts the current authenticated user's email from Spring Security context.
     *
     * @param userDetails the authenticated user details from Spring Security
     * @return the email/username of the authenticated user
     */
    protected String getCurrentUserEmail(UserDetails userDetails) {
        return userDetails.getUsername();
    }
}
