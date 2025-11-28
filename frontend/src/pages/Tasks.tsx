import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
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
  useTheme,
  alpha,
  Checkbox,
  Paper,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import { debounce } from "lodash";
import { taskService, type TaskStatistics } from "../services/taskService";
import { categoryService, type Category } from "../services/categoryService";
import TaskFilters from "../components/tasks/TaskFilters";
import StatPills from "../components/shared/StatPills";
import type { FilterState, Task, TaskRequest } from "../types/task";
import TaskFormModal from "../components/tasks/TaskFormModal";
import AITaskBreakdown from "../components/ai/AITaskBreakdown";
import CompactBriefing from "../components/ai/CompactBriefing";
import EmptyState from "../components/shared/EmptyState";
import { getStatusColor, getPriorityLevel } from "../utils/colorMaps";

const Tasks: React.FC = () => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [aiBreakdownOpen, setAiBreakdownOpen] = useState(false);
  const [taskForBreakdown, setTaskForBreakdown] = useState<Task | undefined>(
    undefined
  );
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

  // Initialize filters from URL params
  const categoryParam = searchParams.get("category");
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    category: categoryParam || "all",
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

  // Handle URL param changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl && categoryFromUrl !== filters.category) {
      setFilters((prev) => ({ ...prev, category: categoryFromUrl }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (hasActiveFilters()) {
      fetchFilteredTasks(currentPage);
    } else {
      fetchTasks();
    }
    fetchCategories();
    fetchStatistics();
  }, [currentPage, pageSize, filters.category]);

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

  const debouncedSearch = useCallback(
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
    [filters]
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
    _event: React.ChangeEvent<unknown>,
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

  const handleQuickComplete = async (task: Task) => {
    try {
      const newStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
      const updated = await taskService.updateTask(task.id, {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: newStatus,
        isUrgent: task.isUrgent,
        isImportant: task.isImportant,
        categoryId: task.category?.id,
      });
      setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
      fetchStatistics();
    } catch (err) {
      console.error("Failed to update task:", err);
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

  const handleAIBreakdownClick = (task: Task) => {
    setTaskForBreakdown(task);
    setAiBreakdownOpen(true);
  };

  const handleAIBreakdownClose = () => {
    setAiBreakdownOpen(false);
    setTaskForBreakdown(undefined);
  };

  const handleCreateSubtasks = async (subtasks: TaskRequest[]) => {
    try {
      for (const subtask of subtasks) {
        await taskService.createTask(subtask);
      }
      if (hasActiveFilters()) {
        fetchFilteredTasks(currentPage);
      } else {
        fetchTasks();
      }
      fetchStatistics();

      alert(`Successfully created ${subtasks.length} subtasks!`);
    } catch (err: any) {
      console.error("Failed to create subtasks:", err);
      throw err;
    }
  };

  const getPageRange = () => {
    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, totalElements);
    return { start, end };
  };

  const { start, end } = getPageRange();

  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "date":
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

      case "priority":
        return (
          getPriorityLevel(b.isUrgent, b.isImportant) -
          getPriorityLevel(a.isUrgent, a.isImportant)
        );

      case "status":
        const statusOrder = { TODO: 1, IN_PROGRESS: 2, COMPLETED: 3 };
        return statusOrder[a.status] - statusOrder[b.status];

      default:
        return 0;
    }
  });

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
      {/* Compact Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Tasks
          </Typography>
        </Box>

        <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 20 }} />
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
            sx={{ width: 180 }}
          />
          <TextField
            select
            size="small"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "date" | "priority" | "status")
            }
            sx={{ width: 120 }}
          >
            <MenuItem value="date">Due Date</MenuItem>
            <MenuItem value="priority">Priority</MenuItem>
            <MenuItem value="status">Status</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            size="small"
          >
            Add Task
          </Button>
        </Box>
      </Box>

      {/* Stat Pills + AI Briefing Row */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ flex: { xs: "1", md: "0 0 auto" } }}>
          <StatPills stats={stats} loading={statsLoading} />
        </Box>
      </Box>

      {/* AI Briefing */}
      <Box mb={3}>
        <CompactBriefing />
      </Box>

      {/* Filters */}
      <TaskFilters
        filters={filters}
        categories={categories}
        onFilterChange={handleFilterChange}
      />

      {/* Pagination Info */}
      {!searchTerm && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="body2" color="text.secondary">
            {start}-{end} of {totalElements}
            {hasActiveFilters() && " (filtered)"}
          </Typography>
          <TextField
            select
            size="small"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(0);
            }}
            sx={{ width: 80 }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </TextField>
        </Box>
      )}

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <EmptyState
          title={
            searchTerm || hasActiveFilters()
              ? "No tasks match your criteria"
              : "No tasks yet"
          }
          description={
            !searchTerm && !hasActiveFilters()
              ? "Create your first task to get started!"
              : undefined
          }
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {sortedTasks.map((task) => (
            <Paper
              key={task.id}
              sx={{
                p: 2,
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                transition: "all 0.2s ease",
                opacity: task.status === "COMPLETED" ? 0.7 : 1,
                "&:hover": {
                  boxShadow: `0 4px 12px ${alpha(
                    theme.palette.primary.main,
                    0.12
                  )}`,
                },
              }}
            >
              {/* Quick Complete Checkbox */}
              <Checkbox
                checked={task.status === "COMPLETED"}
                onChange={() => handleQuickComplete(task)}
                sx={{
                  p: 0.5,
                  color: task.status === "COMPLETED" ? "success.main" : "action.active",
                  "&.Mui-checked": {
                    color: "success.main",
                  },
                }}
              />

              {/* Task Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{
                      textDecoration:
                        task.status === "COMPLETED" ? "line-through" : "none",
                      color:
                        task.status === "COMPLETED"
                          ? "text.secondary"
                          : "text.primary",
                    }}
                  >
                    {task.title}
                  </Typography>
                </Box>

                {task.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {task.description}
                  </Typography>
                )}

                <Box display="flex" gap={0.75} flexWrap="wrap" alignItems="center">
                  <Chip
                    label={task.status.replace("_", " ")}
                    color={getStatusColor(task.status)}
                    size="small"
                    sx={{ fontSize: "0.7rem", height: 22 }}
                  />
                  {task.isUrgent && (
                    <Chip
                      label="Urgent"
                      size="small"
                      sx={{
                        fontSize: "0.7rem",
                        height: 22,
                        bgcolor: alpha("#EF4444", 0.1),
                        color: "#EF4444",
                        border: `1px solid ${alpha("#EF4444", 0.3)}`,
                      }}
                    />
                  )}
                  {task.isImportant && (
                    <Chip
                      label="Important"
                      size="small"
                      sx={{
                        fontSize: "0.7rem",
                        height: 22,
                        bgcolor: alpha("#F59E0B", 0.1),
                        color: "#F59E0B",
                        border: `1px solid ${alpha("#F59E0B", 0.3)}`,
                      }}
                    />
                  )}
                  {task.category && (
                    <Chip
                      label={`${task.category.icon || ""} ${task.category.name}`}
                      size="small"
                      sx={{
                        fontSize: "0.7rem",
                        height: 22,
                        bgcolor: alpha(task.category.color, 0.1),
                        color: task.category.color,
                      }}
                    />
                  )}
                  {task.dueDate && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 0.5 }}
                    >
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Actions */}
              <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                <IconButton
                  onClick={() => handleAIBreakdownClick(task)}
                  size="small"
                  sx={{
                    color: "#9333EA",
                    "&:hover": { bgcolor: alpha("#9333EA", 0.1) },
                  }}
                  title="AI Breakdown"
                >
                  <AutoAwesomeIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleOpenModal(task)}
                  size="small"
                  sx={{
                    color: theme.palette.primary.main,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleDeleteClick(task.id!)}
                  size="small"
                  sx={{
                    color: "#EF4444",
                    "&:hover": { bgcolor: alpha("#EF4444", 0.1) },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Pagination */}
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

      {/* Delete Dialog */}
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

      {/* Task Form Modal */}
      <TaskFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        task={editingTask}
      />

      {/* AI Breakdown Modal */}
      {taskForBreakdown && (
        <AITaskBreakdown
          task={taskForBreakdown}
          open={aiBreakdownOpen}
          onClose={handleAIBreakdownClose}
          onCreateSubtasks={handleCreateSubtasks}
        />
      )}
    </Box>
  );
};

export default Tasks;
