import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Skeleton,
  Paper,
  Chip,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Folder as FolderIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { type Category } from "../services/categoryService";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../hooks/useCategories";
import EmptyState from "../components/shared/EmptyState";
import { useAsyncOperation } from "../hooks/useAsyncOperation.ts";
import { CATEGORY_PALETTE } from "../utils/colorMaps";

// Common emoji categories
const EMOJI_OPTIONS = [
  "📁", "📂", "📋", "📝", "✏️", "📌", "🎯", "⭐",
  "💼", "🏠", "🏃", "💪", "🧘", "🎨", "🎵", "📚",
  "💡", "🔧", "⚙️", "🛒", "💰", "📱", "💻", "🎮",
  "✈️", "🚗", "🍳", "🥗", "💊", "🏥", "👥", "❤️",
];

const Categories: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: categories = [], isLoading: loading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#6366F1",
    icon: "📁",
  });

  const { execute: executeSave } = useAsyncOperation({
    onSuccess: () => handleCloseModal(),
    onError: (error) => alert(`Failed to save category: ${error}`),
  });

  const { execute: executeDelete } = useAsyncOperation({
    onError: (error) => alert(`Failed to delete category: ${error}`),
  });

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        color: category.color,
        icon: category.icon,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        color: "#6366F1",
        icon: "📁",
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    await executeSave(async () => {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id!,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
    });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? Tasks in this category will become uncategorized.`)) return;

    await executeDelete(async () => {
      await deleteMutation.mutateAsync(id);
    });
  };

  const handleFilterByCategory = (categoryId: number) => {
    navigate(`/tasks?category=${categoryId}`);
  };

  // Calculate totals
  const totalTasks = categories.reduce((sum, cat) => sum + (cat.taskCount || 0), 0);

  if (loading) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Skeleton variant="text" width={150} height={40} />
          <Skeleton variant="rounded" width={140} height={36} />
        </Box>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Categories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {categories.length} {categories.length === 1 ? "category" : "categories"} · {totalTasks} total tasks
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          size="small"
        >
          Add Category
        </Button>
      </Box>

      {/* Category Grid */}
      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create categories to organize your tasks by project, area of life, or any way you like."
        />
      ) : (
        <Grid container spacing={2}>
          {categories.map((category) => (
            <Grid key={category.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                sx={{
                  p: 0,
                  overflow: "hidden",
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: `0 4px 20px ${alpha(category.color, 0.2)}`,
                    borderColor: alpha(category.color, 0.3),
                  },
                }}
              >
                {/* Color Banner */}
                <Box
                  sx={{
                    height: 8,
                    background: `linear-gradient(90deg, ${category.color}, ${alpha(category.color, 0.6)})`,
                  }}
                />

                <Box sx={{ p: 2.5 }}>
                  {/* Header Row */}
                  <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: alpha(category.color, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem",
                        flexShrink: 0,
                      }}
                    >
                      {category.icon}
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {category.taskCount || 0} {(category.taskCount || 0) === 1 ? "task" : "tasks"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Actions Row */}
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Tooltip title="View tasks in this category">
                      <Chip
                        icon={<FilterIcon sx={{ fontSize: 16 }} />}
                        label="View Tasks"
                        size="small"
                        onClick={() => handleFilterByCategory(category.id!)}
                        sx={{
                          bgcolor: alpha(category.color, 0.1),
                          color: category.color,
                          fontWeight: 500,
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: alpha(category.color, 0.2),
                          },
                        }}
                      />
                    </Tooltip>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenModal(category)}
                        sx={{
                          color: "text.secondary",
                          "&:hover": { color: "primary.main" },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(category.id!, category.name)}
                        sx={{
                          color: "text.secondary",
                          "&:hover": { color: "error.main" },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {editingCategory ? "Edit Category" : "Create Category"}
        </DialogTitle>
        <DialogContent>
          {/* Preview */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              mt: 1,
              bgcolor: alpha(formData.color, 0.05),
              border: `1px solid ${alpha(formData.color, 0.2)}`,
              borderRadius: 2,
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: alpha(formData.color, 0.15),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                }}
              >
                {formData.icon}
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {formData.name || "Category Name"}
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
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Work, Health, Learning"
            sx={{ mb: 3 }}
            autoFocus
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
                onClick={() => setFormData({ ...formData, icon: emoji })}
                sx={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  borderRadius: 1.5,
                  cursor: "pointer",
                  bgcolor: formData.icon === emoji ? alpha(formData.color, 0.2) : "transparent",
                  border: formData.icon === emoji ? `2px solid ${formData.color}` : "2px solid transparent",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: alpha(formData.color, 0.1),
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
            {CATEGORY_PALETTE.map((color) => (
              <Box
                key={color}
                onClick={() => setFormData({ ...formData, color })}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: color,
                  cursor: "pointer",
                  border: formData.color === color ? "3px solid white" : "3px solid transparent",
                  boxShadow: formData.color === color ? `0 0 0 2px ${color}` : "none",
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
          <Button onClick={handleCloseModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {editingCategory ? "Save Changes" : "Create Category"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;
