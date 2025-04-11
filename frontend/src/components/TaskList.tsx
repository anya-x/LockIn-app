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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { taskService, type Task } from "../services/taskService";
import TaskFormModal from "./TaskFormModal";
import { getErrorMessage } from "../utils/errorHandler";
import TaskStats from "./TaskStats";

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [operationLoading, setOperationLoading] = useState(false); // NEW

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks();
      setTasks(data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
      console.error("Fetch error:", err);
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

  const handleSaveTask = async (taskData: Partial<Task>) => {
    setOperationLoading(true);
    try {
      if (editingTask) {
        const updated = await taskService.updateTask(editingTask.id!, taskData);
        setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await taskService.createTask(taskData);
        setTasks([...tasks, created]);
      }
      handleCloseModal();
    } catch (err) {
      throw err;
    } finally {
      setOperationLoading(false);
    }
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

  const handleDeleteClick = (id: number) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (taskToDelete === null) return;

    setOperationLoading(true);
    try {
      await taskService.deleteTask(taskToDelete);
      setTasks(tasks.filter((t) => t.id !== taskToDelete));
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      alert("Failed to delete task");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

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
        mb={3}
      >
        <Typography variant="h4">My Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
        >
          Add Task
        </Button>
      </Box>

      <TaskStats tasks={tasks} />

      {tasks.length === 0 ? (
        <Typography>No tasks yet. Create your first task!</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {tasks.map((task) => (
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
          <Button onClick={handleDeleteCancel} disabled={operationLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={operationLoading}
          >
            {operationLoading ? "Deleting..." : "Delete"}
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
