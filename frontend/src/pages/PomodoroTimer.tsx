import React, { useState, useEffect, useRef, useCallback, memo, useImperativeHandle, forwardRef } from "react";
import {
  Box,
  Button,
  Typography,
  Autocomplete,
  TextField,
  Alert,
  Chip,
  IconButton,
  Collapse,
  Paper,
  useTheme,
  alpha,
  useMediaQuery,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  LinkOff as LinkOffIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assignment as AssignmentIcon,
  Notes as NotesIcon,
} from "@mui/icons-material";

import { CompactProfileSelector } from "../components/timer/CompactProfileSelector";
import SessionHistory from "../components/timer/SessionHistory";
import type { Task } from "../types/task";
import { taskService } from "../services/taskService";
import { useTimer } from "../context/TimerContext";

// Memoized notes section - manages its own state to prevent lag
interface NotesSectionProps {
  onSaveNotes: (notes: string) => Promise<void>;
  isRunning: boolean;
  hasSession: boolean;
}

interface NotesSectionHandle {
  getNotes: () => string;
  clearNotes: () => void;
}

const NotesSection = memo(forwardRef<NotesSectionHandle, NotesSectionProps>(
  function NotesSection({ onSaveNotes, isRunning, hasSession }, ref) {
    const [localNotes, setLocalNotes] = useState("");
    const [showNotes, setShowNotes] = useState(false);
    const [saving, setSaving] = useState(false);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      getNotes: () => localNotes,
      clearNotes: () => setLocalNotes(""),
    }), [localNotes]);

    const handleSave = async () => {
      if (!localNotes.trim()) return;
      setSaving(true);
      try {
        await onSaveNotes(localNotes);
      } finally {
        setSaving(false);
      }
    };

    return (
      <Box sx={{ mb: 3 }}>
        <Button
          fullWidth
          onClick={() => setShowNotes(!showNotes)}
          startIcon={<NotesIcon sx={{ fontSize: 18 }} />}
          endIcon={showNotes ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{
            justifyContent: "space-between",
            color: "text.secondary",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.875rem",
            py: 1,
            px: 1.5,
            bgcolor: "action.hover",
            borderRadius: 1,
            "&:hover": {
              bgcolor: "action.selected",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            Session Notes
            {localNotes.trim() && !showNotes && (
              <Chip label="Has notes" size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
            )}
          </Box>
        </Button>
        <Collapse in={showNotes}>
          <Box sx={{ pt: 1.5 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="What are you working on?"
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "background.paper",
                },
              }}
            />
            {isRunning && hasSession && (
              <Button
                size="small"
                variant="text"
                onClick={handleSave}
                disabled={saving || !localNotes.trim()}
                sx={{ mt: 1 }}
              >
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            )}
          </Box>
        </Collapse>
      </Box>
    );
  }
));

