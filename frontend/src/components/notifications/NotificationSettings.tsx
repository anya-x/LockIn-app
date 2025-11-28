import React, { useState, useEffect, useCallback } from "react";
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
  Skeleton,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import browserNotificationService from "../../services/browserNotificationService";
import { notificationService } from "../../services/notificationService";
import type { NotificationPreferences } from "../../services/notificationService";

const defaultPreferences: NotificationPreferences = {
  aiNotifications: true,
  calendarNotifications: true,
  taskReminders: true,
  browserNotifications: true,
};

/**
 * Notification preferences settings component.
 * Syncs with backend API.
 */
const NotificationSettings: React.FC = () => {
  const theme = useTheme();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "success" });

  // Load preferences from API on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await notificationService.getPreferences();
        setPreferences(prefs);
      } catch (error) {
        console.error("Failed to load preferences:", error);
        setSnackbar({
          open: true,
          message: "Failed to load preferences",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
    setBrowserPermission(browserNotificationService.getPermission());
  }, []);

  const savePreferences = useCallback(async (newPreferences: NotificationPreferences) => {
    setSaving(true);
    try {
      const updated = await notificationService.updatePreferences(newPreferences);
      setPreferences(updated);
      setSnackbar({
        open: true,
        message: "Preferences saved",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
      setSnackbar({
        open: true,
        message: "Failed to save preferences",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }, []);

  const handleChange = (key: keyof NotificationPreferences) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newPreferences = {
      ...preferences,
      [key]: event.target.checked,
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
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
        await savePreferences(newPreferences);

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
      await savePreferences(newPreferences);
      setSnackbar({
        open: true,
        message: "Browser notifications disabled",
        severity: "info",
      });
    }
  };

  const isIOSSafari = browserNotificationService.isIOSSafari();

  if (loading) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Skeleton variant="circular" width={28} height={28} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="60%" height={24} />
              <Skeleton width="80%" height={16} />
            </Box>
          </Box>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={48} sx={{ my: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

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
          {saving && <CircularProgress size={20} sx={{ ml: "auto" }} />}
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
                    disabled={isIOSSafari || browserPermission === "denied" || saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
