import React, { useState } from "react";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Checkbox,
  FormControlLabel,
  Typography,
  Button,
  alpha,
  useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";

import type { Category } from "../../services/categoryService";
import type { FilterState } from "../../types/task";

interface TaskFiltersProps {
  filters: FilterState;
  categories: Category[];
  onFilterChange: (filters: FilterState) => void;
}

// Priority quadrant definitions based on Eisenhower Matrix
const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities", color: "#64748b" },
  { value: "do-first", label: "Do First", color: "#EF4444", hint: "Urgent & Important" },
  { value: "schedule", label: "Schedule", color: "#3B82F6", hint: "Important only" },
  { value: "delegate", label: "Delegate", color: "#F59E0B", hint: "Urgent only" },
  { value: "eliminate", label: "Consider", color: "#64748b", hint: "Neither" },
] as const;

// Status options for quick filter chips
const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Done" },
] as const;

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  categories,
  onFilterChange,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Calculate active filter count for badge display
  const activeFilterCount =
    (filters.status !== "all" ? 1 : 0) +
    (filters.category !== "all" ? 1 : 0) +
    (filters.priority !== "all" ? 1 : 0);

  /**
   * Generic filter change handler with priority -> urgent/important sync
   * When user selects a quadrant, we translate it to urgent/important flags
   * for backend API compatibility
   */
  const handleFilterChange = <K extends keyof FilterState>(
    field: K,
    value: FilterState[K]
  ) => {
    const newFilters = { ...filters, [field]: value };

    // Sync priority quadrant to urgent/important for backend
    if (field === "priority") {
      switch (value) {
        case "do-first":
          newFilters.urgent = "true";
          newFilters.important = "true";
          break;
        case "schedule":
          newFilters.urgent = "false";
          newFilters.important = "true";
          break;
        case "delegate":
          newFilters.urgent = "true";
          newFilters.important = "false";
          break;
        case "eliminate":
          newFilters.urgent = "false";
          newFilters.important = "false";
          break;
        default:
          newFilters.urgent = "all";
          newFilters.important = "all";
      }
    }

    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    onFilterChange({
      status: "all",
      category: "all",
      urgent: "all",
      important: "all",
      priority: "all",
      hideCompleted: false,
    });
  };

  /**
   * Returns chip styles based on status and selection state
   * Uses theme colors for consistency with the rest of the app
   */
  const getStatusChipStyles = (status: string, isSelected: boolean) => {
    const baseStyles = {
      fontWeight: 500,
      fontSize: "0.8rem",
      transition: "all 0.15s ease",
      cursor: "pointer",
      border: "1px solid",
    };

    if (!isSelected) {
      return {
        ...baseStyles,
        bgcolor: "transparent",
        borderColor: theme.palette.divider,
        color: theme.palette.text.secondary,
        "&:hover": {
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderColor: theme.palette.primary.main,
        },
      };
    }

    // Apply status-specific colors when selected
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      TODO: {
        bg: alpha(theme.palette.text.secondary, 0.1),
        border: theme.palette.text.secondary,
        text: theme.palette.text.primary,
      },
      IN_PROGRESS: {
        bg: alpha(theme.palette.warning.main, 0.15),
        border: theme.palette.warning.main,
        text: theme.palette.warning.dark,
      },
      COMPLETED: {
        bg: alpha(theme.palette.success.main, 0.15),
        border: theme.palette.success.main,
        text: theme.palette.success.dark,
      },
      all: {
        bg: alpha(theme.palette.primary.main, 0.1),
        border: theme.palette.primary.main,
        text: theme.palette.primary.main,
      },
    };

    const colors = colorMap[status] || colorMap.all;
    return {
      ...baseStyles,
      bgcolor: colors.bg,
      borderColor: colors.border,
      color: colors.text,
    };
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* Quick Filters Row - Always Visible */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 1.5,
        }}
      >
        {/* Status Quick Filter Chips */}
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {STATUS_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              size="small"
              onClick={() => handleFilterChange("status", option.value)}
              sx={getStatusChipStyles(option.value, filters.status === option.value)}
            />
          ))}
        </Box>

        {/* Visual Separator */}
        <Box
          sx={{
            width: 1,
            height: 24,
            bgcolor: theme.palette.divider,
            mx: 0.5,
            display: { xs: "none", sm: "block" },
          }}
        />

        {/* Hide Completed Toggle */}
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={filters.hideCompleted}
              onChange={(e) => handleFilterChange("hideCompleted", e.target.checked)}
              sx={{ py: 0 }}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Hide completed
            </Typography>
          }
          sx={{ mr: 0, ml: 0 }}
        />

        {/* Flexible Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Advanced Filters Toggle Button */}
        <Button
          size="small"
          variant={expanded ? "contained" : "outlined"}
          color={activeFilterCount > 0 ? "primary" : "inherit"}
          startIcon={<FilterIcon sx={{ fontSize: 18 }} />}
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setExpanded(!expanded)}
          sx={{
            textTransform: "none",
            fontWeight: 500,
            minWidth: "auto",
            ...(activeFilterCount === 0 && !expanded && {
              color: theme.palette.text.secondary,
              borderColor: theme.palette.divider,
            }),
          }}
        >
          Filters
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              color="primary"
              sx={{
                ml: 0.75,
                height: 18,
                fontSize: "0.7rem",
                fontWeight: 600,
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          )}
        </Button>
      </Box>

      {/* Collapsible Advanced Filter Panel */}
      <Collapse in={expanded}>
        <Box
          sx={{
            p: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: { xs: "stretch", sm: "flex-end" },
          }}
        >
          {/* Priority / Quadrant Filter */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority}
              label="Priority"
              onChange={(e: SelectChangeEvent) =>
                handleFilterChange("priority", e.target.value as FilterState["priority"])
              }
            >
              {PRIORITY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: option.color,
                        flexShrink: 0,
                      }}
                    />
                    <Box>
                      <Typography variant="body2">{option.label}</Typography>
                      {option.hint && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", lineHeight: 1.2 }}
                        >
                          {option.hint}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Category Filter */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={(e: SelectChangeEvent) =>
                handleFilterChange("category", e.target.value)
              }
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id!.toString()}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>{cat.icon}</span>
                    <Typography variant="body2">{cat.name}</Typography>
                    {cat.taskCount !== undefined && (
                      <Typography variant="caption" color="text.secondary">
                        ({cat.taskCount})
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Spacer for desktop layout */}
          <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />

          {/* Clear All Filters Button */}
          {activeFilterCount > 0 && (
            <Button
              size="small"
              variant="text"
              color="inherit"
              startIcon={<ClearIcon sx={{ fontSize: 16 }} />}
              onClick={handleClearFilters}
              sx={{
                textTransform: "none",
                color: theme.palette.text.secondary,
                "&:hover": {
                  color: theme.palette.error.main,
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                },
              }}
            >
              Clear filters
            </Button>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default TaskFilters;
