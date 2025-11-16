// Dark mode adjustments for charts

export const getChartTheme = (isDarkMode: boolean) => {
  if (isDarkMode) {
    return {
      backgroundColor: "#1e1e1e",
      textColor: "#e0e0e0",
      gridColor: "#404040",
      tooltipBg: "#2d2d2d",
      colors: {
        productivity: "#4CAF50",
        focusTime: "#2196F3",
        tasks: "#FF9800",
        burnoutRisk: "#F44336",
        breaks: "#9C27B0",
      },
    };
  } else {
    return {
      backgroundColor: "#ffffff",
      textColor: "#333333",
      gridColor: "#e0e0e0",
      tooltipBg: "#ffffff",
      colors: {
        productivity: "#2E7D32",
        focusTime: "#1565C0",
        tasks: "#F57C00",
        burnoutRisk: "#C62828",
        breaks: "#6A1B9A",
      },
    };
  }
};

export const applyDarkModeToChart = (chartOptions: any, isDarkMode: boolean) => {
  const theme = getChartTheme(isDarkMode);

  return {
    ...chartOptions,
    backgroundColor: theme.backgroundColor,
    scales: {
      ...chartOptions.scales,
      x: {
        ...chartOptions.scales?.x,
        grid: {
          color: theme.gridColor,
        },
        ticks: {
          color: theme.textColor,
        },
      },
      y: {
        ...chartOptions.scales?.y,
        grid: {
          color: theme.gridColor,
        },
        ticks: {
          color: theme.textColor,
        },
      },
    },
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins?.legend,
        labels: {
          color: theme.textColor,
        },
      },
      tooltip: {
        ...chartOptions.plugins?.tooltip,
        backgroundColor: theme.tooltipBg,
        titleColor: theme.textColor,
        bodyColor: theme.textColor,
        borderColor: theme.gridColor,
        borderWidth: 1,
      },
    },
  };
};
