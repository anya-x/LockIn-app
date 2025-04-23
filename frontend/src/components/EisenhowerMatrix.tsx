import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Grid, CircularProgress } from "@mui/material";
import type { Task } from "../types/task";
import api from "../services/api";

interface MatrixData {
  doFirst: Task[];
  schedule: Task[];
  delegate: Task[];
  eliminate: Task[];
}

const EisenhowerMatrix: React.FC = () => {
  const [matrix, setMatrix] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);

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
      title: "Do First",
      subtitle: "Urgent & Important",
      tasks: matrix.doFirst,
      color: "#ffebee",
      borderColor: "#f44336",
    },
    {
      title: "Schedule",
      subtitle: "Not Urgent & Important",
      tasks: matrix.schedule,
      color: "#e3f2fd",
      borderColor: "#2196f3",
    },
    {
      title: "Delegate",
      subtitle: "Urgent & Not Important",
      tasks: matrix.delegate,
      color: "#fff3e0",
      borderColor: "#ff9800",
    },
    {
      title: "Eliminate",
      subtitle: "Not Urgent & Not Important",
      tasks: matrix.eliminate,
      color: "#f3e5f5",
      borderColor: "#9c27b0",
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Eisenhower Matrix
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Organise your tasks by urgency and importance
      </Typography>

      <Grid container spacing={2}>
        {quadrants.map((quadrant, index) => (
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{
                p: 2,
                minHeight: 300,
                backgroundColor: quadrant.color,
                borderLeft: `4px solid ${quadrant.borderColor}`,
              }}
            >
              <Typography variant="h6" gutterBottom>
                {quadrant.title}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={2}
              >
                {quadrant.subtitle}
              </Typography>

              <Box>
                {quadrant.tasks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No tasks in this quadrant
                  </Typography>
                ) : (
                  quadrant.tasks.map((task) => (
                    <Paper
                      key={task.id}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        cursor: "pointer",
                        "&:hover": {
                          boxShadow: 2,
                        },
                      }}
                    >
                      <Typography variant="body2">{task.title}</Typography>
                      {task.dueDate && (
                        <Typography variant="caption" color="text.secondary">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </Paper>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default EisenhowerMatrix;
