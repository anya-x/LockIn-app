import React from "react";
import {
  Box,
  LinearProgress,
  Typography,
  Tooltip,
  alpha,
  useTheme,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { RateLimitStatus } from "../../services/aiService";

interface RateLimitIndicatorProps {
  status: RateLimitStatus;
  variant?: "compact" | "detailed";
}

const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({
  status,
  variant = "compact",
}) => {
  const theme = useTheme();

  const percentage = Math.round((status.used / status.limit) * 100);
  const isNearLimit = status.remaining <= 3 && status.remaining > 0;
  const isAtLimit = status.remaining === 0;

  const getColor = () => {
    if (isAtLimit) return theme.palette.error.main;
    if (isNearLimit) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const getMessage = () => {
    if (isAtLimit) return "Limit reached";
    if (isNearLimit) return `Only ${status.remaining} left`;
    return `${status.remaining} remaining`;
  };

  if (variant === "compact") {
    return (
      <Tooltip
        title={`You've used ${status.used} of ${status.limit} AI requests today. Resets in 24 hours.`}
        arrow
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: alpha(getColor(), 0.1),
            border: `1px solid ${alpha(getColor(), 0.2)}`,
            cursor: "help",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: getColor(),
            }}
          >
            {status.remaining}/{status.limit} AI requests
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        backgroundColor: alpha(getColor(), 0.05),
        border: `1px solid ${alpha(getColor(), 0.15)}`,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            AI Request Limit
          </Typography>
          <Tooltip
            title="You can make 10 AI-powered requests per day. This helps us manage costs while providing great service."
            arrow
          >
            <InfoOutlinedIcon
              sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }}
            />
          </Tooltip>
        </Box>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: getColor(),
          }}
        >
          {getMessage()}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 1,
          backgroundColor: alpha(theme.palette.grey[400], 0.2),
          "& .MuiLinearProgress-bar": {
            backgroundColor: getColor(),
            borderRadius: 1,
          },
        }}
      />

      <Box display="flex" justifyContent="space-between" mt={1}>
        <Typography variant="caption" color="text.secondary">
          {status.used} used
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {status.limit} daily limit
        </Typography>
      </Box>

      {isAtLimit && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: "block", mt: 1, fontWeight: 500 }}
        >
          You've reached your daily limit. Try again tomorrow!
        </Typography>
      )}

      {isNearLimit && (
        <Typography
          variant="caption"
          color="warning.main"
          sx={{ display: "block", mt: 1, fontWeight: 500 }}
        >
          Use your remaining requests wisely!
        </Typography>
      )}
    </Box>
  );
};

export default RateLimitIndicator;
