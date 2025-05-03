import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { taskService } from "../services/taskService";
import TaskFormModal from "./TaskFormModal";
import TaskStats from "./TaskStats";
import type { Task, TaskRequest } from "../types/task";

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "priority" | "status">("date");

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks();
      setTasks(data);
      setError("");
    } catch (err: any) {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    if (!term.trim()) {
      fetchTasks();
      return;
    }

    setLoading(true);
    try {
      const results = await taskService.searchTasks(term);
      setTasks(results);
      setError("");
    } catch (err: any) {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (task?: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(undefined);
  };

  const handleSaveTask = async (taskData: TaskRequest) => {
    try {
      if (editingTask) {
        const updated = await taskService.updateTask(editingTask.id, taskData);
        setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await taskService.createTask(taskData);
        setTasks([...tasks, created]);
      }
      handleCloseModal();
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert("You don't have permission to perform this action.");
      } else if (err.response?.status === 401) {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        alert("Failed to save task. Please try again.");
      }
    }
  };

  const handleDeleteClick = (id: number) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (taskToDelete === null) return;

    try {
      await taskService.deleteTask(taskToDelete);
      setTasks(tasks.filter((t) => t.id !== taskToDelete));
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      alert("Failed to delete task");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "default";
      case "IN_PROGRESS":
        return "primary";
      case "COMPLETED":
        return "success";
      default:
        return "default";
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "date":
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

      case "priority":
        // eisenhower matrix: urgent + important = highest priority
        const getPriority = (task: Task) => {
          if (task.isUrgent && task.isImportant) return 4;
          if (task.isUrgent) return 3;
          if (task.isImportant) return 2;
          return 1;
        };
        return getPriority(b) - getPriority(a);

      case "status":
        const statusOrder = { TODO: 1, IN_PROGRESS: 2, COMPLETED: 3 };
        return statusOrder[a.status] - statusOrder[b.status];

      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
        <Button onClick={fetchTasks}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4">My Tasks</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
            size="small"
            sx={{ minWidth: 250 }}
          />
          <TextField
            select
            size="small"
            label="Sort by"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "date" | "priority" | "status")
            }
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="date">Due Date</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
            <MenuItem value="status">Status</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      <TaskStats tasks={tasks} />

      {sortedTasks.length === 0 ? (
        <Typography>
          {searchTerm
            ? "No tasks found matching your search"
            : "No tasks yet. Create your first task!"}
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sortedTasks.map((task) => (
            <Card key={task.id}>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="start"
                >
                  <Box>
                    <Typography variant="h6">{task.title}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {task.description}
                    </Typography>
                    {task.dueDate && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        mt={1}
                      >
                        Due:{" "}
                        {new Date(task.dueDate).toLocaleString(undefined, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    )}
                    <Box mt={2} display="flex" gap={1}>
                      <Chip
                        label={task.status.replace("_", " ")}
                        color={getStatusColor(task.status)}
                        size="small"
                      />
                      {task.isUrgent && (
                        <Chip label="Urgent" color="error" size="small" />
                      )}
                      {task.isImportant && (
                        <Chip label="Important" color="warning" size="small" />
                      )}
                    </Box>
                  </Box>
                  <Box>
                    <IconButton onClick={() => handleOpenModal(task)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(task.id!)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Task?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this task? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <TaskFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </Box>
  );
};

export default TaskList;
