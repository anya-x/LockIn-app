import React from "react";
import { Box, Paper, Typography, CircularProgress } from "@mui/material";

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  color,
  icon,
  loading = false,
}) => {
  return (
    <Paper
      sx={{
        p: 2,
        textAlign: "center",
        position: "relative",
        minHeight: 120,
      }}
    >
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={100}
        >
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          <Box mb={1}>{icon}</Box>
          <Typography variant="h4" sx={{ color, fontWeight: "bold" }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </>
      )}
    </Paper>
  );
};

export default StatCard;
