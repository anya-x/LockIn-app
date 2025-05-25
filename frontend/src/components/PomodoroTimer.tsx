import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
} from "@mui/icons-material";

const PomodoroTimer: React.FC = () => {
  const WORK_TIME = 25;
  const [minutes, setMinutes] = useState(WORK_TIME);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const totalSeconds = WORK_TIME * 60;
  const elapsedSeconds = (WORK_TIME - minutes) * 60 + (60 - seconds);
  const progress = (elapsedSeconds / totalSeconds) * 100;

  const formatTime = (): string => {
    const mins = String(minutes).padStart(2, "0");
    const secs = String(seconds).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setMinutes(WORK_TIME);
    setSeconds(0);
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    // TODO: play notification sound
    // TODO: update backend
    console.log("Timer complete!");
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      console.log("timer started");
      interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds > 0) {
            return prevSeconds - 1;
          } else {
            setMinutes((prevMinutes) => {
              if (prevMinutes > 0) {
                return prevMinutes - 1;
              } else {
                handleTimerComplete();
                console.log("timer complete");
                return 0;
              }
            });
            return 59;
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
  }, [isRunning]);

  return (
    <Paper sx={{ p: 4, textAlign: "center", maxWidth: 400, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Pomodoro Timer
      </Typography>

      <Box position="relative" display="inline-flex" my={4}>
        <CircularProgress
          variant="determinate"
          value={progress}
          size={200}
          thickness={3}
          sx={{
            color: isRunning ? "primary.main" : "grey.400",
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
        {!isRunning ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleStart}
            disabled={minutes === 0 && seconds === 0}
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
          disabled={!isRunning && minutes === WORK_TIME && seconds === 0}
        >
          Stop
        </Button>
      </Box>
    </Paper>
  );
};

export default PomodoroTimer;
