import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  useTheme,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import browserNotificationService from "../../services/browserNotificationService";

export interface NotificationPreferences {
  aiNotifications: boolean;
  calendarNotifications: boolean;
  taskReminders: boolean;
  browserNotifications: boolean;
}

const STORAGE_KEY = "lockin_notification_preferences";

const defaultPreferences: NotificationPreferences = {
  aiNotifications: true,
  calendarNotifications: true,
  taskReminders: true,
  browserNotifications: true,
};

export function loadNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load notification preferences:", e);
  }
  return defaultPreferences;
}

function saveNotificationPreferences(
  preferences: NotificationPreferences
): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (e) {
    console.error("Failed to save notification preferences:", e);
  }
}

const NotificationSettings: React.FC = () => {
  const theme = useTheme();
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [browserPermission, setBrowserPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    setPreferences(loadNotificationPreferences());
    setBrowserPermission(browserNotificationService.getPermission());
  }, []);

  const handleChange =
    (key: keyof NotificationPreferences) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newPreferences = {
        ...preferences,
        [key]: event.target.checked,
      };
      setPreferences(newPreferences);
      saveNotificationPreferences(newPreferences);
    };

  const handleBrowserNotificationToggle = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      const granted = await browserNotificationService.requestPermission();
      setBrowserPermission(granted ? "granted" : "denied");

      const newPreferences = {
        ...preferences,
        browserNotifications: granted,
      };
      setPreferences(newPreferences);
      saveNotificationPreferences(newPreferences);
    } else {
      const newPreferences = {
        ...preferences,
        browserNotifications: false,
      };
      setPreferences(newPreferences);
      saveNotificationPreferences(newPreferences);
    }
  };

  const isIOSSafari = browserNotificationService.isIOSSafari();

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <NotificationsIcon
            sx={{ color: theme.palette.primary.main, fontSize: 28 }}
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notification Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose which notifications you want to receive
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <NotificationsIcon
                fontSize="small"
                sx={{ color: "text.secondary" }}
              />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Browser Notifications
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isIOSSafari
                    ? "Not available on iOS Safari"
                    : browserPermission === "denied"
                    ? "Blocked by browser - check browser settings"
                    : "Show desktop notifications"}
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={
                    preferences.browserNotifications &&
                    browserPermission === "granted"
                  }
                  onChange={handleBrowserNotificationToggle}
                  disabled={isIOSSafari || browserPermission === "denied"}
                />
              }
              label=""
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <SmartToyIcon fontSize="small" sx={{ color: "text.secondary" }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  AI Features
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Task breakdown, daily briefing completion
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.aiNotifications}
                  onChange={handleChange("aiNotifications")}
                />
              }
              label=""
            />
          </Box>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <CalendarMonthIcon
                fontSize="small"
                sx={{ color: "text.secondary" }}
              />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Calendar Sync
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  When tasks are synced from calendar
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.calendarNotifications}
                  onChange={handleChange("calendarNotifications")}
                />
              }
              label=""
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
