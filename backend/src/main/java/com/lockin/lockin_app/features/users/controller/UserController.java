package com.lockin.lockin_app.features.users.controller;

import com.lockin.lockin_app.features.users.dto.NotificationPreferencesDTO;
import com.lockin.lockin_app.features.users.service.UserService;
import com.lockin.lockin_app.shared.controller.BaseController;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/users")
public class UserController extends BaseController {

    public UserController(UserService userService) {
        super(userService);
    }

    @GetMapping("/preferences/notifications")
    public ResponseEntity<NotificationPreferencesDTO> getNotificationPreferences(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.debug("Getting notification preferences for user: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        NotificationPreferencesDTO preferences = userService.getNotificationPreferences(userId);

        return ResponseEntity.ok(preferences);
    }

    @PutMapping("/preferences/notifications")
    public ResponseEntity<NotificationPreferencesDTO> updateNotificationPreferences(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody NotificationPreferencesDTO preferences) {

        log.info("Updating notification preferences for user: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        NotificationPreferencesDTO updated = userService.updateNotificationPreferences(userId, preferences);

        return ResponseEntity.ok(updated);
    }
}
