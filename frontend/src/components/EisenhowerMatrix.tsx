import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Grid, CircularProgress } from "@mui/material";
import type { Task } from "../types/task";
import api from "../services/api";
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

interface MatrixData {
  doFirst: Task[];
  schedule: Task[];
  delegate: Task[];
  eliminate: Task[];
}

const EisenhowerMatrix: React.FC = () => {
  const [matrix, setMatrix] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    try {
      const response = await api.get("/tasks/matrix");
      setMatrix(response.data);
    } catch (error) {
      console.error("Error fetching matrix:", error);
    } finally {
      setLoading(false);
    }
  };

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
      await api.patch(`/tasks/${taskId}/quadrant`, null, {
        params: { isUrgent, isImportant },
      });

      await fetchMatrix();
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
          p: 2,
          minHeight: { xs: 200, md: 300 },
          backgroundColor: isOver ? "#e0e0e0" : color,
          borderLeft: `4px solid ${borderColor}`,
          transition: "background-color 0.2s",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box>
            <Typography variant="h6" sx={{ mb: 0 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: borderColor,
              color: "white",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "0.875rem",
            }}
          >
            {tasks.length}
          </Box>
        </Box>

        <Box>
          {tasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No tasks in this quadrant
            </Typography>
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
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <Paper
        ref={setNodeRef}
        style={style}
        // @ts-ignore
        {...listeners}
        // @ts-ignore
        {...attributes}
        sx={{
          p: 1.5,
          mb: 1,
          cursor: isDragging ? "grabbing" : "grab",
          "&:hover": {
            boxShadow: 3,
            transform: "translateY(-3px)",
            transition: "all 0.2s ease-in-out",
          },
        }}
      >
        <Typography variant="body2" fontWeight="medium">
          {task.title}
        </Typography>
        {task.dueDate && (
          <Typography variant="caption" color="text.secondary">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </Typography>
        )}
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
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
      tasks: matrix.doFirst,
      color: "#ffebee",
      borderColor: "#f44336",
    },
    {
      id: "schedule",
      title: "📅 Schedule",
      subtitle: "Not Urgent & Important",
      tasks: matrix.schedule,
      color: "#e3f2fd",
      borderColor: "#2196f3",
    },
    {
      id: "delegate",
      title: "👥 Delegate",
      subtitle: "Urgent & Not Important",
      tasks: matrix.delegate,
      color: "#fff3e0",
      borderColor: "#ff9800",
    },
    {
      id: "eliminate",
      title: "🗑️ Eliminate",
      subtitle: "Not Urgent & Not Important",
      tasks: matrix.eliminate,
      color: "#f3e5f5",
      borderColor: "#9c27b0",
    },
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Eisenhower Matrix
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Organise your tasks by urgency and importance
        </Typography>

        <Grid container spacing={2}>
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
              p: 1.5,
              opacity: 0.5,
              cursor: "grabbing",
              boxShadow: 4,
              backgroundColor: "white",
            }}
          >
            <Typography variant="body2" fontWeight="medium">
              {getActiveTask()?.title || "Task"}
            </Typography>
            {getActiveTask()?.dueDate && (
              <Typography variant="caption" color="text.secondary">
                Due: {new Date(getActiveTask()?.dueDate!).toLocaleDateString()}
              </Typography>
            )}
          </Paper>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default EisenhowerMatrix;
