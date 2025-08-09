import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
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

  const handleEnhance = async () => {
    if (!description || description.trim().length < 3) {
      setError("Please provide at least 3 characters to enhance");
      return;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      const result = await aiService.enhanceDescription(title, description);

      onDescriptionChange(result.enhancedDescription);

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

  return (
    <Box sx={{ mt: 1 }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={
          isEnhancing ? <CircularProgress size={16} /> : <AutoFixHighIcon />
        }
        onClick={handleEnhance}
        disabled={isEnhancing || !description || description.trim().length < 3}
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
    </Box>
  );
};

export default DescriptionEnhancer;
