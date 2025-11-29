import { createTheme, type Theme } from "@mui/material/styles";

export type ThemeMode = "light" | "dark";
export type ThemeColor = "indigo" | "pink" | "sage";

interface ThemeConfig {
  name: string;
  palette: {
    light: any;
    dark: any;
  };
}

const baseTypography = {
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  h1: {
    fontSize: "2.25rem",
    fontWeight: 600,
    letterSpacing: "-0.025em",
    lineHeight: 1.2,
  },
  h2: { fontSize: "1.875rem", fontWeight: 600, letterSpacing: "-0.025em" },
  h3: { fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.02em" },
  h4: { fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.02em" },
  h5: { fontSize: "1.125rem", fontWeight: 600 },
  h6: { fontSize: "1rem", fontWeight: 600 },
  body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
  body2: { fontSize: "0.875rem", lineHeight: 1.5 },
  caption: {
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  },
  button: { textTransform: "none" as const, fontWeight: 500 },
};

const themeConfigs: Record<ThemeColor, ThemeConfig> = {
  indigo: {
    name: "Indigo",
    palette: {
      light: {
        primary: {
          main: "#6366F1",
          light: "#818CF8",
          dark: "#4F46E5",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#8B5CF6",
          light: "#A78BFA",
          dark: "#7C3AED",
          contrastText: "#FFFFFF",
        },
        success: {
          main: "#10B981",
          light: "#34D399",
          dark: "#059669",
          contrastText: "#FFFFFF",
        },
        warning: {
          main: "#F59E0B",
          light: "#FBBF24",
          dark: "#D97706",
          contrastText: "#FFFFFF",
        },
        error: {
          main: "#EF4444",
          light: "#F87171",
          dark: "#DC2626",
          contrastText: "#FFFFFF",
        },
        info: {
          main: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
          contrastText: "#FFFFFF",
        },
        background: { default: "#F8FAFC", paper: "#FFFFFF" },
        text: { primary: "#0F172A", secondary: "#64748B" },
        divider: "rgba(15, 23, 42, 0.08)",
      },
      dark: {
        primary: {
          main: "#818CF8",
          light: "#A5B4FC",
          dark: "#6366F1",
          contrastText: "#0F172A",
        },
        secondary: {
          main: "#A78BFA",
          light: "#C4B5FD",
          dark: "#8B5CF6",
          contrastText: "#0F172A",
        },
        success: {
          main: "#34D399",
          light: "#6EE7B7",
          dark: "#10B981",
          contrastText: "#0F172A",
        },
        warning: {
          main: "#FBBF24",
          light: "#FCD34D",
          dark: "#F59E0B",
          contrastText: "#0F172A",
        },
        error: {
          main: "#F87171",
          light: "#FCA5A5",
          dark: "#EF4444",
          contrastText: "#0F172A",
        },
        info: {
          main: "#60A5FA",
          light: "#93C5FD",
          dark: "#3B82F6",
          contrastText: "#0F172A",
        },
        background: { default: "#0F172A", paper: "#1E293B" },
        text: { primary: "#F1F5F9", secondary: "#94A3B8" },
        divider: "rgba(241, 245, 249, 0.08)",
      },
    },
  },
  pink: {
    name: "Rose",
    palette: {
      light: {
        primary: {
          main: "#B8838F",       // Dusty rose - warm, muted, professional
          light: "#D4A5A4",      // Lighter dusty rose
          dark: "#9E6B77",       // Deeper dusty rose
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#9B7BA8",       // Muted lavender to complement
          light: "#B9A3C4",
          dark: "#7D5F8A",
          contrastText: "#FFFFFF",
        },
        success: {
          main: "#10B981",
          light: "#34D399",
          dark: "#059669",
          contrastText: "#FFFFFF",
        },
        warning: {
          main: "#F59E0B",
          light: "#FBBF24",
          dark: "#D97706",
          contrastText: "#FFFFFF",
        },
        error: {
          main: "#EF4444",
          light: "#F87171",
          dark: "#DC2626",
          contrastText: "#FFFFFF",
        },
        info: {
          main: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
          contrastText: "#FFFFFF",
        },
        background: { default: "#F8FAFC", paper: "#FFFFFF" },  // Neutral slate, not pink-tinted
        text: { primary: "#0F172A", secondary: "#64748B" },
        divider: "rgba(15, 23, 42, 0.08)",
      },
      dark: {
        primary: {
          main: "#D4A5A4",       // Softer dusty rose for dark mode
          light: "#E5C4C3",
          dark: "#B8838F",
          contrastText: "#0F172A",
        },
        secondary: {
          main: "#B9A3C4",       // Soft lavender for dark mode
          light: "#D1C4DA",
          dark: "#9B7BA8",
          contrastText: "#0F172A",
        },
        success: {
          main: "#34D399",
          light: "#6EE7B7",
          dark: "#10B981",
          contrastText: "#0F172A",
        },
        warning: {
          main: "#FBBF24",
          light: "#FCD34D",
          dark: "#F59E0B",
          contrastText: "#0F172A",
        },
        error: {
          main: "#F87171",
          light: "#FCA5A5",
          dark: "#EF4444",
          contrastText: "#0F172A",
        },
        info: {
          main: "#60A5FA",
          light: "#93C5FD",
          dark: "#3B82F6",
          contrastText: "#0F172A",
        },
        background: { default: "#0F172A", paper: "#1E293B" },  // Neutral slate, not brown-tinted
        text: { primary: "#F1F5F9", secondary: "#94A3B8" },
        divider: "rgba(241, 245, 249, 0.08)",
      },
    },
  },
  sage: {
    name: "Sage",
    palette: {
      light: {
        primary: {
          main: "#5F8575",       // True sage - gray-green, calm, natural
          light: "#8BAB8B",      // Lighter sage
          dark: "#4A6B5C",       // Deeper sage
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#6B8A8A",       // Muted teal to complement sage
          light: "#8FAAAA",
          dark: "#526E6E",
          contrastText: "#FFFFFF",
        },
        success: {
          main: "#10B981",
          light: "#34D399",
          dark: "#059669",
          contrastText: "#FFFFFF",
        },
        warning: {
          main: "#F59E0B",
          light: "#FBBF24",
          dark: "#D97706",
          contrastText: "#FFFFFF",
        },
        error: {
          main: "#EF4444",
          light: "#F87171",
          dark: "#DC2626",
          contrastText: "#FFFFFF",
        },
        info: {
          main: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
          contrastText: "#FFFFFF",
        },
        background: { default: "#F8FAFC", paper: "#FFFFFF" },  // Neutral slate, not green-tinted
        text: { primary: "#0F172A", secondary: "#64748B" },
        divider: "rgba(15, 23, 42, 0.08)",
      },
      dark: {
        primary: {
          main: "#8BAB8B",       // Lighter sage for dark mode visibility
          light: "#A8C4A8",
          dark: "#5F8575",
          contrastText: "#0F172A",
        },
        secondary: {
          main: "#8FAAAA",       // Soft teal for dark mode
          light: "#ABC4C4",
          dark: "#6B8A8A",
          contrastText: "#0F172A",
        },
        success: {
          main: "#34D399",
          light: "#6EE7B7",
          dark: "#10B981",
          contrastText: "#0F172A",
        },
        warning: {
          main: "#FBBF24",
          light: "#FCD34D",
          dark: "#F59E0B",
          contrastText: "#0F172A",
        },
        error: {
          main: "#F87171",
          light: "#FCA5A5",
          dark: "#EF4444",
          contrastText: "#0F172A",
        },
        info: {
          main: "#60A5FA",
          light: "#93C5FD",
          dark: "#3B82F6",
          contrastText: "#0F172A",
        },
        background: { default: "#0F172A", paper: "#1E293B" },  // Neutral slate, not green-tinted
        text: { primary: "#F1F5F9", secondary: "#94A3B8" },
        divider: "rgba(241, 245, 249, 0.08)",
      },
    },
  },
};

export function createAppTheme(color: ThemeColor, mode: ThemeMode): Theme {
  const paletteConfig = themeConfigs[color].palette[mode];
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      ...paletteConfig,
    },
    typography: baseTypography,
    shape: { borderRadius: 12 },
    shadows: [
      "none",
      "0 1px 2px rgba(0,0,0,0.04)",
      "0 1px 3px rgba(0,0,0,0.06)",
      "0 2px 4px rgba(0,0,0,0.06)",
      "0 4px 6px rgba(0,0,0,0.06)",
      "0 6px 8px rgba(0,0,0,0.06)",
      "0 8px 16px rgba(0,0,0,0.08)",
      "0 12px 24px rgba(0,0,0,0.08)",
      "0 16px 32px rgba(0,0,0,0.08)",
      "0 20px 40px rgba(0,0,0,0.1)",
      "0 24px 48px rgba(0,0,0,0.1)",
      ...Array(14).fill("0 24px 48px rgba(0,0,0,0.1)"),
    ] as any,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: paletteConfig.background.default,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: "0.875rem",
            fontWeight: 600,
            textTransform: "none",
            transition: "all 0.2s ease",
          },
          contained: {
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: isDark
                ? "0 4px 12px rgba(0,0,0,0.3)"
                : "0 4px 12px rgba(99, 102, 241, 0.25)",
            },
          },
          outlined: {
            borderWidth: "1.5px",
            "&:hover": {
              borderWidth: "1.5px",
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(99, 102, 241, 0.04)",
            },
          },
          text: {
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(99, 102, 241, 0.08)",
            },
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(0,0,0,0.06)",
            boxShadow: isDark
              ? "0 1px 3px rgba(0,0,0,0.2)"
              : "0 1px 3px rgba(0,0,0,0.04)",
            transition: "all 0.2s ease",
            "&:hover": {
              boxShadow: isDark
                ? "0 4px 12px rgba(0,0,0,0.3)"
                : "0 4px 12px rgba(0,0,0,0.08)",
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            fontSize: "0.8125rem",
          },
          filled: {
            border: "none",
          },
          outlined: {
            borderWidth: "1.5px",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 10,
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#FFFFFF",
              transition: "all 0.2s ease",
              "& fieldset": {
                borderWidth: "1.5px",
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.12)",
              },
              "&:hover fieldset": {
                borderWidth: "1.5px",
                borderColor: paletteConfig.primary.main,
              },
              "&.Mui-focused fieldset": {
                borderWidth: "2px",
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: isDark
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid rgba(0,0,0,0.04)",
            boxShadow: isDark
              ? "0 1px 3px rgba(0,0,0,0.2)"
              : "0 1px 3px rgba(0,0,0,0.03)",
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderBottom: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(0,0,0,0.06)",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.875rem",
            minHeight: 48,
            transition: "all 0.2s ease",
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            height: 8,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
          },
          bar: {
            borderRadius: 6,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            border: isDark
              ? "1px solid rgba(255,255,255,0.1)"
              : "none",
            boxShadow: isDark
              ? "0 24px 48px rgba(0,0,0,0.5)"
              : "0 24px 48px rgba(0,0,0,0.15)",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
            borderRight: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(0,0,0,0.06)",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: "2px 8px",
            transition: "all 0.2s ease",
            "&.Mui-selected": {
              backgroundColor: isDark
                ? "rgba(129, 140, 248, 0.15)"
                : "rgba(99, 102, 241, 0.1)",
              "&:hover": {
                backgroundColor: isDark
                  ? "rgba(129, 140, 248, 0.2)"
                  : "rgba(99, 102, 241, 0.15)",
              },
            },
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.04)",
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: "0.75rem",
            fontWeight: 500,
            padding: "8px 12px",
            backgroundColor: isDark
              ? "rgba(30, 41, 59, 0.95)"
              : "rgba(15, 23, 42, 0.9)",
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            padding: 8,
          },
          track: {
            borderRadius: 12,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.2)"
              : "rgba(0,0,0,0.25)",
          },
          thumb: {
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.04)",
            },
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: isDark
              ? "0 4px 12px rgba(0,0,0,0.4)"
              : "0 4px 12px rgba(99, 102, 241, 0.3)",
            "&:hover": {
              boxShadow: isDark
                ? "0 6px 16px rgba(0,0,0,0.5)"
                : "0 6px 16px rgba(99, 102, 241, 0.4)",
            },
          },
        },
      },
    },
  });
}

export function getThemeName(color: ThemeColor): string {
  return themeConfigs[color].name;
}
