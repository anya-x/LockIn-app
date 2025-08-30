import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Stack,
  useTheme,
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  LinkOff as DisconnectIcon,
} from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import calendarService, {
  type CalendarStatus,
} from "../../services/calendarService";

const CalendarSettings: React.FC = () => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "true") {
      setSuccessMessage("Google Calendar connected successfully!");
      setSearchParams({});
      fetchStatus();
    }

    if (error) {
      setErrorMessage(`Connection failed: ${error}`);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await calendarService.getStatus();
      setStatus(data);
    } catch {
      setErrorMessage("Failed to load calendar status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setErrorMessage(null);
      const { authorizationUrl } = await calendarService.getConnectUrl();
      window.location.href = authorizationUrl;
    } catch {
      setErrorMessage("Failed to start connection");
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setErrorMessage(null);
      const result = await calendarService.syncNow();
      if (result.success) {
        setSuccessMessage(`Synced! ${result.tasksCreated} new tasks created.`);
        fetchStatus();
      }
    } catch {
      setErrorMessage("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !window.confirm("Are you sure you want to disconnect Google Calendar?")
    ) {
      return;
    }

    try {
      await calendarService.disconnect();
      setStatus({ connected: false });
      setSuccessMessage("Calendar disconnected");
    } catch {
      setErrorMessage("Failed to disconnect");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <CalendarIcon
            sx={{ color: theme.palette.primary.main, fontSize: 28 }}
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Google Calendar Integration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sync tasks with your Google Calendar
            </Typography>
          </Box>
        </Box>

        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setErrorMessage(null)}
          >
            {errorMessage}
          </Alert>
        )}

        {!status?.connected ? (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Connect your Google Calendar to automatically sync tasks with due
              dates.
            </Alert>
            <Button
              variant="contained"
              startIcon={
                connecting ? <CircularProgress size={20} /> : <CalendarIcon />
              }
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? "Connecting..." : "Connect Google Calendar"}
            </Button>
          </>
        ) : (
          <>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
            >
              <Chip
                icon={<CheckIcon />}
                label="Connected"
                color="success"
                size="small"
              />
              {status.lastSyncAt && (
                <Chip
                  label={`Last sync: ${formatDate(status.lastSyncAt)}`}
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>

            {status.isExpired && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Your connection has expired. Please reconnect your calendar.
                <Button size="small" onClick={handleConnect} sx={{ ml: 2 }}>
                  Reconnect
                </Button>
              </Alert>
            )}

            <Alert severity="success" sx={{ mb: 2 }}>
              Tasks with due dates will automatically sync to Google Calendar
              every 15 minutes.
            </Alert>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={
                  syncing ? <CircularProgress size={20} /> : <RefreshIcon />
                }
                onClick={handleSync}
                disabled={syncing || status.isExpired}
              >
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DisconnectIcon />}
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarSettings;
