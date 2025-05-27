import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
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
        return 25;
      case "SHORT_BREAK":
        return 5;
      case "LONG_BREAK":
        return 15;
      default:
        return 25;
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

  const handleTimerComplete = async () => {
    console.log("timer completed");

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
    <Paper sx={{ p: 4, textAlign: "center", maxWidth: 400, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Pomodoro Timer
      </Typography>
      <Box display="flex" justifyContent="center" mb={3}>
        <ToggleButtonGroup
          value={timer.sessionType}
          exclusive
          onChange={handleSessionTypeChange}
          disabled={timer.isRunning}
          color="primary"
        >
          <ToggleButton value="WORK">Work</ToggleButton>
          <ToggleButton value="SHORT_BREAK">Short Break</ToggleButton>
          <ToggleButton value="LONG_BREAK">Long Break</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box position="relative" display="inline-flex" my={4}>
        <CircularProgress
          variant="determinate"
          value={progress}
          size={200}
          thickness={3}
          sx={{
            color:
              timer.sessionType === "WORK"
                ? timer.isRunning
                  ? "primary.main"
                  : "grey.400"
                : timer.isRunning
                ? "success.main"
                : "grey.400",
          }}
        />
        <Box
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          right={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="h2" component="div">
            {formatTime()}
          </Typography>
        </Box>
      </Box>

      <Box display="flex" gap={2} justifyContent="center">
        {!timer.isRunning ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleStart}
            disabled={loading || (timer.minutes === 0 && timer.seconds === 0)}
            size="large"
          >
            Start
          </Button>
        ) : (
          <Button
            variant="contained"
            color="warning"
            startIcon={<PauseIcon />}
            onClick={handlePause}
            size="large"
          >
            Pause
          </Button>
        )}
        <Button
          variant="outlined"
          color="error"
          onClick={handleStop}
          startIcon={<StopIcon />}
          size="large"
          disabled={
            !timer.isRunning &&
            timer.minutes === getMinutesForType(timer.sessionType) &&
            timer.seconds === 0
          }
        >
          Stop
        </Button>
      </Box>
    </Paper>
  );
};

export default PomodoroTimer;
