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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { taskService, type Task } from "../services/taskService";

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []); // Missing dependency array optimization

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks();
      setTasks(data);
      setError("");
    } catch (err: any) {
      setError("Failed to load tasks");
      console.error("Fetch error:", err); // Debug log left in
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    // BUG: No confirmation dialog!
    try {
      await taskService.deleteTask(id);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      alert("Failed to delete task"); // Using alert() - not ideal UX
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
          onClick={() => {
            /* TODO: modal */
          }}
        >
          Add Task
        </Button>
      </Box>

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
                    <Box mt={2} display="flex" gap={1}>
                      <Chip
                        label={task.status}
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
                    <IconButton
                      onClick={() => {
                        /* TODO: Edit */
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(task.id!)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TaskList;
