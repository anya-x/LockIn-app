import React from "react";
import { Box, Typography, Button } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

interface EmptyStateProps {
  /**
   * Icon to display above the message
   */
  icon?: React.ReactElement<SvgIconComponent>;

  /**
   * Main heading text
   */
  title: string;

  /**
   * Optional descriptive text below the title
   */
  description?: string;

  /**
   * Optional action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactElement;
  };

  /**
   * Custom sx props for the container
   */
  sx?: object;
}

/**
 * Reusable empty state component for consistent "no data" UX.
 * Consolidates duplicate empty state patterns from multiple pages.
 *
 * @example
 * <EmptyState
 *   icon={<TaskIcon fontSize="large" />}
 *   title="No tasks yet"
 *   description="Create your first task to get started!"
 *   action={{
 *     label: "Create Task",
 *     onClick: handleCreate,
 *     icon: <AddIcon />
 *   }}
 * />
 */
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
