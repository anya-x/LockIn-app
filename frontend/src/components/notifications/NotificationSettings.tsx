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
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
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

/**
 * Load preferences from local storage.
 */
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

/**
 * Save preferences to local storage.
 */
function saveNotificationPreferences(preferences: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (e) {
    console.error("Failed to save notification preferences:", e);
  }
}

/**
 * Notification preferences settings component.
 */
const NotificationSettings: React.FC = () => {
  const theme = useTheme();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    setPreferences(loadNotificationPreferences());
    setBrowserPermission(browserNotificationService.getPermission());
  }, []);

  const handleChange = (key: keyof NotificationPreferences) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newPreferences = {
      ...preferences,
      [key]: event.target.checked,
    };
    setPreferences(newPreferences);
    saveNotificationPreferences(newPreferences);
    setSnackbar({
      open: true,
      message: "Preferences saved",
      severity: "success",
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleBrowserNotificationToggle = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      setRequestingPermission(true);
      try {
        const granted = await browserNotificationService.requestPermission();
        setBrowserPermission(granted ? "granted" : "denied");

        const newPreferences = {
          ...preferences,
          browserNotifications: granted,
        };
        setPreferences(newPreferences);
        saveNotificationPreferences(newPreferences);

        if (granted) {
          setSnackbar({
            open: true,
            message: "Browser notifications enabled",
            severity: "success",
          });
        } else {
          setSnackbar({
            open: true,
            message: "Browser notifications were denied",
            severity: "info",
          });
        }
      } catch (error) {
        console.error("Failed to request notification permission:", error);
        setSnackbar({
          open: true,
          message: "Failed to enable notifications",
          severity: "error",
        });
      } finally {
        setRequestingPermission(false);
      }
    } else {
      const newPreferences = {
        ...preferences,
        browserNotifications: false,
      };
      setPreferences(newPreferences);
      saveNotificationPreferences(newPreferences);
      setSnackbar({
        open: true,
        message: "Browser notifications disabled",
        severity: "info",
      });
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

        {/* Browser Notifications */}
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
            {requestingPermission ? (
              <CircularProgress size={20} sx={{ mr: 1.5 }} />
            ) : (
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
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* AI Notifications */}
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

        {/* Calendar Notifications */}
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

        {/* Task Reminders */}
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <TaskAltIcon fontSize="small" sx={{ color: "text.secondary" }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Task Reminders
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Due date reminders and updates
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.taskReminders}
                  onChange={handleChange("taskReminders")}
                />
              }
              label=""
            />
          </Box>
        </Box>
      </CardContent>

      {/* Save feedback snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default NotificationSettings;
