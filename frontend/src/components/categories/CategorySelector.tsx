import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Paper,
  alpha,
  useTheme,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import type { Category } from "../../services/categoryService";
import { useCategories, useCreateCategory } from "../../hooks/useCategories";

// Preset color palette (same as Categories page)
const COLOR_PALETTE = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#22C55E", // Green
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
  "#64748B", // Slate
  "#78716C", // Stone
];

// Common emoji categories (same as Categories page)
const EMOJI_OPTIONS = [
  "📁", "📂", "📋", "📝", "✏️", "📌", "🎯", "⭐",
  "💼", "🏠", "🏃", "💪", "🧘", "🎨", "🎵", "📚",
  "💡", "🔧", "⚙️", "🛒", "💰", "📱", "💻", "🎮",
  "✈️", "🚗", "🍳", "🥗", "💊", "🏥", "👥", "❤️",
];

interface CategorySelectorProps {
  value: number | null;
  onChange: (categoryId: number | null) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
}) => {
  const theme = useTheme();
  const { data: categories = [], isLoading: loading } = useCategories();
  const createMutation = useCreateCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#6366F1",
    icon: "📁",
  });

  const handleOpenModal = () => {
    setNewCategory({
      name: "",
      color: "#6366F1",
      icon: "📁",
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setNewCategory({
      name: "",
      color: "#6366F1",
      icon: "📁",
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert("Category name is required");
      return;
    }

    if (newCategory.name.length > 50) {
      alert("Category name must be under 50 characters");
      return;
    }

    try {
      setCreating(true);
      const created = await createMutation.mutateAsync(newCategory);
      onChange(created.id!);
      handleCloseModal();
    } catch (error: any) {
      console.error("Failed to create category:", error);
      alert("Failed to create category");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <FormControl fullWidth margin="normal" disabled={loading}>
        <InputLabel>Category</InputLabel>
        <Select
          value={value ? value.toString() : ""}
          label="Category"
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === "" ? null : Number(val));
          }}
        >
          <MenuItem value="">
            <em>No Category</em>
          </MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id!.toString()}>
              {cat.icon} {cat.name}
            </MenuItem>
          ))}
          <MenuItem
            value="__create__"
            onClick={(e) => {
              e.preventDefault();
              handleOpenModal();
            }}
            sx={{
              color: "primary.main",
              fontWeight: "bold",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <AddIcon sx={{ mr: 1 }} fontSize="small" />
            Create New Category
          </MenuItem>
        </Select>
      </FormControl>

      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Create New Category</DialogTitle>
        <DialogContent>
          {/* Preview */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              mt: 1,
              bgcolor: alpha(newCategory.color, 0.05),
              border: `1px solid ${alpha(newCategory.color, 0.2)}`,
              borderRadius: 2,
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: alpha(newCategory.color, 0.15),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                }}
              >
                {newCategory.icon}
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {newCategory.name || "Category Name"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Preview
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Name Input */}
          <TextField
            fullWidth
            label="Category Name"
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory({ ...newCategory, name: e.target.value })
            }
            placeholder="e.g., Work, Health, Learning"
            sx={{ mb: 3 }}
            autoFocus
            helperText={`${newCategory.name.length}/50 characters`}
            slotProps={{
              htmlInput: {
                maxLength: 50,
              },
            }}
          />

          {/* Icon Picker */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Icon
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.5,
              mb: 3,
              p: 1.5,
              bgcolor: "action.hover",
              borderRadius: 2,
            }}
          >
            {EMOJI_OPTIONS.map((emoji) => (
              <Box
                key={emoji}
                onClick={() => setNewCategory({ ...newCategory, icon: emoji })}
                sx={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  borderRadius: 1.5,
                  cursor: "pointer",
                  bgcolor: newCategory.icon === emoji ? alpha(newCategory.color, 0.2) : "transparent",
                  border: newCategory.icon === emoji ? `2px solid ${newCategory.color}` : "2px solid transparent",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: alpha(newCategory.color, 0.1),
                  },
                }}
              >
                {emoji}
              </Box>
            ))}
          </Box>

          {/* Color Picker */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Color
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              p: 1.5,
              bgcolor: "action.hover",
              borderRadius: 2,
            }}
          >
            {COLOR_PALETTE.map((color) => (
              <Box
                key={color}
                onClick={() => setNewCategory({ ...newCategory, color })}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: color,
                  cursor: "pointer",
                  border: newCategory.color === color ? "3px solid white" : "3px solid transparent",
                  boxShadow: newCategory.color === color ? `0 0 0 2px ${color}` : "none",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    transform: "scale(1.1)",
                  },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseModal} color="inherit" disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={creating || !newCategory.name.trim()}
          >
            {creating ? <CircularProgress size={20} /> : "Create Category"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CategorySelector;
