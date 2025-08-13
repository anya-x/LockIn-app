import React from "react";
import { Box, Typography, Button } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

interface EmptyStateProps {
  icon?: React.ReactElement<SvgIconComponent>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactElement;
  };

  sx?: object;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 8,
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            mb: 2,
            color: "text.secondary",
            "& .MuiSvgIcon-root": {
              fontSize: 64,
              opacity: 0.5,
            },
          }}
        >
          {icon}
        </Box>
      )}

      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, mb: 3, maxWidth: 400, mx: "auto" }}
        >
          {description}
        </Typography>
      )}

      {action && (
        <Button
          variant="outlined"
          startIcon={action.icon}
          onClick={action.onClick}
          sx={{ mt: 2 }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