const PomodoroTimer: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const {
    timer,
    selectedProfile,
    startTimer,
    pauseTimer,
    stopTimer,
    setSessionType,
    setProfile,
    getTimerColor,
    saveSessionNotes,
    triggerCompletion,
  } = useTimer();

  const [displayState, setDisplayState] = React.useState({
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    if (!timer.sessionId) {
      setDisplayState({
        minutes: timer.plannedMinutes,
        seconds: 0,
      });
      return;
    }

    const updateDisplay = () => {
      if (timer.sessionStartedAt) {
        const currentElapsedMs = timer.isRunning
          ? Date.now() - timer.sessionStartedAt
          : 0;
        const totalElapsedMs = (timer.pausedElapsedMs || 0) + currentElapsedMs;
        const elapsedSeconds = Math.floor(totalElapsedMs / 1000);
        const totalSeconds = timer.plannedMinutes * 60;
        const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        setDisplayState({ minutes, seconds });

        if (
          timer.isRunning &&
          remainingSeconds === 0 &&
          !completionTriggeredRef.current
        ) {
          completionTriggeredRef.current = true;
          triggerCompletion();
        }
      } else {
        const totalSeconds = timer.plannedMinutes * 60;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        setDisplayState({ minutes, seconds });
      }
    };

    updateDisplay();

    if (timer.isRunning) {
      const interval = setInterval(updateDisplay, 1000);
      return () => clearInterval(interval);
    }
  }, [
    timer.isRunning,
    timer.sessionId,
    timer.sessionStartedAt,
    timer.plannedMinutes,
    timer.pausedElapsedMs,
    triggerCompletion,
  ]);

  const [totalElapsedSeconds, setTotalElapsedSeconds] = React.useState(0);

  React.useEffect(() => {
    if (!timer.sessionStartedAt) {
      setTotalElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      const currentElapsedMs = timer.isRunning
        ? Date.now() - timer.sessionStartedAt!
        : 0;
      const totalElapsedMs = (timer.pausedElapsedMs || 0) + currentElapsedMs;
      setTotalElapsedSeconds(Math.floor(totalElapsedMs / 1000));
    };

    updateElapsed();

    if (timer.isRunning) {
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [timer.isRunning, timer.sessionStartedAt, timer.pausedElapsedMs]);

  const displayMinutes = displayState.minutes;
  const displaySeconds = displayState.seconds;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ show: false, message: "", severity: "info" });

  const completionTriggeredRef = useRef(false);
  const notesSectionRef = useRef<NotesSectionHandle>(null);

  const lastPlannedMinutesRef = useRef(timer.plannedMinutes);
  const lastSessionTypeRef = useRef(timer.sessionType);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (timer.completionCounter > 0) {
      triggerRefresh();
    }
  }, [timer.completionCounter, triggerRefresh]);

  useEffect(() => {
    if (!timer.isRunning) {
      const plannedChanged =
        timer.plannedMinutes !== lastPlannedMinutesRef.current;
      const typeChanged = timer.sessionType !== lastSessionTypeRef.current;

      if (plannedChanged || typeChanged) {
        setDisplayState({
          minutes: timer.plannedMinutes,
          seconds: 0,
        });
        completionTriggeredRef.current = false;

        lastPlannedMinutesRef.current = timer.plannedMinutes;
        lastSessionTypeRef.current = timer.sessionType;
      }
    }
  }, [timer.plannedMinutes, timer.sessionType, timer.isRunning]);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (timer.selectedTaskId && tasks.length > 0) {
      const task = tasks.find((t) => t.id === timer.selectedTaskId);
      if (task) {
        setSelectedTask(task);
      }
    }
  }, [timer.selectedTaskId, tasks]);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const data = await taskService.getIncompleteTasks();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      showAlert("Failed to load tasks", "error");
    } finally {
      setLoadingTasks(false);
    }
  };

  const showAlert = (
    message: string,
    severity: "success" | "error" | "info"
  ) => {
    setAlert({ show: true, message, severity });
    setTimeout(
      () => setAlert({ show: false, message: "", severity: "info" }),
      3000
    );
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      if (!timer.sessionId) {
        const notes = notesSectionRef.current?.getNotes() || "";
        await startTimer(selectedTask?.id || null, notes);
        showAlert("Session started!", "success");
      } else {
        pauseTimer();
        showAlert("Session resumed!", "info");
      }
    } catch (error) {
      showAlert("Failed to start session", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      const notes = notesSectionRef.current?.getNotes() || "";
      await stopTimer(notes);
      notesSectionRef.current?.clearNotes();
      showAlert("Session stopped and saved", "info");
      triggerRefresh();
    } catch (error) {
      showAlert("Failed to stop session", "error");
    }
  };

  const handleSessionTypeChange = (newType: string) => {
    setSessionType(newType as "WORK" | "SHORT_BREAK" | "LONG_BREAK");
  };

  const handleSaveNotes = useCallback(async (notes: string) => {
    await saveSessionNotes(notes);
    showAlert("Notes saved!", "success");
  }, [saveSessionNotes]);

  const formatTime = (): string => {
    const mins = String(displayMinutes).padStart(2, "0");
    const secs = String(displaySeconds).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const progress =
    timer.plannedMinutes > 0
      ? Math.min(100, (totalElapsedSeconds / (timer.plannedMinutes * 60)) * 100)
      : 0;

  // Timer Panel Component
  const TimerPanel = () => (
    <Paper
      sx={{
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        bgcolor: alpha(selectedProfile.color, 0.1),
        border: `1px solid ${alpha(selectedProfile.color, 0.25)}`,
        transition: "background-color 0.3s ease, border-color 0.3s ease",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: 2,
          fontSize: "0.7rem",
          fontWeight: 600,
        }}
      >
        {timer.sessionType.replace("_", " ")}
      </Typography>

      <Typography
        sx={{
          fontSize: { xs: "5rem", md: "6rem" },
          fontWeight: 200,
          fontVariantNumeric: "tabular-nums",
          color: getTimerColor(),
          lineHeight: 1,
          my: 2,
          transition: "color 0.3s ease",
        }}
      >
        {formatTime()}
      </Typography>

      {/* Progress Bar */}
      <Box
        sx={{
          height: 4,
          bgcolor: "action.hover",
          borderRadius: 2,
          overflow: "hidden",
          width: "100%",
          maxWidth: 280,
          mb: 3,
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${timer.sessionType === "WORK" ? 100 - progress : progress}%`,
            bgcolor: getTimerColor(),
            borderRadius: 2,
            transition: "width 1s linear",
          }}
        />
      </Box>

      {/* Session Type Buttons */}
      <Box display="flex" gap={1} justifyContent="center" mb={3}>
        {[
          { type: "WORK", label: "Focus" },
          { type: "SHORT_BREAK", label: "Short" },
          { type: "LONG_BREAK", label: "Long" },
        ].map(({ type, label }) => (
          <Chip
            key={type}
            label={label}
            onClick={() => !timer.isRunning && handleSessionTypeChange(type)}
            variant={timer.sessionType === type ? "filled" : "outlined"}
            color={timer.sessionType === type ? "primary" : "default"}
            disabled={timer.isRunning}
            sx={{
              fontWeight: 600,
              fontSize: "0.8rem",
            }}
          />
        ))}
      </Box>

      {/* Main Action Buttons */}
      <Box display="flex" gap={2} justifyContent="center" mb={selectedTask ? 2 : 0}>
        {!timer.isRunning ? (
          <Button
            variant="contained"
            onClick={handleStart}
            disabled={
              loading || (displayMinutes === 0 && displaySeconds === 0)
            }
            size="large"
            startIcon={<PlayArrowIcon />}
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 5,
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {timer.sessionId ? "Resume" : "Start"}
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              onClick={pauseTimer}
              color="warning"
              size="large"
              startIcon={<PauseIcon />}
              sx={{
                borderRadius: 3,
                py: 1.5,
                px: 3,
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              Pause
            </Button>
            <Button
              variant="outlined"
              onClick={handleStop}
              size="large"
              startIcon={<StopIcon />}
              sx={{
                borderRadius: 3,
                py: 1.5,
                px: 3,
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              Stop
            </Button>
          </>
        )}
      </Box>

      {/* Linked Task Indicator */}
      {selectedTask && (
        <Chip
          icon={<AssignmentIcon sx={{ fontSize: 16 }} />}
          label={selectedTask.title}
          size="small"
          variant="outlined"
          sx={{
            maxWidth: 280,
            "& .MuiChip-label": {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
          }}
        />
      )}
    </Paper>
  );

  // Controls Panel Component
  const ControlsPanel = () => (
    <Paper
      sx={{
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Linked Task Section */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <AssignmentIcon sx={{ fontSize: 18, color: "text.secondary" }} />
          <Typography variant="subtitle2" fontWeight={600}>
            Link to Task
          </Typography>
        </Box>

        {selectedTask ? (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Box flex={1}>
              <Typography variant="body2" fontWeight={600}>
                {selectedTask.title}
              </Typography>
              {selectedTask.category && (
                <Typography variant="caption" color="text.secondary">
                  {selectedTask.category.icon} {selectedTask.category.name}
                </Typography>
              )}
            </Box>
            {!timer.isRunning && (
              <IconButton
                size="small"
                onClick={() => setSelectedTask(null)}
                sx={{ color: "text.secondary" }}
              >
                <LinkOffIcon fontSize="small" />
              </IconButton>
            )}
          </Paper>
        ) : (
          <Autocomplete
            options={tasks}
            value={selectedTask}
            onChange={(_, newValue) => setSelectedTask(newValue)}
            getOptionLabel={(option) => option.title}
            disabled={timer.isRunning}
            loading={loadingTasks}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search tasks..."
                size="small"
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {option.title}
                    </Typography>
                    {option.category && (
                      <Typography variant="caption" color="text.secondary">
                        {option.category.icon} {option.category.name}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
            noOptionsText={
              loadingTasks
                ? "Loading..."
                : tasks.length === 0
                ? "No incomplete tasks"
                : "No matching tasks"
            }
          />
        )}
      </Box>

      {/* Session Notes Section (Collapsible) - Memoized to prevent re-renders */}
      <NotesSection
        ref={notesSectionRef}
        onSaveNotes={handleSaveNotes}
        isRunning={timer.isRunning}
        hasSession={!!timer.sessionId}
      />

      {/* Focus Profile Section (no header - self explanatory) */}
      <Box sx={{ flex: 1 }}>
        <CompactProfileSelector
          selectedProfile={selectedProfile}
          onProfileChange={setProfile}
          disabled={timer.isRunning}
        />
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", px: 2 }}>
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      {/* Main Layout: Side by Side on Desktop, Stacked on Mobile */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          mb: 3,
          alignItems: "stretch",
        }}
      >
        {/* Left: Timer */}
        <Box
          sx={{
            flex: { xs: "1 1 auto", md: "1 1 55%" },
            minHeight: { md: 420 },
          }}
        >
          <TimerPanel />
        </Box>

        {/* Right: Controls (always visible) */}
        <Box
          sx={{
            flex: { xs: "1 1 auto", md: "1 1 45%" },
            minHeight: { md: 420 },
          }}
        >
          <ControlsPanel />
        </Box>
      </Box>

      {/* Session History (collapsible) */}
      <Box>
        <Button
          fullWidth
          onClick={() => setShowHistory(!showHistory)}
          endIcon={showHistory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{
            justifyContent: "space-between",
            color: "text.secondary",
            textTransform: "none",
            fontWeight: 500,
            py: 1.5,
            px: 2,
            bgcolor: "action.hover",
            borderRadius: 2,
            "&:hover": {
              bgcolor: "action.selected",
            },
          }}
        >
          Today's Focus Sessions
        </Button>

        <Collapse in={showHistory}>
          <Box sx={{ pt: 2 }}>
            <SessionHistory refresh={refreshTrigger} />
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

export default PomodoroTimer;
