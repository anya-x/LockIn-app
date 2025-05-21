import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
} from "@mui/icons-material";

const PomodoroTimer: React.FC = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    // TODO: play notification sound
    // TODO: update backend
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
        console.log("intertval cleared");
      }
    };
  }, [isRunning]);

  return (
    <Paper sx={{ p: 4, textAlign: "center", maxWidth: 400, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Pomodoro Timer
      </Typography>

      <Typography variant="h2" component="div" my={4}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </Typography>

      {!isRunning ? (
        <Button
          variant="contained"
          color="primary"
          onClick={handleStart}
          startIcon={<PlayArrowIcon />}
          size="large"
        >
          Start
        </Button>
      ) : (
        <Button
          variant="contained"
          color="warning"
          onClick={handlePause}
          startIcon={<PauseIcon />}
          size="large"
        >
          Pause
        </Button>
      )}
    </Paper>
  );
};

export default PomodoroTimer;
