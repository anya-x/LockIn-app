import React, { useState } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const PomodoroTimer: React.FC = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const handleStart = () => {
    setIsRunning(true);
    // TODO: Add interval
  };

  return (
    <Paper sx={{ p: 4, textAlign: "center", maxWidth: 400, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Pomodoro Timer
      </Typography>

      <Typography variant="h2" component="div" my={4}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={handleStart}
        startIcon={<PlayArrowIcon />}
        size="large"
      >
        Start
      </Button>
    </Paper>
  );
};

export default PomodoroTimer;
