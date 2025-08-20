import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Tooltip,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import aiService from "../../services/aiService";
import { useRateLimit } from "../../hooks/useRateLimit.ts";

interface DescriptionEnhancerProps {
  title: string;
  description: string;
  onDescriptionChange: (newDescription: string) => void;
}

export const DescriptionEnhancer: React.FC<DescriptionEnhancerProps> = ({
  title,
  description,
  onDescriptionChange,
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedPreview, setEnhancedPreview] = useState<string | null>(null);
  const rateLimit = useRateLimit();

  const handleEnhance = async () => {
    if (!description || description.trim().length < 3) {
      setError("Please provide at least 3 characters to enhance");
      return;
    }

    if (rateLimit.isAtLimit) {
      setError(
        "You've reached your daily AI request limit. Please try again tomorrow."
      );
      return;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      const result = await aiService.enhanceDescription(title, description);

      setEnhancedPreview(result.enhancedDescription);

      await rateLimit.refetch();

      console.log(
        `Enhanced description (${
          result.tokensUsed
        } tokens, $${result.costUSD.toFixed(4)})`
      );
    } catch (err: any) {
      console.error("Enhancement failed:", err);

      if (err.response?.status === 429) {
        setError(
          err.response?.data?.message ||
            "Rate limit exceeded. Please try again later."
        );
        await rateLimit.refetch();
      } else {
        setError(
          err.response?.data?.message || "Failed to enhance description"
        );
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAccept = () => {
    if (enhancedPreview) {
      onDescriptionChange(enhancedPreview);
      setEnhancedPreview(null);
      setError(null);
    }
  };

  const handleReject = () => {
    setEnhancedPreview(null);
    setError(null);
  };

  return (
    <Box sx={{ mt: 1 }}>
      {!enhancedPreview ? (
        <>
          <Tooltip
            title={
              rateLimit.isAtLimit
                ? "Daily AI request limit reached"
                : `${rateLimit.remaining} AI requests remaining today`
            }
            arrow
          >
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  isEnhancing ? (
                    <CircularProgress size={16} />
                  ) : (
                    <AutoFixHighIcon />
                  )
                }
                onClick={handleEnhance}
                disabled={
                  isEnhancing ||
                  !description ||
                  description.trim().length < 3 ||
                  rateLimit.isAtLimit
                }
                sx={{ textTransform: "none" }}
              >
                {isEnhancing
                  ? "Enhancing..."
                  : `Enhance with AI (${rateLimit.remaining}/${rateLimit.limit})`}
              </Button>
            </span>
          </Tooltip>

          {error && (
            <Typography
              color="error"
              variant="caption"
              sx={{ mt: 1, display: "block" }}
            >
              {error}
            </Typography>
          )}
        </>
      ) : (
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mt: 1,
            backgroundColor: "#f5f5f5",
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            Enhanced Description Preview:
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {enhancedPreview}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<CheckIcon />}
              onClick={handleAccept}
              sx={{ textTransform: "none" }}
            >
              Accept
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloseIcon />}
              onClick={handleReject}
              sx={{ textTransform: "none" }}
            >
              Reject
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};
export default DescriptionEnhancer;
