import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { categoryService, type Category } from "../../services/categoryService";
import { useCategories, useCreateCategory } from "../../hooks/useCategories";

interface CategorySelectorProps {
  value: number | null;
  onChange: (categoryId: number | null) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
}) => {
  const { data: categories = [], isLoading: loading } = useCategories();
  const createMutation = useCreateCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#1976d2",
    icon: "📁",
  });

  const handleOpenModal = () => {
    setNewCategory({
      name: "",
      color: "#1976d2",
      icon: "📁",
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setNewCategory({
      name: "",
      color: "#1976d2",
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
      >
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory({ ...newCategory, name: e.target.value })
            }
            margin="normal"
            required
            autoFocus
            helperText={`${newCategory.name.length}/50 characters`}
            slotProps={{
              htmlInput: {
                maxLength: 50,
              },
            }}
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Icon (emoji)
            </Typography>
            <TextField
              fullWidth
              value={newCategory.icon}
              onChange={(e) =>
                setNewCategory({ ...newCategory, icon: e.target.value })
              }
              placeholder="📁"
              slotProps={{
                htmlInput: {
                  maxLength: 10,
                },
              }}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Color
            </Typography>
            <TextField
              type="color"
              fullWidth
              value={newCategory.color}
              onChange={(e) =>
                setNewCategory({ ...newCategory, color: e.target.value })
              }
            />
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Preview:
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: newCategory.color,
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                }}
              >
                {newCategory.icon}
              </Box>
              <Typography variant="body1">
                {newCategory.name || "Category Name"}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={creating || !newCategory.name.trim()}
          >
            {creating ? <CircularProgress size={20} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CategorySelector;
