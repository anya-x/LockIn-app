import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Skeleton,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import type { Category } from "../services/categoryService";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../hooks/useCategories";
import EmptyState from "../components/shared/EmptyState";
import { useAsyncOperation } from "../hooks/useAsyncOperation.ts";

const Categories: React.FC = () => {
  const { data: categories = [], isLoading: loading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#1976d2",
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
        color: "#1976d2",
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
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category? Tasks will not be deleted.")) return;

    await executeDelete(async () => {
      await deleteMutation.mutateAsync(id);
    });
  };
  const CategorySkeleton = () => (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="start">
            <Box display="flex" alignItems="center" gap={1}>
              <Skeleton variant="rectangular" width={40} height={40} />
              <Skeleton variant="text" width={120} height={32} />
            </Box>
            <Box>
              <Skeleton
                variant="circular"
                width={24}
                height={24}
                sx={{ mr: 1, display: "inline-block" }}
              />
              <Skeleton
                variant="circular"
                width={24}
                height={24}
                sx={{ display: "inline-block" }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  if (loading) {
    return (
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Skeleton variant="text" width={150} height={48} />
          <Skeleton variant="rectangular" width={160} height={40} />
        </Box>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CategorySkeleton key={i} />
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Categories</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
        >
          Add Category
        </Button>
      </Box>

      <Grid container spacing={2}>
        {categories.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <EmptyState
              title="No categories yet"
              description="Create your first category!"
            />
          </Grid>
        ) : (
          categories.map((category) => (
            <Grid key={category.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="start"
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: category.color,
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                        }}
                      >
                        {category.icon}
                      </Box>
                      <Typography variant="h6">{category.name}</Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenModal(category)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(category.id!)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCategory ? "Edit Category" : "Create Category"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Color"
            type="color"
            value={formData.color}
            onChange={(e) =>
              setFormData({ ...formData, color: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Icon (emoji)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            margin="normal"
            placeholder="📁"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;
