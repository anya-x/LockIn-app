// CSV Export functionality for analytics data

export const exportAnalyticsToCSV = (analytics: any[]) => {
  const headers = [
    "Date",
    "Tasks Created",
    "Tasks Completed",
    "Completion Rate",
    "Pomodoros",
    "Focus Minutes",
    "Break Minutes",
    "Productivity Score",
    "Burnout Risk",
    "Morning Focus",
    "Afternoon Focus",
    "Evening Focus",
    "Night Focus",
  ];

  const csvRows = [headers.join(",")];

  analytics.forEach((day) => {
    const row = [
      day.date,
      day.tasksCreated,
      day.tasksCompleted,
      day.completionRate.toFixed(2),
      day.pomodorosCompleted,
      day.focusMinutes,
      day.breakMinutes,
      day.productivityScore.toFixed(2),
      day.burnoutRiskScore.toFixed(2),
      day.morningFocusMinutes || 0,
      day.afternoonFocusMinutes || 0,
      day.eveningFocusMinutes || 0,
      day.nightFocusMinutes || 0,
    ];
    csvRows.push(row.join(","));
  });

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `analytics_export_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
