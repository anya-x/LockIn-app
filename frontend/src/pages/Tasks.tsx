import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Pagination,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  TrendingUp,
} from "@mui/icons-material";
import { debounce } from "lodash";
import { taskService, type TaskStatistics } from "../services/taskService";
import { categoryService, type Category } from "../services/categoryService";
import TaskFilters from "../components/tasks/TaskFilters";
import StatCard from "../components/shared/StatCard";
import type { FilterState, Task, TaskRequest } from "../types/task";
import TaskFormModal from "../components/tasks/TaskFormModal";

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "priority" | "status">("date");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  const [stats, setStats] = useState<TaskStatistics>({
    totalTasks: 0,
    todoCount: 0,
    inProgressCount: 0,
    completedCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    category: "all",
    urgent: "all",
    important: "all",
  });

  const [categories, setCategories] = useState<Category[]>([]);

  const hasActiveFilters = () => {
    return (
      filters.status !== "all" ||
      filters.category !== "all" ||
      filters.urgent !== "all" ||
      filters.important !== "all"
    );
  };

  useEffect(() => {
    if (hasActiveFilters()) {
      fetchFilteredTasks(currentPage);
    } else {
      fetchTasks();
    }
    fetchCategories();
    fetchStatistics();
  }, [currentPage, pageSize, filters]);

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const data = await taskService.getStatistics();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to fetch statistics:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasksPaginated(
        currentPage,
        pageSize
      );

      setTasks(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(response.number);
      setError("");
    } catch (err: any) {
      setError("Failed to load tasks");
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredTasks = async (page: number = 0) => {
    try {
      setLoading(true);
      const response = await taskService.filterTasksPaginated(
        filters,
        page,
        pageSize
      );

      setTasks(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(response.number);
      setError("");
    } catch (err: any) {
      setError("Failed to filter tasks");
      console.error("Error filtering tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error("Failed to load categories:", err);
    }
  };

  const debouncedSearch = useMemo(
    () =>
      debounce(async (term: string) => {
        if (!term.trim()) {
          setIsSearching(false);
          setCurrentPage(0);
          if (hasActiveFilters()) {
            fetchFilteredTasks(0);
          } else {
            fetchTasks();
          }
          return;
        }

        setIsSearching(true);
        try {
          const results = await taskService.searchTasks(term);
          setTasks(results);
          setTotalPages(1);
          setTotalElements(results.length);
          setError("");
        } catch (err: any) {
          setError("Search failed");
        } finally {
          setIsSearching(false);
        }
      }, 300),
    []
  );

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      setIsSearching(true);
    }
    debouncedSearch(term);
  };

  const handleFilterChange = async (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(0);

    const hasFilters =
      newFilters.status !== "all" ||
      newFilters.category !== "all" ||
      newFilters.urgent !== "all" ||
      newFilters.important !== "all";

    if (!hasFilters) {
      fetchTasks();
      return;
    }

    setLoading(true);
    try {
      const response = await taskService.filterTasksPaginated(
        newFilters,
        0,
        pageSize
      );
      setTasks(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setCurrentPage(response.number);
      setError("");
    } catch (err: any) {
      console.error("Error filtering tasks:", err);
      setError("Failed to filter tasks");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        await taskService.createTask(taskData);
        if (hasActiveFilters()) {
          fetchFilteredTasks(currentPage);
        } else {
          fetchTasks();
        }
      }
      fetchStatistics();
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
      throw err;
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
      if (hasActiveFilters()) {
        fetchFilteredTasks(currentPage);
      } else {
        fetchTasks();
      }
      fetchStatistics();
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

  const getPageRange = () => {
    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, totalElements);
    return { start, end };
  };

  const { start, end } = getPageRange();

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        switch (sortBy) {
          case "date":
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

          case "priority":
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
      }),
    [tasks, sortBy]
  );

  const statCards = [
    {
      label: "Total Tasks",
      value: stats.totalTasks,
      color: "#1976d2",
      icon: <Schedule sx={{ fontSize: 40, color: "#1976d2" }} />,
    },
    {
      label: "To Do",
      value: stats.todoCount,
      color: "#757575",
      icon: <RadioButtonUnchecked sx={{ fontSize: 40, color: "#757575" }} />,
    },
    {
      label: "In Progress",
      value: stats.inProgressCount,
      color: "#ff9800",
      icon: <TrendingUp sx={{ fontSize: 40, color: "#ff9800" }} />,
    },
    {
      label: "Completed",
      value: stats.completedCount,
      color: "#4caf50",
      icon: <CheckCircle sx={{ fontSize: 40, color: "#4caf50" }} />,
    },
  ];

  if (loading && tasks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && tasks.length === 0) {
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
                endAdornment: isSearching ? (
                  <InputAdornment position="end">
                    <CircularProgress size={16} />
                  </InputAdornment>
                ) : null,
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

      <Box mb={3}>
        <Grid container spacing={2}>
          {statCards.map((stat, index) => (
            <Grid key={index} size={{ xs: 6, md: 3 }}>
              <StatCard
                label={stat.label}
                value={stat.value}
                color={stat.color}
                icon={stat.icon}
                loading={statsLoading}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <TaskFilters
        filters={filters}
        categories={categories}
        onFilterChange={handleFilterChange}
      />

      {!searchTerm && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="body2" color="text.secondary">
            Showing {start}-{end} of {totalElements} tasks
            {hasActiveFilters() && " (filtered)"}
          </Typography>
          <TextField
            select
            size="small"
            label="Per page"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(0);
            }}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </TextField>
        </Box>
      )}

      {sortedTasks.length === 0 ? (
        <Typography>
          {searchTerm || hasActiveFilters()
            ? "No tasks match your search or filters"
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
                  <Box sx={{ flex: 1 }}>
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
                    <Box mt={2} display="flex" gap={1} flexWrap="wrap">
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
                      {task.category && (
                        <Chip
                          label={`${task.category.icon || ""} ${
                            task.category.name
                          }`}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: task.category.color,
                            color: task.category.color,
                          }}
                        />
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

      {totalPages > 1 && !searchTerm && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage + 1}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
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

export default Tasks;
