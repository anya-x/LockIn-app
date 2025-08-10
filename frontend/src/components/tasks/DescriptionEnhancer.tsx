import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import aiService from "../../services/aiService";

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

  const handleEnhance = async () => {
    if (!description || description.trim().length < 3) {
      setError("Please provide at least 3 characters to enhance");
      return;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      const result = await aiService.enhanceDescription(title, description);

      setEnhancedPreview(result.enhancedDescription);

      console.log(
        `Enhanced description (${
          result.tokensUsed
        } tokens, $${result.costUSD.toFixed(4)})`
      );
    } catch (err: any) {
      console.error("Enhancement failed:", err);
      setError(err.response?.data?.message || "Failed to enhance description");
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
          <Button
            variant="outlined"
            size="small"
            startIcon={
              isEnhancing ? <CircularProgress size={16} /> : <AutoFixHighIcon />
            }
            onClick={handleEnhance}
            disabled={
              isEnhancing || !description || description.trim().length < 3
            }
            sx={{ textTransform: "none" }}
          >
            {isEnhancing ? "Enhancing..." : "Enhance with AI"}
          </Button>

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
