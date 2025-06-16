import React, { useEffect } from "react";
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
import { useSessionHistory } from "../../hooks/useSessionHistory";
import { FOCUS_PROFILES } from "../../config/focusProfiles";

interface SessionHistoryProps {
  refresh?: number;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ refresh = 0 }) => {
  const { sessions, loading, refreshSessions } = useSessionHistory();

  useEffect(() => {
    if (refresh > 0) {
      refreshSessions();
    }
  }, [refresh, refreshSessions]);

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

  const getProfileInfo = (profileName?: string) => {
    if (!profileName) return null;
    return FOCUS_PROFILES.find((p) => p.id === profileName);
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
        {sessions.map((session, index) => {
          const profile = getProfileInfo(session.profileName);

          return (
            <React.Fragment key={session.id}>
              {index > 0 && <Divider />}
              <ListItem
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  py: 2,
                }}
              >
                <Box width="100%">
                  <ListItemText
                    primary={
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        flexWrap="wrap"
                      >
                        <Chip
                          label={formatSessionType(session.sessionType)}
                          color={
                            getSessionTypeColor(session.sessionType) as any
                          }
                          size="small"
                        />

                        {profile && (
                          <Chip
                            icon={
                              <span style={{ fontSize: "1rem" }}>
                                {profile.icon}
                              </span>
                            }
                            label={profile.name}
                            size="small"
                            sx={{
                              bgcolor: profile.color,
                              color: "white",
                              fontWeight: 500,
                              "& .MuiChip-icon": {
                                marginLeft: "4px",
                              },
                            }}
                          />
                        )}

                        <Typography variant="body1">
                          {session.actualMinutes} / {session.plannedMinutes}{" "}
                          minutes
                        </Typography>

                        {session.completed && (
                          <Chip
                            label="✓ Completed"
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={formatDate(session.startedAt)}
                  />
                </Box>

                {session.notes && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1.5,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                      width: "100%",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                    >
                      📝 Notes:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {session.notes}
                    </Typography>
                  </Box>
                )}
              </ListItem>
            </React.Fragment>
          );
        })}
      </List>
    </Paper>
  );
};

export default SessionHistory;
