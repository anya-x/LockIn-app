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
  CircularProgress,
  Alert,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import browserNotificationService from "../../services/browserNotificationService";
import userPreferencesService from "../../services/userPreferencesService";
import type { NotificationPreferences as BackendPreferences } from "../../services/userPreferencesService";

export interface NotificationPreferences extends BackendPreferences {
  browserNotifications: boolean;
}

const BROWSER_STORAGE_KEY = "lockin_browser_notifications";

const defaultPreferences: NotificationPreferences = {
  aiNotifications: true,
  calendarNotifications: true,
  taskReminders: true,
  browserNotifications: true,
};

// Browser notifications are stored locally since they depend on browser permission
function loadBrowserNotificationPreference(): boolean {
  try {
    const stored = localStorage.getItem(BROWSER_STORAGE_KEY);
    if (stored !== null) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load browser notification preference:", e);
  }
  return true;
}

function saveBrowserNotificationPreference(enabled: boolean): void {
  try {
    localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(enabled));
  } catch (e) {
    console.error("Failed to save browser notification preference:", e);
  }
}

// Export for use in other components that need to check preferences
export function loadNotificationPreferences(): NotificationPreferences {
  return {
    ...defaultPreferences,
    browserNotifications: loadBrowserNotificationPreference(),
  };
}

const NotificationSettings: React.FC = () => {
  const theme = useTheme();
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [browserPermission, setBrowserPermission] =
    useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const backendPrefs = await userPreferencesService.getNotificationPreferences();
        setPreferences({
          ...backendPrefs,
          browserNotifications: loadBrowserNotificationPreference(),
        });
      } catch (e) {
        console.error("Failed to load notification preferences:", e);
        setError("Failed to load preferences. Using defaults.");
        setPreferences({
          ...defaultPreferences,
          browserNotifications: loadBrowserNotificationPreference(),
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
    setBrowserPermission(browserNotificationService.getPermission());
  }, []);

  const handleChange =
    (key: keyof Omit<NotificationPreferences, "browserNotifications">) =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.checked;
      const previousPreferences = { ...preferences };

      // Optimistic update
      setPreferences((prev) => ({
        ...prev,
        [key]: newValue,
      }));

      try {
        setSaving(true);
        setError(null);
        await userPreferencesService.updateNotificationPreferences({
          [key]: newValue,
        });
      } catch (e) {
        console.error("Failed to save notification preference:", e);
        setError("Failed to save preference. Please try again.");
        // Rollback on error
        setPreferences(previousPreferences);
      } finally {
        setSaving(false);
      }
    };

  const handleBrowserNotificationToggle = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      const granted = await browserNotificationService.requestPermission();
      setBrowserPermission(granted ? "granted" : "denied");

      const newValue = granted;
      setPreferences((prev) => ({
        ...prev,
        browserNotifications: newValue,
      }));
      saveBrowserNotificationPreference(newValue);
    } else {
      setPreferences((prev) => ({
        ...prev,
        browserNotifications: false,
      }));
      saveBrowserNotificationPreference(false);
    }
  };

  const isIOSSafari = browserNotificationService.isIOSSafari();

  if (loading) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
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
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notification Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose which notifications you want to receive
            </Typography>
          </Box>
          {saving && <CircularProgress size={20} />}
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

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
                  disabled={saving}
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
                  disabled={saving}
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
