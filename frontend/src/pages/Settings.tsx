import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Google as GoogleIcon, CheckCircle, Warning } from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

interface CalendarStatus {
  connected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  tokenExpiresAt?: string;
}

/**
 * Settings page - Google Calendar integration
 *
 * WIP: Basic UI for connecting/disconnecting calendar
 * TODO: Add more settings (notifications, preferences, etc.)
 */
const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch calendar connection status
  const {
    data: calendarStatus,
    isLoading,
    error,
  } = useQuery<CalendarStatus>({
    queryKey: ["calendarStatus"],
    queryFn: async () => {
      const response = await api.get("/calendar/status");
      return response.data;
    },
  });

  // Handle OAuth callback (success/error params in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");

    if (success) {
      setStatusMessage("✅ Calendar connected successfully!");
      queryClient.invalidateQueries({ queryKey: ["calendarStatus"] });
      // Clean up URL
      window.history.replaceState({}, "", "/settings");
    } else if (error) {
      setStatusMessage(`❌ Failed to connect calendar: ${error}`);
      // Clean up URL
      window.history.replaceState({}, "", "/settings");
    }
  }, [queryClient]);

  // Connect calendar mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get("/calendar/connect");
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to Google OAuth
      window.location.href = data.authorizationUrl;
    },
    onError: (err: any) => {
      setStatusMessage(`❌ Error: ${err.response?.data?.message || err.message}`);
    },
  });

  // Disconnect calendar mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await api.delete("/calendar/disconnect");
    },
    onSuccess: () => {
      setStatusMessage("✅ Calendar disconnected");
      queryClient.invalidateQueries({ queryKey: ["calendarStatus"] });
    },
    onError: (err: any) => {
      setStatusMessage(`❌ Error: ${err.response?.data?.message || err.message}`);
    },
  });

  // Check if token is expiring soon (within 6 hours)
  const isTokenExpiringSoon = calendarStatus?.tokenExpiresAt
    ? new Date(calendarStatus.tokenExpiresAt).getTime() - Date.now() < 6 * 60 * 60 * 1000
    : false;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {statusMessage && (
        <Alert
          severity={statusMessage.startsWith("✅") ? "success" : "error"}
          onClose={() => setStatusMessage(null)}
          sx={{ mb: 3 }}
        >
          {statusMessage}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <GoogleIcon sx={{ mr: 1, fontSize: 32 }} />
            <Typography variant="h5">Google Calendar Integration</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Automatically sync your tasks to Google Calendar. When you create or
            update a task with a due date, it will appear in your calendar.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">Failed to load calendar status</Alert>
          ) : calendarStatus?.connected ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Chip
                  icon={<CheckCircle />}
                  label="Connected"
                  color="success"
                  sx={{ mb: 2 }}
                />

                {isTokenExpiringSoon && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Warning sx={{ mr: 1 }} />
                      Your calendar connection will expire soon. Please reconnect.
                    </Box>
                  </Alert>
                )}

                <Typography variant="body2" color="text.secondary">
                  Connected: {new Date(calendarStatus.connectedAt!).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last sync: {new Date(calendarStatus.lastSyncAt!).toLocaleString()}
                </Typography>
                {calendarStatus.tokenExpiresAt && (
                  <Typography variant="body2" color="text.secondary">
                    Expires: {new Date(calendarStatus.tokenExpiresAt).toLocaleString()}
                  </Typography>
                )}
              </Box>

              <Button
                variant="outlined"
                color="error"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect Calendar"}
              </Button>
            </>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                Connect your Google Calendar to automatically sync your tasks!
              </Alert>

              <Button
                variant="contained"
                startIcon={<GoogleIcon />}
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                fullWidth
              >
                {connectMutation.isPending ? "Connecting..." : "Connect Google Calendar"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Notification Preferences
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Control how you receive notifications from Lockin.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {/* TODO: Add toggles for browser/in-app notifications */}
          {/* TODO: Add clear preferences button */}
          <Alert severity="info">
            Notification preferences coming soon! You can manage browser
            notifications through your browser settings for now.
          </Alert>
        </CardContent>
      </Card>

      {/* TODO: Add more settings sections */}
      {/* - Account settings */}
      {/* - Theme preferences */}
    </Container>
  );
};

export default Settings;
