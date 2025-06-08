import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Autocomplete,
  TextField,
  Alert,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

import { ProfileSelector } from "./ProfileSelector";
import SessionHistory from "./sessionHistory";
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
    formatTime,
    getTimerColor,
    saveSessionNotes,
  } = useTimer();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [dotCount, setDotCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ show: false, message: "", severity: "info" });

  const timerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateDots = () => {
      if (timerContainerRef.current) {
        const containerWidth = timerContainerRef.current.offsetWidth;
        const dotWidth = 10;
        const gapWidth = 6;
        const dotsPerRow = Math.floor(containerWidth / (dotWidth + gapWidth));

        const calculatedDots = Math.max(10, Math.min(40, dotsPerRow));
        setDotCount(calculatedDots);
      }
    };

    calculateDots();
    window.addEventListener("resize", calculateDots);
    return () => window.removeEventListener("resize", calculateDots);
  }, []);

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
      console.log("✅ Loaded incomplete tasks:", data.length);
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
    } catch (error) {
      showAlert("Failed to stop session", "error");
    }
  };

  const handleSessionTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: string | null
  ) => {
    if (newType) {
      setSessionType(newType as "WORK" | "SHORT_BREAK" | "LONG_BREAK");
    }
  };

  const handleTaskChange = (event: any, newValue: Task | null) => {
    setSelectedTask(newValue);
  };

  const getMinutesForProfile = (type: string): number => {
    switch (type) {
      case "WORK":
        return selectedProfile.work;
      case "SHORT_BREAK":
        return selectedProfile.break;
      case "LONG_BREAK":
        return selectedProfile.longBreak;
      default:
        return selectedProfile.work;
    }
  };

  return (
    <Box>
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      <Box sx={{ maxWidth: 600, mx: "auto", mb: 4 }}>
        <ProfileSelector
          selectedProfile={selectedProfile}
          onProfileChange={setProfile}
          disabled={timer.isRunning}
        />

        <Autocomplete
          options={tasks}
          value={selectedTask}
          onChange={handleTaskChange}
          getOptionLabel={(option) => option.title}
          disabled={timer.isRunning}
          loading={loadingTasks}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Link to Task (Optional)"
              placeholder="Search tasks..."
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              <Box display="flex" alignItems="center" gap={1} width="100%">
                <AssignmentIcon
                  fontSize="small"
                  sx={{ color: "primary.main" }}
                />
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={500}>
                    {option.title}
                  </Typography>
                  {option.category && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.7rem" }}
                    >
                      {option.category.name}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )}
          noOptionsText={
            loadingTasks
              ? "Loading tasks..."
              : tasks.length === 0
              ? "No tasks yet. Create one first!"
              : "No matching tasks"
          }
          clearOnEscape
          autoHighlight
          openOnFocus
        />

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Session Notes (Optional)"
            placeholder="What are you working on? Any blockers or insights?"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            disabled={!timer.isRunning}
            helperText={
              timer.isRunning
                ? "Notes auto-save when session ends. Click 'Save Now' to save immediately."
                : "Start a session to add notes"
            }
          />

          {timer.isRunning && timer.sessionId && (
            <Button
              size="small"
              variant="outlined"
              disabled={sessionNotes.trim() === ""}
              onClick={async () => {
                try {
                  await saveSessionNotes(sessionNotes);
                  showAlert("Notes saved!", "success");
                } catch (error) {
                  showAlert("Failed to save notes", "error");
                }
              }}
              sx={{ mt: 1 }}
            >
              Save Notes Now
            </Button>
          )}
        </Box>

        {tasks.length === 0 && !loadingTasks && !timer.isRunning && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            💡 Tip: Link sessions to tasks to track which work consumed your
            focus time
          </Typography>
        )}

        {tasks.length > 0 && !timer.isRunning && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            💡 {tasks.length} active tasks • Type to search
          </Typography>
        )}
      </Box>

      <Box
        ref={timerContainerRef}
        sx={{ maxWidth: 400, mx: "auto", mt: 6, px: 3 }}
      >
        <Typography
          variant="caption"
          sx={{
            display: "block",
            textAlign: "center",
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: 2,
            fontSize: "0.75rem",
            mb: 3,
          }}
        >
          {timer.sessionType.replace("_", " ")}
        </Typography>

        <Typography
          variant="h1"
          sx={{
            fontSize: "7rem",
            fontWeight: 300,
            fontVariantNumeric: "tabular-nums",
            textAlign: "center",
            color: getTimerColor(),
            mb: 4,
            lineHeight: 1,
            transition: "color 0.3s ease",
          }}
        >
          {formatTime()}
        </Typography>

        <Box
          display="flex"
          justifyContent="center"
          gap={0.75}
          mb={5}
          sx={{
            flexWrap: "nowrap",
            minHeight: 16,
          }}
        >
          {Array.from({ length: dotCount }).map((_, i) => {
            const totalDots = dotCount;
            const totalMinutes = getMinutesForProfile(timer.sessionType);
            const totalSeconds = totalMinutes * 60;
            const remainingSeconds = timer.minutes * 60 + timer.seconds;
            const elapsedSeconds = totalSeconds - remainingSeconds;
            const percentComplete = Math.max(
              0,
              Math.min(100, (elapsedSeconds / totalSeconds) * 100)
            );

            const dotsAffected = Math.floor(
              (percentComplete / 100) * totalDots
            );

            let isFilled: boolean;

            if (timer.sessionType === "WORK") {
              isFilled = i < totalDots - dotsAffected;
            } else {
              isFilled = i < dotsAffected;
            }

            let dotColor: string;
            if (isFilled) {
              switch (timer.sessionType) {
                case "WORK":
                  dotColor = selectedProfile.color;
                  break;
                case "SHORT_BREAK":
                  dotColor = "rgba(46, 125, 50, 0.5)";
                  break;
                case "LONG_BREAK":
                  dotColor = "rgba(123, 31, 162, 0.5)";
                  break;
                default:
                  dotColor = "#757575";
              }
            } else {
              dotColor = "#e0e0e0";
            }

            return (
              <Box
                key={i}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  flexShrink: 0,
                  backgroundColor: dotColor,
                  transition: "background-color 0.3s ease",
                }}
              />
            );
          })}
        </Box>

        <Box display="flex" gap={1} mb={4}>
          {[
            { type: "WORK", label: "Work" },
            { type: "SHORT_BREAK", label: "Short" },
            { type: "LONG_BREAK", label: "Long" },
          ].map(({ type, label }) => (
            <Button
              key={type}
              onClick={(e) => handleSessionTypeChange(e, type)}
              disabled={timer.isRunning}
              fullWidth
              variant={timer.sessionType === type ? "contained" : "outlined"}
              sx={{
                borderRadius: 3,
                py: 1.5,
                textTransform: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
            >
              {label}
            </Button>
          ))}
        </Box>

        <Box display="flex" gap={2}>
          {!timer.isRunning ? (
            <Button
              variant="contained"
              onClick={handleStart}
              disabled={loading || (timer.minutes === 0 && timer.seconds === 0)}
              fullWidth
              size="large"
              startIcon={<PlayArrowIcon />}
              sx={{
                borderRadius: 3,
                py: 2,
                fontSize: "1.125rem",
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              Start
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                onClick={pauseTimer}
                color="warning"
                fullWidth
                size="large"
                startIcon={<PauseIcon />}
                sx={{
                  borderRadius: 3,
                  py: 2,
                  fontSize: "1.125rem",
                  textTransform: "none",
                  fontWeight: 500,
                }}
              >
                Pause
              </Button>
              <Button
                variant="outlined"
                onClick={handleStop}
                fullWidth
                size="large"
                startIcon={<StopIcon />}
                sx={{
                  borderRadius: 3,
                  py: 2,
                  fontSize: "1.125rem",
                  textTransform: "none",
                  fontWeight: 500,
                }}
              >
                Stop
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Box mt={4}>
        <SessionHistory />
      </Box>
    </Box>
  );
};

export default PomodoroTimer;
