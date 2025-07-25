import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import type { Task } from "../types/task";
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
import { useCategories } from "../hooks/useCategories";
import { useMatrix, useUpdateTaskQuadrant } from "../hooks/useMatrix";
import PageHeader from "../components/shared/PageHeader";

const Matrix: React.FC = () => {
  const theme = useTheme();
  const { data: matrix, isLoading: loading } = useMatrix();
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const updateQuadrantMutation = useUpdateTaskQuadrant();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    "all"
  );

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

  const filterByCategory = (tasks: Task[]): Task[] => {
    if (selectedCategory === "all") {
      return tasks;
    }

    const categoryId =
      typeof selectedCategory === "number"
        ? selectedCategory
        : parseInt(selectedCategory);

    return tasks.filter((task) => task.category?.id === categoryId);
  };

  interface DroppableQuadrantProps {
    id: string;
    title: string;
    subtitle: string;
    tasks: Task[];
    color: string;
    borderColor: string;
  }

  const DroppableQuadrant: React.FC<DroppableQuadrantProps> = ({
    id,
    title,
    subtitle,
    tasks,
    color,
    borderColor,
  }) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
      <Paper
        ref={setNodeRef}
        sx={{
          p: 3,
          minHeight: { xs: 200, md: 320 },
          backgroundColor: isOver
            ? alpha(borderColor, 0.15)
            : alpha(borderColor, 0.04),
          border: `2px solid ${isOver ? borderColor : alpha(borderColor, 0.2)}`,
          borderRadius: 3,
          transition: "all 0.3s ease",
          "&:hover": {
            borderColor: alpha(borderColor, 0.4),
            boxShadow: `0 4px 12px ${alpha(borderColor, 0.15)}`,
          },
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2.5}
        >
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.8125rem" }}
            >
              {subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: borderColor,
              color: "white",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "0.875rem",
              boxShadow: `0 2px 8px ${alpha(borderColor, 0.3)}`,
            }}
          >
            {tasks.length}
          </Box>
        </Box>

        <Box>
          {tasks.length === 0 ? (
            <Box
              sx={{
                py: 4,
                textAlign: "center",
                color: "text.secondary",
                borderRadius: 2,
                backgroundColor: alpha(borderColor, 0.02),
                border: `1px dashed ${alpha(borderColor, 0.2)}`,
              }}
            >
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                No tasks in this quadrant
              </Typography>
            </Box>
          ) : (
            tasks.map((task) => <DraggableTask key={task.id} task={task} />)
          )}
        </Box>
      </Paper>
    );
  };

  interface DraggableTaskProps {
    task: Task;
  }

  const DraggableTask: React.FC<DraggableTaskProps> = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: task.id!,
      });

    const style = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.6 : 1,
    };

    return (
      <Paper
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        sx={{
          p: 2,
          mb: 1.5,
          cursor: isDragging ? "grabbing" : "grab",
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          borderRadius: 2,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
            transform: "translateY(-2px)",
            borderColor: alpha(theme.palette.primary.main, 0.3),
          },
        }}
      >
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ mb: task.dueDate ? 0.5 : 0 }}
        >
          {task.title}
        </Typography>
        {task.dueDate && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.75rem" }}
            >
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const MatrixSkeleton = () => (
    <Paper sx={{ p: 2, minHeight: { xs: 200, md: 300 } }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Box>
          <Skeleton variant="text" width={150} height={32} />
          <Skeleton variant="text" width={120} height={20} />
        </Box>
        <Skeleton variant="circular" width={32} height={32} />
      </Box>
      <Box>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={60}
            sx={{ mb: 1, borderRadius: 1 }}
          />
        ))}
      </Box>
    </Paper>
  );

  if (loading) {
    return (
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            <Skeleton variant="text" width={250} height={48} />
            <Skeleton variant="text" width={300} height={24} />
          </Box>
          <Skeleton variant="rectangular" width={220} height={40} />
        </Box>

        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, md: 6 }} key={i}>
              <MatrixSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!matrix) {
    return <Typography>Error loading matrix</Typography>;
  }

  const quadrants = [
    {
      id: "doFirst",
      title: "🔥 Do First",
      subtitle: "Urgent & Important",
      tasks: filterByCategory(matrix.doFirst),
      color: alpha("#EF4444", 0.05),
      borderColor: "#EF4444",
    },
    {
      id: "schedule",
      title: "📅 Schedule",
      subtitle: "Not Urgent & Important",
      tasks: filterByCategory(matrix.schedule),
      color: alpha("#3B82F6", 0.05),
      borderColor: "#3B82F6",
    },
    {
      id: "delegate",
      title: "👥 Delegate",
      subtitle: "Urgent & Not Important",
      tasks: filterByCategory(matrix.delegate),
      color: alpha("#F59E0B", 0.05),
      borderColor: "#F59E0B",
    },
    {
      id: "eliminate",
      title: "🗑️ Eliminate",
      subtitle: "Not Urgent & Not Important",
      tasks: filterByCategory(matrix.eliminate),
      color: alpha("#8B5CF6", 0.05),
      borderColor: "#8B5CF6",
    },
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box>
        <PageHeader
          title="Eisenhower Matrix"
          subtitle="Organize your tasks by urgency and importance"
          action={
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Chip
                label="Showing incomplete tasks only"
                size="small"
                color="info"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
              <FormControl sx={{ minWidth: 220 }} size="small">
                <InputLabel id="category-filter-label">
                  Filter by Category
                </InputLabel>
                <Select
                  labelId="category-filter-label"
                  value={selectedCategory}
                  label="Filter by Category"
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCategory(
                      value === "all" ? "all" : Number(value)
                    );
                  }}
                  disabled={categoriesLoading}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categoriesLoading ? (
                    <MenuItem disabled>Loading categories...</MenuItem>
                  ) : (
                    categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Box>
          }
        />

        <Grid container spacing={3}>
          {quadrants.map((quadrant) => (
            <Grid size={{ xs: 12, md: 6 }} key={quadrant.id}>
              <DroppableQuadrant
                id={quadrant.id}
                title={quadrant.title}
                subtitle={quadrant.subtitle}
                tasks={quadrant.tasks}
                color={quadrant.color}
                borderColor={quadrant.borderColor}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <DragOverlay>
        {activeId ? (
          <Paper
            sx={{
              p: 2,
              opacity: 0.8,
              cursor: "grabbing",
              boxShadow: `0 8px 24px ${alpha(
                theme.palette.primary.main,
                0.25
              )}`,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ mb: getActiveTask()?.dueDate ? 0.5 : 0 }}
            >
              {getActiveTask()?.title || "Task"}
            </Typography>
            {getActiveTask()?.dueDate && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.75rem" }}
              >
                Due: {new Date(getActiveTask()?.dueDate!).toLocaleDateString()}
              </Typography>
            )}
          </Paper>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Matrix;
