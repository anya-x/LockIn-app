import React, { useState, useEffect, useRef } from "react";
import { Box, Button, Typography } from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
} from "@mui/icons-material";
import {
  sessionService,
  type StartSessionRequest,
} from "../services/sessionService";

interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  sessionType: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  sessionId: number | null;
}

const PomodoroTimer: React.FC = () => {
  const getMinutesForType = (type: string): number => {
    switch (type) {
      case "WORK":
        return 1;
      case "SHORT_BREAK":
        return 1;
      case "LONG_BREAK":
        return 1;
      default:
        return 1;
    }
  };

  const [timer, setTimer] = useState<TimerState>({
    minutes: 25,
    seconds: 0,
    isRunning: false,
    sessionType: "WORK",
    sessionId: null,
  });
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  const [dotCount, setDotCount] = useState(20);
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
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const totalSeconds = getMinutesForType(timer.sessionType) * 60;
  const elapsedSeconds =
    (getMinutesForType(timer.sessionType) - timer.minutes) * 60 +
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
        return "primary.main";
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
      const minutes = getMinutesForType(newType);
      setTimer((prev) => ({
        ...prev,
        sessionType: newType as "WORK" | "SHORT_BREAK" | "LONG_BREAK",
        minutes,
        seconds: 0,
      }));
    }
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

  const handleTimerComplete = async () => {
    console.log("timer completed");

    const title =
      timer.sessionType === "WORK"
        ? "Work session complete!"
        : "Break time over!";
    const body =
      timer.sessionType === "WORK"
        ? "Great focus! Time for a break."
        : "Back to work!";

    showNotification(title, body);

    if (timer.sessionId) {
      try {
        const initialMinutes = getMinutesForType(timer.sessionType);
        await sessionService.completeSession(timer.sessionId, initialMinutes);
        console.log("session completed successfully");
      } catch (error: any) {
        console.error("failed to complete session:", error);
      }
    }
  };

  const handleStart = async () => {
    await requestNotificationPermission();

    setLoading(true);
    try {
      const request: StartSessionRequest = {
        plannedMinutes: getMinutesForType(timer.sessionType),
        sessionType: timer.sessionType,
        taskId: null,
      };

      const session = await sessionService.startSession(request);

      setTimer((prev) => ({
        ...prev,
        isRunning: true,
        sessionId: session.id,
      }));

      console.log("session started:", session.id);
    } catch (error: any) {
      console.error("failed to start session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = () => {
    setTimer((prev) => ({ ...prev, isRunning: false }));
  };

  const handleStop = async () => {
    if (timer.sessionId) {
      try {
        const initialMinutes = getMinutesForType(timer.sessionType);
        const elapsedMinutes =
          initialMinutes - timer.minutes - timer.seconds / 60;
        const actualMinutes = Math.floor(elapsedMinutes);

        await sessionService.completeSession(timer.sessionId, actualMinutes);
        console.log("session saved");
      } catch (error: any) {
        console.error("failed to save session:", error);
      }
    }

    const resetMinutes = getMinutesForType(timer.sessionType);
    setTimer({
      minutes: resetMinutes,
      seconds: 0,
      isRunning: false,
      sessionType: timer.sessionType,
      sessionId: null,
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timer.isRunning) {
      console.log("timer started");
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          } else if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          } else {
            handleTimerComplete();
            return { ...prev, isRunning: false };
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
        console.log("interval cleared");
      }
    };
  }, [timer.isRunning]);

  return (
    <Box>
      {permission === "default" && (
        <Box
          sx={{
            p: 2,
            mb: 3,
            bgcolor: "info.light",
            maxWidth: 400,
            mx: "auto",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            Enable notifications to get alerted when your timer completes!
          </Typography>
          <Button
            size="small"
            onClick={requestNotificationPermission}
            variant="outlined"
          >
            Enable Notifications
          </Button>
        </Box>
      )}

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
            const totalMinutes = getMinutesForType(timer.sessionType);
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
                  dotColor = "rgba(25, 118, 210, 0.5)";
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
                  timer.minutes === getMinutesForType(timer.sessionType) &&
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
    </Box>
  );
};

export default PomodoroTimer;
