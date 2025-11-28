import React, { useState, useEffect, useRef, useCallback } from "react";
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
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  LinkOff as LinkOffIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

import { CompactProfileSelector } from "../components/timer/CompactProfileSelector";
import SessionHistory from "../components/timer/SessionHistory";
import type { Task } from "../types/task";
import { taskService } from "../services/taskService";
import { useTimer } from "../context/TimerContext";

const PomodoroTimer: React.FC = () => {
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
  const [sessionNotes, setSessionNotes] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ show: false, message: "", severity: "info" });

  const completionTriggeredRef = useRef(false);

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
        await startTimer(selectedTask?.id || null, sessionNotes);
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
      await stopTimer(sessionNotes);
      setSessionNotes("");
      showAlert("Session stopped and saved", "info");
      triggerRefresh();
    } catch (error) {
      showAlert("Failed to stop session", "error");
    }
  };

  const handleSessionTypeChange = (newType: string) => {
    setSessionType(newType as "WORK" | "SHORT_BREAK" | "LONG_BREAK");
  };

  const formatTime = (): string => {
    const mins = String(displayMinutes).padStart(2, "0");
    const secs = String(displaySeconds).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const progress =
    timer.plannedMinutes > 0
      ? Math.min(100, (totalElapsedSeconds / (timer.plannedMinutes * 60)) * 100)
      : 0;

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", px: 2 }}>
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      {/* Timer Display - Hero Section */}
      <Box sx={{ textAlign: "center", pt: 2, pb: 3 }}>
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
            fontSize: { xs: "5rem", sm: "6rem" },
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
            mx: "auto",
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
            { type: "SHORT_BREAK", label: "Short Break" },
            { type: "LONG_BREAK", label: "Long Break" },
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
                py: 2,
                px: 0.5,
              }}
            />
          ))}
        </Box>

        {/* Main Action Buttons */}
        <Box display="flex" gap={2} justifyContent="center">
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
                  px: 4,
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
                  px: 4,
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                Stop
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Linked Task Display */}
      {selectedTask && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: "action.hover",
          }}
        >
          <AssignmentIcon sx={{ color: "primary.main", fontSize: 20 }} />
          <Box flex={1}>
            <Typography variant="body2" fontWeight={600}>
              {selectedTask.title}
            </Typography>
            {selectedTask.category && (
              <Typography variant="caption" color="text.secondary">
                {selectedTask.category.name}
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
      )}

      {/* Expandable Options */}
      <Box sx={{ mb: 3 }}>
        <Button
          fullWidth
          onClick={() => setShowOptions(!showOptions)}
          endIcon={showOptions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{
            justifyContent: "space-between",
            color: "text.secondary",
            textTransform: "none",
            fontWeight: 500,
            py: 1,
          }}
        >
          {showOptions ? "Hide Options" : "Link Task, Notes & Cycle"}
        </Button>

        <Collapse in={showOptions}>
          <Box sx={{ pt: 2 }}>
            {/* Profile Selector */}
            <Box sx={{ mb: 3 }}>
              <CompactProfileSelector
                selectedProfile={selectedProfile}
                onProfileChange={setProfile}
                disabled={timer.isRunning}
              />
            </Box>

            {/* Task Selector */}
            {!selectedTask && (
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
                    label="Link to Task"
                    placeholder="Search tasks..."
                    size="small"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AssignmentIcon
                        fontSize="small"
                        sx={{ color: "primary.main" }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {option.title}
                        </Typography>
                        {option.category && (
                          <Typography variant="caption" color="text.secondary">
                            {option.category.name}
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
                    ? "No tasks available"
                    : "No matching tasks"
                }
                sx={{ mb: 2 }}
              />
            )}

            {/* Session Notes */}
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              label="Session Notes"
              placeholder="What are you working on?"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
            />
            {timer.isRunning && timer.sessionId && sessionNotes.trim() && (
              <Button
                size="small"
                variant="text"
                onClick={async () => {
                  try {
                    await saveSessionNotes(sessionNotes);
                    showAlert("Notes saved!", "success");
                  } catch {
                    showAlert("Failed to save notes", "error");
                  }
                }}
                sx={{ mt: 1 }}
              >
                Save Notes
              </Button>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Session History */}
      <SessionHistory refresh={refreshTrigger} />
    </Box>
  );
};

export default PomodoroTimer;
