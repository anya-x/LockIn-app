import React from "react";
import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import { type Task } from "../services/taskService";

interface TaskStatsProps {
  tasks: Task[];
}

const TaskStats: React.FC<TaskStatsProps> = ({ tasks }) => {
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "TODO").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
    urgent: tasks.filter((t) => t.isUrgent).length,
    important: tasks.filter((t) => t.isImportant).length,
  };

  const statCards = [
    { label: "Total Tasks", value: stats.total, color: "#1976d2" },
    { label: "To Do", value: stats.todo, color: "#757575" },
    { label: "In Progress", value: stats.inProgress, color: "#ff9800" },
    { label: "Completed", value: stats.completed, color: "#4caf50" },
  ];

  return (
    <Box mb={3}>
      <Grid container spacing={2}>
        {statCards.map((stat) => (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  {stat.label}
                </Typography>
                <Typography variant="h4" sx={{ color: stat.color }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TaskStats;
