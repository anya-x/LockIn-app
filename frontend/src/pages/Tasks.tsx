import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Checkbox,
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
  Paper,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  AutoAwesome as AutoAwesomeIcon,
  CheckBoxOutlineBlank as UncheckedIcon,
  IndeterminateCheckBox as InProgressIcon,
  CheckBox as CheckedIcon,
  ArrowUpward as AscIcon,
  ArrowDownward as DescIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
} from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import { debounce } from "lodash";
import { taskService, type TaskStatistics } from "../services/taskService";
import { categoryService, type Category } from "../services/categoryService";
import TaskFilters from "../components/tasks/TaskFilters";
import StatPills from "../components/shared/StatPills";
import type { FilterState, Task, TaskRequest, SortField, SortDirection } from "../types/task";
import TaskFormModal from "../components/tasks/TaskFormModal";
import AITaskBreakdown from "../components/ai/AITaskBreakdown";
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
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [aiBreakdownOpen, setAiBreakdownOpen] = useState(false);
  const [taskForBreakdown, setTaskForBreakdown] = useState<Task | undefined>(
    undefined
  );
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
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
    priority: "all",
    hideCompleted: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);

  /**
   * Check if any filters are active (excluding hideCompleted which is applied client-side)
   * Used to determine if we need to call the filter API endpoint
   */
  const hasActiveFilters = () => {
    return (
      filters.status !== "all" ||
      filters.category !== "all" ||
      filters.urgent !== "all" ||
      filters.important !== "all" ||
      filters.priority !== "all"
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

  // Cycle through: TODO → IN_PROGRESS → COMPLETED → TODO (skips ARCHIVED)
  const handleStatusCycle = async (task: Task) => {
    // Don't cycle archived tasks
    if (task.status === "ARCHIVED") return;

    try {
      let newStatus: "TODO" | "IN_PROGRESS" | "COMPLETED";
      switch (task.status) {
        case "TODO":
          newStatus = "IN_PROGRESS";
          break;
        case "IN_PROGRESS":
          newStatus = "COMPLETED";
          break;
        case "COMPLETED":
          newStatus = "TODO";
          break;
        default:
          newStatus = "TODO";
      }

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

  const handleArchiveTask = async (task: Task) => {
    try {
      const newStatus = task.status === "ARCHIVED" ? "COMPLETED" : "ARCHIVED";
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
      console.error("Failed to archive/unarchive task:", err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return <InProgressIcon sx={{ fontSize: 22 }} />;
      case "COMPLETED":
        return <CheckedIcon sx={{ fontSize: 22 }} />;
      case "ARCHIVED":
        return <ArchiveIcon sx={{ fontSize: 22 }} />;
      default:
        return <UncheckedIcon sx={{ fontSize: 22 }} />;
    }
  };

  const getStatusIconColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "warning.main";
      case "COMPLETED":
        return "success.main";
      case "ARCHIVED":
        return "text.disabled";
      default:
        return "action.active";
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

  // Bulk selection handlers
  const handleToggleTaskSelection = (taskId: number) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const visibleTaskIds = processedTasks.map((t) => t.id);
    setSelectedTaskIds(new Set(visibleTaskIds));
  };

  const handleDeselectAll = () => {
    setSelectedTaskIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.size === 0) return;

    try {
      // Delete all selected tasks
      const deletePromises = Array.from(selectedTaskIds).map((id) =>
        taskService.deleteTask(id)
      );
      await Promise.all(deletePromises);

      // Clear selection and refresh
      setSelectedTaskIds(new Set());
      setBulkDeleteDialogOpen(false);

      if (hasActiveFilters()) {
        fetchFilteredTasks(currentPage);
      } else {
        fetchTasks();
      }
      fetchStatistics();
    } catch (err) {
      console.error("Failed to delete tasks:", err);
      alert("Failed to delete some tasks. Please try again.");
    }
  };

  const handleBulkMarkComplete = async () => {
    if (selectedTaskIds.size === 0) return;

    try {
      const updatePromises = Array.from(selectedTaskIds).map((id) => {
        const task = tasks.find((t) => t.id === id);
        if (!task) return Promise.resolve();
        return taskService.updateTask(id, {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: "COMPLETED",
          isUrgent: task.isUrgent,
          isImportant: task.isImportant,
          categoryId: task.category?.id,
        });
      });
      await Promise.all(updatePromises);

      setSelectedTaskIds(new Set());
      if (hasActiveFilters()) {
        fetchFilteredTasks(currentPage);
      } else {
        fetchTasks();
      }
      fetchStatistics();
    } catch (err) {
      console.error("Failed to update tasks:", err);
      alert("Failed to update some tasks. Please try again.");
    }
  };

  const handleBulkArchive = async () => {
    if (selectedTaskIds.size === 0) return;

    try {
      const updatePromises = Array.from(selectedTaskIds).map((id) => {
        const task = tasks.find((t) => t.id === id);
        if (!task) return Promise.resolve();
        return taskService.updateTask(id, {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          status: "ARCHIVED",
          isUrgent: task.isUrgent,
          isImportant: task.isImportant,
          categoryId: task.category?.id,
        });
      });
      await Promise.all(updatePromises);

      setSelectedTaskIds(new Set());
      if (hasActiveFilters()) {
        fetchFilteredTasks(currentPage);
      } else {
        fetchTasks();
      }
      fetchStatistics();
    } catch (err) {
      console.error("Failed to archive tasks:", err);
      alert("Failed to archive some tasks. Please try again.");
    }
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

  /**
   * Toggle sort direction when clicking on current sort field
   * or set to ascending when switching to a new field
   */
  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  /**
   * Apply client-side sorting and filtering
   * Server handles pagination and main filters, client handles sort direction and hideCompleted
   */
  const processedTasks = React.useMemo(() => {
    // First apply hideCompleted filter
    let result = filters.hideCompleted
      ? tasks.filter((task) => task.status !== "COMPLETED")
      : [...tasks];

    // Then apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;

        case "priority":
          comparison = getPriorityLevel(b.isUrgent, b.isImportant) -
                       getPriorityLevel(a.isUrgent, a.isImportant);
          break;

        case "status":
          const statusOrder: Record<string, number> = { TODO: 1, IN_PROGRESS: 2, COMPLETED: 3, ARCHIVED: 4 };
          comparison = (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
          break;

        case "title":
          comparison = a.title.localeCompare(b.title);
          break;

        case "created":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;

        default:
          comparison = 0;
      }

      // Apply sort direction
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [tasks, sortField, sortDirection, filters.hideCompleted]);

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

          {/* Sort Controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TextField
              select
              size="small"
              value={sortField}
              onChange={(e) => handleSortChange(e.target.value as SortField)}
              sx={{ width: 120 }}
            >
              <MenuItem value="date">Due Date</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="status">Status</MenuItem>
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="created">Created</MenuItem>
            </TextField>
            <Tooltip title={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}>
              <IconButton
                size="small"
                onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  p: 0.75,
                }}
              >
                {sortDirection === "asc" ? (
                  <AscIcon sx={{ fontSize: 18 }} />
                ) : (
                  <DescIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>

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

      {/* Stat Pills */}
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

      {/* Filters */}
      <TaskFilters
        filters={filters}
        categories={categories}
        onFilterChange={handleFilterChange}
      />

      {/* Bulk Action Bar */}
      {selectedTaskIds.size > 0 && (
        <Paper
          sx={{
            p: 1.5,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <Checkbox
            checked={selectedTaskIds.size === processedTasks.length && processedTasks.length > 0}
            indeterminate={selectedTaskIds.size > 0 && selectedTaskIds.size < processedTasks.length}
            onChange={(e) => (e.target.checked ? handleSelectAll() : handleDeselectAll())}
            size="small"
          />
          <Typography variant="body2" fontWeight={500}>
            {selectedTaskIds.size} selected
          </Typography>

          <Box sx={{ flex: 1 }} />

          <Button
            size="small"
            variant="outlined"
            onClick={handleBulkMarkComplete}
            sx={{ textTransform: "none" }}
          >
            Mark Complete
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={handleBulkArchive}
            startIcon={<ArchiveIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: "none" }}
          >
            Archive
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => setBulkDeleteDialogOpen(true)}
            sx={{ textTransform: "none" }}
          >
            Delete
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={handleDeselectAll}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Clear
          </Button>
        </Paper>
      )}

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
      {processedTasks.length === 0 ? (
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
          {processedTasks.map((task) => (
            <Paper
              key={task.id}
              sx={{
                p: 2,
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                transition: "all 0.2s ease",
                opacity: task.status === "COMPLETED" ? 0.7 : 1,
                bgcolor: selectedTaskIds.has(task.id)
                  ? alpha(theme.palette.primary.main, 0.04)
                  : undefined,
                border: selectedTaskIds.has(task.id)
                  ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  : `1px solid transparent`,
                "&:hover": {
                  boxShadow: `0 4px 12px ${alpha(
                    theme.palette.primary.main,
                    0.12
                  )}`,
                },
              }}
            >
              {/* Selection Checkbox */}
              <Checkbox
                checked={selectedTaskIds.has(task.id)}
                onChange={() => handleToggleTaskSelection(task.id)}
                size="small"
                sx={{ p: 0.5, mt: -0.25 }}
              />

              {/* Status Toggle - cycles through TODO → IN_PROGRESS → COMPLETED */}
              <Tooltip
                title={
                  task.status === "TODO"
                    ? "Click to start"
                    : task.status === "IN_PROGRESS"
                    ? "Click to complete"
                    : "Click to reopen"
                }
                placement="top"
              >
                <IconButton
                  size="small"
                  onClick={() => handleStatusCycle(task)}
                  sx={{
                    p: 0.5,
                    color: getStatusIconColor(task.status),
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  {getStatusIcon(task.status)}
                </IconButton>
              </Tooltip>

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
                {task.status !== "ARCHIVED" && (
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
                )}
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
                <Tooltip title={task.status === "ARCHIVED" ? "Unarchive" : "Archive"}>
                  <IconButton
                    onClick={() => handleArchiveTask(task)}
                    size="small"
                    sx={{
                      color: task.status === "ARCHIVED" ? "#10B981" : "text.secondary",
                      "&:hover": { bgcolor: alpha(task.status === "ARCHIVED" ? "#10B981" : "#6B7280", 0.1) },
                    }}
                  >
                    {task.status === "ARCHIVED" ? (
                      <UnarchiveIcon fontSize="small" />
                    ) : (
                      <ArchiveIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
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

      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete {selectedTaskIds.size} Tasks?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedTaskIds.size} selected task
            {selectedTaskIds.size === 1 ? "" : "s"}? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkDelete} color="error" variant="contained">
            Delete {selectedTaskIds.size} Task{selectedTaskIds.size === 1 ? "" : "s"}
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
