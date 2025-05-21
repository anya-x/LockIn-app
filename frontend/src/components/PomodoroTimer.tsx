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
    // TODO: Add interval
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  useEffect(() => {
    console.log("Effect running - isRunning:", isRunning);

    if (isRunning) {
      console.log("Starting interval");
      const interval = setInterval(() => {
        console.log("Time:", minutes, seconds);

        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          console.log("Timer complete!");
          setIsRunning(false);
        }
      }, 1000);
    }
  }, [isRunning, minutes, seconds]);

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
