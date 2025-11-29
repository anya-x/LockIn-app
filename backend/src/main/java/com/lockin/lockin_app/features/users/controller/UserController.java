package com.lockin.lockin_app.features.users.controller;

import com.lockin.lockin_app.features.users.dto.NotificationPreferencesDTO;
import com.lockin.lockin_app.features.users.dto.UserDataExportDTO;
import com.lockin.lockin_app.features.users.service.GDPRService;
import com.lockin.lockin_app.features.users.service.UserService;
import com.lockin.lockin_app.shared.controller.BaseController;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/users")
public class UserController extends BaseController {

    private final GDPRService gdprService;

    public UserController(UserService userService, GDPRService gdprService) {
        super(userService);
        this.gdprService = gdprService;
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

    /**
     * GDPR: Export all user data.
     */
    @GetMapping("/export")
    public ResponseEntity<UserDataExportDTO> exportUserData(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("GDPR data export requested for user: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        UserDataExportDTO exportData = gdprService.exportUserData(userId);

        return ResponseEntity.ok(exportData);
    }

    /**
     * GDPR: Delete user account and all associated data.
     */
    @DeleteMapping("/account")
    public ResponseEntity<Map<String, String>> deleteAccount(
            @AuthenticationPrincipal UserDetails userDetails) {

        log.warn("GDPR account deletion requested for user: {}", getCurrentUserEmail(userDetails));

        Long userId = getCurrentUserId(userDetails);
        gdprService.deleteUserAccount(userId);

        return ResponseEntity.ok(Map.of(
                "message", "Account and all associated data have been permanently deleted"
        ));
    }
}
