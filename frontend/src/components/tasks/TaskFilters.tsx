import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Typography,
} from "@mui/material";

import type { SelectChangeEvent } from "@mui/material";

import type { Category } from "../../services/categoryService";
import type { FilterState } from "../../types/task";

interface TaskFiltersProps {
  filters: FilterState;
  categories: Category[];
  onFilterChange: (filters: FilterState) => void;
}

//FIXME: when creating a new category along with task, category filter doesnt refresh with new category

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  categories,
  onFilterChange,
}) => {
  const handleChange = (field: keyof FilterState, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const activeFilterCount =
    (filters.status !== "all" ? 1 : 0) +
    (filters.category !== "all" ? 1 : 0) +
    (filters.urgent !== "all" ? 1 : 0) +
    (filters.important !== "all" ? 1 : 0);

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Filters</Typography>
        {activeFilterCount > 0 && (
          <Chip
            label={`${activeFilterCount} active`}
            size="small"
            color="primary"
            onDelete={() =>
              onFilterChange({
                status: "all",
                category: "all",
                urgent: "all",
                important: "all",
              })
            }
          />
        )}
      </Box>

      <Box display="flex" gap={2} flexWrap="wrap">
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e: SelectChangeEvent) =>
              handleChange("status", e.target.value)
            }
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="TODO">To Do</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.category}
            label="Category"
            onChange={(e: SelectChangeEvent) =>
              handleChange("category", e.target.value)
            }
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id!.toString()}>
                {cat.icon} {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Urgent</InputLabel>
          <Select
            value={filters.urgent}
            label="Urgent"
            onChange={(e: SelectChangeEvent) =>
              handleChange("urgent", e.target.value)
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="true">Urgent</MenuItem>
            <MenuItem value="false">Not Urgent</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Important</InputLabel>
          <Select
            value={filters.important}
            label="Important"
            onChange={(e: SelectChangeEvent) =>
              handleChange("important", e.target.value)
            }
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="true">Important</MenuItem>
            <MenuItem value="false">Not Important</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
};

export default TaskFilters;
