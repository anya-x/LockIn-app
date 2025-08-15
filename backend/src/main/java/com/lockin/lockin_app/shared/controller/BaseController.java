package com.lockin.lockin_app.shared.controller;

import com.lockin.lockin_app.exception.ResourceNotFoundException;
import com.lockin.lockin_app.features.users.service.UserService;
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
     *
     * @param userDetails the authenticated user
     * @return the user ID corresponding to the authenticated user
     * @throws ResourceNotFoundException if user not found
     */
    protected Long getCurrentUserId(UserDetails userDetails) {
        return userService.getUserIdFromEmail(userDetails.getUsername());
    }

    /**
     * Extracts the current authenticated user's email from Spring Security context.
     *
     * @param userDetails the authenticated user
     * @return the email of the authenticated user
     */
    protected String getCurrentUserEmail(UserDetails userDetails) {
        return userDetails.getUsername();
    }
}