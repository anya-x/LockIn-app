import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Autocomplete,
  TextField,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import {
  sessionService,
  type StartSessionRequest,
} from "../services/sessionService";

import { ProfileSelector } from "./ProfileSelector";
import {
  FOCUS_PROFILES,
  type FocusProfile,
  getDefaultProfile,
} from "../config/focusProfiles";
import SessionHistory from "./sessionHistory";
import type { Task } from "../types/task";
import { taskService } from "../services/taskService";

interface SessionStats {
  totalMinutes: number;
  sessionsCompleted: number;
}

interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  sessionType: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  sessionId: number | null;
  initialMinutes: number;
  sessionStartTime: number | null;
}
// TODO: if timer is running and user refreshes, nit will resume but the backend session is lost

const PomodoroTimer: React.FC = () => {
  const [selectedProfile, setSelectedProfile] = useState<FocusProfile>(() => {
    const savedProfile = localStorage.getItem("lastFocusProfile");
    return (
      FOCUS_PROFILES.find((p) => p.id === savedProfile) || getDefaultProfile()
    );
  });

  const [timer, setTimer] = useState<TimerState>(() => {
    const saved = localStorage.getItem("timerState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.sessionStartTime) {
          const elapsed = Math.floor(
            (Date.now() - parsed.sessionStartTime) / 1000
          );
          const totalElapsed = Math.floor(elapsed);
          const minutes = Math.floor(
            (parsed.minutes * 60 + parsed.seconds - totalElapsed) / 60
          );
          const seconds =
            (parsed.minutes * 60 + parsed.seconds - totalElapsed) % 60;

          if (minutes < 0 || (minutes === 0 && seconds <= 0)) {
            return {
              ...parsed,
              minutes: 0,
              seconds: 0,
              isRunning: false,
              sessionStartTime: null,
            };
          }

          return {
            ...parsed,
            minutes: Math.max(0, minutes),
            seconds: Math.max(0, seconds),
          };
        }
        return parsed;
      } catch {
        return getDefaultTimerState();
      }
    }
    return getDefaultTimerState();
  });

  const [loading, setLoading] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [todayStats, setTodayStats] = useState<SessionStats | null>(null);
  const [dotCount, setDotCount] = useState(20);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const timerContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function getDefaultTimerState(): TimerState {
    return {
      minutes: 25,
      seconds: 0,
      isRunning: false,
      sessionType: "WORK",
      sessionId: null,
      initialMinutes: 25,
      sessionStartTime: null,
    };
  }

  const getMinutesForProfile = (
    profile: FocusProfile,
    type: string
  ): number => {
    switch (type) {
      case "WORK":
        return profile.work;
      case "SHORT_BREAK":
        return profile.break;
      case "LONG_BREAK":
        return profile.longBreak;
      default:
        return profile.work;
    }
  };

  useEffect(() => {
    localStorage.setItem("timerState", JSON.stringify(timer));
  }, [timer]);

  useEffect(() => {
    audioRef.current = new Audio("/notification.wav");
  }, []);

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
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const savedProfileId = localStorage.getItem("lastFocusProfile");
    if (savedProfileId) {
      const profile = FOCUS_PROFILES.find((p) => p.id === savedProfileId);
      if (profile && !timer.isRunning) {
        setSelectedProfile(profile);
        setTimer((prev) => ({
          ...prev,
          minutes: profile.work,
          seconds: 0,
        }));
      }
    }
  }, []);

  useEffect(() => {
    fetchTodayStats();
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const data = await taskService.getIncompleteTasks();
      console.log("✅ Loaded incomplete tasks:", data.length);
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const stats = await sessionService.getTodayStats();
      setTodayStats(stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const totalSeconds =
    getMinutesForProfile(selectedProfile, timer.sessionType) * 60;
  const elapsedSeconds =
    (getMinutesForProfile(selectedProfile, timer.sessionType) - timer.minutes) *
      60 +
    (60 - timer.seconds);
  const progress = (elapsedSeconds / totalSeconds) * 100;

  const formatTime = (): string => {
    const mins = String(timer.minutes).padStart(2, "0");
    const secs = String(timer.seconds).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const getTimerColor = () => {
    if (!timer.isRunning) return "text.primary";

    switch (timer.sessionType) {
      case "WORK":
        return selectedProfile.color;
      case "SHORT_BREAK":
        return "success.main";
      case "LONG_BREAK":
        return "#7b1fa2";
      default:
        return "text.primary";
    }
  };

  const handleSessionTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: string | null
  ) => {
    if (newType && !timer.isRunning) {
      const minutes = getMinutesForProfile(selectedProfile, newType);
      setTimer((prev) => ({
        ...prev,
        sessionType: newType as "WORK" | "SHORT_BREAK" | "LONG_BREAK",
        minutes,
        seconds: 0,
      }));
    }
  };

  const handleProfileChange = (profile: FocusProfile) => {
    setSelectedProfile(profile);
    localStorage.setItem("lastFocusProfile", profile.id);

    if (!timer.isRunning) {
      const minutes = getMinutesForProfile(profile, timer.sessionType);
      setTimer((prev) => ({
        ...prev,
        minutes,
        seconds: 0,
      }));
    }
  };

  const handleTaskChange = (event: any, newValue: Task | null) => {
    setSelectedTask(newValue);
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      setPermission(perm);
    }
  };

  const showNotification = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/lockin-icon.png",
      });
    }
  };

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Failed to play sound:", error);
      });
    }
  };

  const handleTimerComplete = async () => {
    console.log("timer completed");
    playSound();

    const title =
      timer.sessionType === "WORK"
        ? "Work session complete!"
        : "Break time over!";
    const body =
      timer.sessionType === "WORK"
        ? "Great work! Take a break."
        : "Time to get back to work!";

    showNotification(title, body);

    if (timer.sessionId) {
      try {
        const plannedMinutes = getMinutesForProfile(
          selectedProfile,
          timer.sessionType
        );
        await sessionService.completeSession(timer.sessionId, plannedMinutes);
        await fetchTodayStats();
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }

    if (timer.sessionType === "WORK") {
      const nextType: "SHORT_BREAK" | "LONG_BREAK" =
        Math.floor(Math.random() * 4) === 3 ? "LONG_BREAK" : "SHORT_BREAK";
      const nextMinutes = getMinutesForProfile(selectedProfile, nextType);

      setTimer({
        minutes: nextMinutes,
        seconds: 0,
        isRunning: false,
        sessionType: nextType,
        sessionId: null,
        initialMinutes: nextMinutes,
        sessionStartTime: null,
      });
    } else {
      const nextMinutes = getMinutesForProfile(selectedProfile, "WORK");
      setTimer({
        minutes: nextMinutes,
        seconds: 0,
        isRunning: false,
        sessionType: "WORK",
        sessionId: null,
        initialMinutes: nextMinutes,
        sessionStartTime: null,
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev.seconds === 0) {
            if (prev.minutes === 0) {
              handleTimerComplete();
              return {
                ...prev,
                isRunning: false,
                sessionStartTime: null,
              };
            }
            return {
              ...prev,
              minutes: prev.minutes - 1,
              seconds: 59,
            };
          }
          return {
            ...prev,
            seconds: prev.seconds - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning]);

  const handleStart = async () => {
    setLoading(true);

    try {
      const request: StartSessionRequest = {
        plannedMinutes: getMinutesForProfile(
          selectedProfile,
          timer.sessionType
        ),
        sessionType: timer.sessionType,
        taskId: selectedTask?.id || null,
        profileName: selectedProfile.id,
      };

      const response = await sessionService.startSession(request);

      setTimer((prev) => ({
        ...prev,
        isRunning: true,
        sessionId: response.id,
        initialMinutes: prev.minutes,
        sessionStartTime: Date.now(),
      }));

      await fetchTodayStats();
    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = () => {
    setTimer((prev) => ({
      ...prev,
      isRunning: !prev.isRunning,
      sessionStartTime: !prev.isRunning ? Date.now() : null,
    }));
  };

  const handleStop = async () => {
    if (timer.sessionId) {
      try {
        const actualMinutes = Math.ceil(
          (timer.initialMinutes * 60 - (timer.minutes * 60 + timer.seconds)) /
            60
        );

        await sessionService.completeSession(timer.sessionId, actualMinutes);
        await fetchTodayStats();
      } catch (error) {
        console.error("Failed to stop session:", error);
      }
    }

    const minutes = getMinutesForProfile(selectedProfile, timer.sessionType);
    setTimer({
      minutes,
      seconds: 0,
      isRunning: false,
      sessionType: timer.sessionType,
      sessionId: null,
      initialMinutes: minutes,
      sessionStartTime: null,
    });

    localStorage.removeItem("timerState");
  };

  return (
    <Box>
      <Box sx={{ maxWidth: 600, mx: "auto", mb: 4 }}>
        <ProfileSelector
          selectedProfile={selectedProfile}
          onProfileChange={handleProfileChange}
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
            const totalMinutes = getMinutesForProfile(
              selectedProfile,
              timer.sessionType
            );
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
                onClick={handlePause}
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
                disabled={
                  !timer.isRunning &&
                  timer.minutes ===
                    getMinutesForProfile(selectedProfile, timer.sessionType) &&
                  timer.seconds === 0
                }
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
