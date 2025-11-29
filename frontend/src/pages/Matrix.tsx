import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Skeleton,
  Chip,
  useTheme,
  alpha,
  Stack,
  IconButton,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import {
  KeyboardArrowUp as ScrollUpIcon,
  KeyboardArrowDown as ScrollDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import type { Task, TaskRequest } from "../types/task";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { useMatrix, useUpdateTaskQuadrant } from "../hooks/useMatrix";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "../services/taskService";
import TaskFormModal from "../components/tasks/TaskFormModal";

const Matrix: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { data: matrix, isLoading: loading } = useMatrix();
  const updateQuadrantMutation = useUpdateTaskQuadrant();

  const [activeId, setActiveId] = useState<number | null>(null);

  // Edit/Delete state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Mutations for task operations
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskRequest }) =>
      taskService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matrix"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matrix"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Task action handlers
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleSaveTask = async (taskData: TaskRequest) => {
    if (!editingTask) return;
    await updateTaskMutation.mutateAsync({ id: editingTask.id, data: taskData });
    setEditingTask(null);
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    await deleteTaskMutation.mutateAsync(taskToDelete.id);
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !matrix) {
      setActiveId(null);
      return;
    }

    const taskId = active.id as number;
    const targetQuadrant = over.id as string;

    let isUrgent: boolean;
    let isImportant: boolean;

    switch (targetQuadrant) {
      case "doFirst":
        isUrgent = true;
        isImportant = true;
        break;
      case "schedule":
        isUrgent = false;
        isImportant = true;
        break;
      case "delegate":
        isUrgent = true;
        isImportant = false;
        break;
      case "eliminate":
        isUrgent = false;
        isImportant = false;
        break;
      default:
        setActiveId(null);
        return;
    }

    try {
      await updateQuadrantMutation.mutateAsync({
        taskId,
        isUrgent,
        isImportant,
      });
    } catch (error) {
      console.error("Error updating task quadrant:", error);
    } finally {
      setActiveId(null);
    }
  };

  const getActiveTask = (): Task | undefined => {
    if (!activeId || !matrix) return undefined;

    const allTasks = [
      ...matrix.doFirst,
      ...matrix.schedule,
      ...matrix.delegate,
      ...matrix.eliminate,
    ];

    return allTasks.find((task) => task.id === activeId);
  };

  interface DroppableQuadrantProps {
    id: string;
    title: string;
    subtitle: string;
    tasks: Task[];
    borderColor: string;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  }

  const DroppableQuadrant: React.FC<DroppableQuadrantProps> = ({
    id,
    title,
    subtitle,
    tasks,
    borderColor,
    position,
  }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const checkScrollability = () => {
      const container = scrollContainerRef.current;
      if (container) {
        setCanScrollUp(container.scrollTop > 0);
        setCanScrollDown(
          container.scrollTop < container.scrollHeight - container.clientHeight - 5
        );
      }
    };

    const handleScroll = (direction: "up" | "down") => {
      const container = scrollContainerRef.current;
      if (container) {
        const scrollAmount = 120;
        container.scrollBy({
          top: direction === "up" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    };

    // Check scrollability after render
    React.useEffect(() => {
      checkScrollability();
    }, [tasks]);

    // Subtle internal borders to show 2x2 structure
    const getBorderStyles = () => {
      const borderStyle = `1px solid ${alpha(theme.palette.divider, 0.5)}`;
      switch (position) {
        case "top-left":
          return { borderRight: borderStyle, borderBottom: borderStyle };
        case "top-right":
          return { borderBottom: borderStyle };
        case "bottom-left":
          return { borderRight: borderStyle };
        case "bottom-right":
          return {};
        default:
          return {};
      }
    };

    const TASK_CONTAINER_HEIGHT = 220;

    return (
      <Box
        ref={setNodeRef}
        sx={{
          p: 2.5,
          height: { xs: "auto", md: 340 },
          minHeight: { xs: 200, md: 340 },
          maxHeight: { xs: 400, md: 340 },
          display: "flex",
          flexDirection: "column",
          backgroundColor: isOver
            ? alpha(borderColor, 0.08)
            : "transparent",
          transition: "all 0.2s ease",
          ...getBorderStyles(),
        }}
      >
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
          flexShrink={0}
        >
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: borderColor,
                mb: 0.25,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: alpha(borderColor, 0.1),
              color: borderColor,
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              fontWeight: 700,
              fontSize: "0.875rem",
            }}
          >
            {tasks.length}
          </Box>
        </Box>

        {/* Scrollable Tasks Container */}
        <Box sx={{ position: "relative", flex: 1, minHeight: 0 }}>
          {/* Scroll Up Button */}
          <Fade in={canScrollUp}>
            <IconButton
              size="small"
              onClick={() => handleScroll("up")}
              sx={{
                position: "absolute",
                top: -4,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                bgcolor: theme.palette.background.paper,
                boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.15)}`,
                border: `1px solid ${theme.palette.divider}`,
                width: 28,
                height: 28,
                "&:hover": {
                  bgcolor: theme.palette.background.paper,
                  boxShadow: `0 4px 12px ${alpha(borderColor, 0.2)}`,
                },
              }}
            >
              <ScrollUpIcon sx={{ fontSize: 18, color: borderColor }} />
            </IconButton>
          </Fade>

          {/* Tasks List */}
          <Box
            ref={scrollContainerRef}
            onScroll={checkScrollability}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              height: { xs: "auto", md: TASK_CONTAINER_HEIGHT },
              maxHeight: { xs: 280, md: TASK_CONTAINER_HEIGHT },
              overflowY: "auto",
              overflowX: "hidden",
              pr: 0.5,
              // Custom scrollbar
              "&::-webkit-scrollbar": {
                width: 6,
              },
              "&::-webkit-scrollbar-track": {
                bgcolor: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: alpha(borderColor, 0.2),
                borderRadius: 3,
                "&:hover": {
                  bgcolor: alpha(borderColor, 0.4),
                },
              },
            }}
          >
            {tasks.length === 0 ? (
              <Box
                sx={{
                  py: 3,
                  textAlign: "center",
                  color: "text.disabled",
                  borderRadius: 2,
                  border: `1px dashed ${alpha(borderColor, 0.2)}`,
                  backgroundColor: alpha(borderColor, 0.02),
                }}
              >
                <Typography variant="body2">
                  Drag tasks here
                </Typography>
              </Box>
            ) : (
              tasks.map((task) => (
                <DraggableTask
                  key={task.id}
                  task={task}
                  quadrantColor={borderColor}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteClick}
                />
              ))
            )}
          </Box>

          {/* Scroll Down Button */}
          <Fade in={canScrollDown}>
            <IconButton
              size="small"
              onClick={() => handleScroll("down")}
              sx={{
                position: "absolute",
                bottom: -4,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                bgcolor: theme.palette.background.paper,
                boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.15)}`,
                border: `1px solid ${theme.palette.divider}`,
                width: 28,
                height: 28,
                "&:hover": {
                  bgcolor: theme.palette.background.paper,
                  boxShadow: `0 4px 12px ${alpha(borderColor, 0.2)}`,
                },
              }}
            >
              <ScrollDownIcon sx={{ fontSize: 18, color: borderColor }} />
            </IconButton>
          </Fade>
        </Box>
      </Box>
    );
  };

  interface DraggableTaskProps {
    task: Task;
    quadrantColor: string;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
  }

  const DraggableTask: React.FC<DraggableTaskProps> = ({
    task,
    quadrantColor,
    onEdit,
    onDelete,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: task.id!,
      });

    const style = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.5 : 1,
    };

    // Prevent drag when clicking action buttons
    const handleActionClick = (
      e: React.MouseEvent,
      action: () => void
    ) => {
      e.stopPropagation();
      e.preventDefault();
      action();
    };

    return (
      <Paper
        ref={setNodeRef}
        style={style}
        elevation={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          p: 1.5,
          position: "relative",
          backgroundColor: theme.palette.background.paper,
          borderLeft: `3px solid ${quadrantColor}`,
          borderRadius: 1.5,
          transition: "all 0.15s ease",
          boxShadow: isDragging
            ? `0 8px 24px ${alpha(quadrantColor, 0.2)}`
            : `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
          "&:hover": {
            boxShadow: `0 4px 12px ${alpha(quadrantColor, 0.15)}`,
            transform: isDragging ? undefined : "translateY(-1px)",
          },
        }}
      >
        {/* Draggable area - only the content, not the action buttons */}
        <Box
          {...listeners}
          {...attributes}
          sx={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              mb: (task.dueDate || task.category) ? 0.75 : 0,
              lineHeight: 1.4,
              pr: isHovered ? 6 : 0,
            }}
          >
            {task.title}
          </Typography>

          {(task.dueDate || task.category) && (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {task.category && (
                <Chip
                  label={`${task.category.icon || ""} ${task.category.name}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    bgcolor: alpha(task.category.color, 0.1),
                    color: task.category.color,
                    fontWeight: 500,
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              )}
              {task.dueDate && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem" }}
                >
                  Due {new Date(task.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Typography>
              )}
            </Stack>
          )}
        </Box>

        {/* Hover action buttons */}
        <Fade in={isHovered && !isDragging}>
          <Box
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              display: "flex",
              gap: 0.25,
              bgcolor: theme.palette.background.paper,
              borderRadius: 1,
              boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.1)}`,
            }}
          >
            <IconButton
              size="small"
              onClick={(e) => handleActionClick(e, () => onEdit(task))}
              sx={{
                width: 24,
                height: 24,
                color: theme.palette.primary.main,
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
              }}
            >
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => handleActionClick(e, () => onDelete(task))}
              sx={{
                width: 24,
                height: 24,
                color: "#EF4444",
                "&:hover": { bgcolor: alpha("#EF4444", 0.1) },
              }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Fade>
      </Paper>
    );
  };

  const MatrixSkeleton = () => (
    <Box sx={{ p: 2.5 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box>
          <Skeleton variant="text" width={120} height={24} />
          <Skeleton variant="text" width={100} height={16} />
        </Box>
        <Skeleton variant="rounded" width={32} height={28} />
      </Box>
      <Box>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={52}
            sx={{ mb: 1, borderRadius: 1.5 }}
          />
        ))}
      </Box>
    </Box>
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
          <Skeleton variant="text" width={200} height={36} />
          <Skeleton variant="rounded" width={180} height={40} />
        </Box>

        <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Grid container>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 12, md: 6 }} key={i}>
                <MatrixSkeleton />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>
    );
  }

  if (!matrix) {
    return <Typography>Error loading matrix</Typography>;
  }

  const quadrants = [
    {
      id: "doFirst",
      title: "Do First",
      subtitle: "Urgent & Important",
      tasks: matrix.doFirst,
      borderColor: "#EF4444",
      position: "top-left" as const,
    },
    {
      id: "schedule",
      title: "Schedule",
      subtitle: "Important, Not Urgent",
      tasks: matrix.schedule,
      borderColor: "#3B82F6",
      position: "top-right" as const,
    },
    {
      id: "delegate",
      title: "Delegate",
      subtitle: "Urgent, Not Important",
      tasks: matrix.delegate,
      borderColor: "#F59E0B",
      position: "bottom-left" as const,
    },
    {
      id: "eliminate",
      title: "Eliminate",
      subtitle: "Neither Urgent nor Important",
      tasks: matrix.eliminate,
      borderColor: "#8B5CF6",
      position: "bottom-right" as const,
    },
  ];

  const totalTasks = quadrants.reduce((sum, q) => sum + q.tasks.length, 0);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight={700}>
            Eisenhower Matrix
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalTasks} incomplete {totalTasks === 1 ? "task" : "tasks"}
          </Typography>
        </Box>

        {/* Matrix Grid - wrapped in Paper for unified appearance */}
        <Paper
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Axis Labels */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              sx={{ letterSpacing: 1 }}
            >
              IMPORTANT →
            </Typography>
          </Box>

          <Box sx={{ display: "flex" }}>
            {/* Urgent Label (vertical) */}
            <Box
              sx={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: "rotate(180deg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 1.5,
                borderRight: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
                sx={{ letterSpacing: 1 }}
              >
                URGENT →
              </Typography>
            </Box>

            {/* Quadrants Grid */}
            <Box sx={{ flex: 1 }}>
              <Grid container>
                {quadrants.map((quadrant) => (
                  <Grid size={{ xs: 12, md: 6 }} key={quadrant.id}>
                    <DroppableQuadrant
                      id={quadrant.id}
                      title={quadrant.title}
                      subtitle={quadrant.subtitle}
                      tasks={quadrant.tasks}
                      borderColor={quadrant.borderColor}
                      position={quadrant.position}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          <Paper
            elevation={8}
            sx={{
              p: 1.5,
              cursor: "grabbing",
              backgroundColor: theme.palette.background.paper,
              borderRadius: 1.5,
              borderLeft: `3px solid ${theme.palette.primary.main}`,
              boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.25)}`,
              transform: "rotate(2deg)",
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              {getActiveTask()?.title || "Task"}
            </Typography>
            {getActiveTask()?.category && (
              <Chip
                label={`${getActiveTask()?.category?.icon || ""} ${getActiveTask()?.category?.name}`}
                size="small"
                sx={{
                  mt: 0.5,
                  height: 20,
                  fontSize: "0.7rem",
                }}
              />
            )}
          </Paper>
        ) : null}
      </DragOverlay>

      {/* Edit Task Modal */}
      <TaskFormModal
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTask}
        task={editingTask}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Task?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{taskToDelete?.title}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </DndContext>
  );
};

export default Matrix;
