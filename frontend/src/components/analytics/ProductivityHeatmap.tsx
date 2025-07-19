import React from "react";
import { Box, Paper, Typography, Tooltip, useTheme } from "@mui/material";
import { useAnalyticsRange } from "../../hooks/useAnalytics";

const ProductivityHeatmap: React.FC = () => {
  const theme = useTheme();
  const { data: rangeData } = useAnalyticsRange(84);

  if (!rangeData || rangeData.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Activity Heatmap
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Not enough data yet. Keep working to see your activity pattern!
        </Typography>
      </Paper>
    );
  }

  const weeks: (typeof rangeData)[] = [];
  for (let i = 0; i < rangeData.length; i += 7) {
    weeks.push(rangeData.slice(i, i + 7));
  }

  const getColor = (score: number): string => {
    const isDark = theme.palette.mode === "dark";
    if (score === 0) return isDark ? "#1a1a1a" : "#ebedf0";
    if (score < 30) return isDark ? "#0e4429" : "#9be9a8";
    if (score < 50) return isDark ? "#006d32" : "#40c463";
    if (score < 70) return isDark ? "#26a641" : "#30a14e";
    return isDark ? "#39d353" : "#216e39";
  };

  const cellSize = 12;
  const cellGap = 3;
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Activity Heatmap (Last 12 Weeks)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your productivity pattern over time
      </Typography>

      <Box sx={{ overflowX: "auto", pb: 2 }}>
        <Box display="flex" gap={`${cellGap}px`}>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="space-around"
            mr={1}
          >
            {dayLabels.map((label, idx) => (
              <Typography
                key={label}
                variant="caption"
                color="text.secondary"
                sx={{
                  height: `${cellSize}px`,
                  lineHeight: `${cellSize}px`,
                  fontSize: "10px",
                  visibility: idx % 2 === 0 ? "visible" : "hidden",
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>

          {weeks.map((week, weekIdx) => (
            <Box
              key={weekIdx}
              display="flex"
              flexDirection="column"
              gap={`${cellGap}px`}
            >
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const day = week[dayIdx];
                const score = day ? day.productivityScore : 0;
                const tasks = day ? day.tasksCompleted : 0;
                const focusMinutes = day ? day.focusMinutes : 0;

                return (
                  <Tooltip
                    key={dayIdx}
                    title={
                      day ? (
                        <Box>
                          <Typography variant="caption" display="block">
                            {new Date(day.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Score: {day.productivityScore.toFixed(0)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Tasks: {tasks}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Focus: {Math.floor(focusMinutes / 60)}h{" "}
                            {focusMinutes % 60}m
                          </Typography>
                        </Box>
                      ) : (
                        "No data"
                      )
                    }
                    arrow
                  >
                    <Box
                      sx={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        backgroundColor: day
                          ? getColor(score)
                          : theme.palette.action.disabledBackground,
                        borderRadius: "2px",
                        cursor: day ? "pointer" : "default",
                        transition: "transform 0.1s, box-shadow 0.1s",
                        "&:hover": day
                          ? {
                              transform: "scale(1.2)",
                              boxShadow: theme.shadows[4],
                              zIndex: 1,
                            }
                          : {},
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>

        <Box display="flex" alignItems="center" gap={1} mt={2}>
          <Typography variant="caption" color="text.secondary">
            Less
          </Typography>
          {[0, 25, 45, 65, 85].map((score) => (
            <Box
              key={score}
              sx={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                backgroundColor: getColor(score),
                borderRadius: "2px",
              }}
            />
          ))}
          <Typography variant="caption" color="text.secondary">
            More
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default ProductivityHeatmap;
