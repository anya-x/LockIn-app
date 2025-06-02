import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  sessionService,
  type FocusSessionResponse,
} from "../services/sessionService";

const SessionHistory: React.FC = () => {
  const [sessions, setSessions] = useState<FocusSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await sessionService.getUserSessions();
      setSessions(data);
    } catch (error: any) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case "WORK":
        return "primary";
      case "SHORT_BREAK":
        return "success";
      case "LONG_BREAK":
        return "info";
      default:
        return "default";
    }
  };

  const formatSessionType = (type: string) => {
    return type
      .replace("_", " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (sessions.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          No sessions yet. Start your first Pomodoro!
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Session History
      </Typography>

      <List>
        {sessions.map((session, index) => (
          <React.Fragment key={session.id}>
            {index > 0 && <Divider />}
            <ListItem
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box flex={1}>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={formatSessionType(session.sessionType)}
                        color={getSessionTypeColor(session.sessionType) as any}
                        size="small"
                      />
                      <Typography variant="body1">
                        {session.actualMinutes} / {session.plannedMinutes}{" "}
                        minutes
                      </Typography>
                      {session.profileName && (
                        <Typography variant="caption" color="text.secondary">
                          Profile: {session.profileName}
                        </Typography>
                      )}
                      {session.completed && (
                        <Chip
                          label="✓ Completed"
                          color="success"
                          size="small"
                        />
                      )}
                    </Box>
                  }
                  secondary={formatDate(session.startedAt)}
                />
              </Box>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default SessionHistory;
