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
          main: "#667BC6",
          light: "#9FA8DA",
          dark: "#4A5FA8",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#7986CB",
          light: "#AAB6FE",
          dark: "#5C6BC0",
          contrastText: "#FFFFFF",
        },
        success: {
          main: "#7CB342",
          light: "#AED581",
          dark: "#558B2F",
          contrastText: "#FFFFFF",
        },
        warning: {
          main: "#FFA726",
          light: "#FFB74D",
          dark: "#F57C00",
          contrastText: "#FFFFFF",
        },
        error: {
          main: "#E57373",
          light: "#EF9A9A",
          dark: "#D32F2F",
          contrastText: "#FFFFFF",
        },
        info: {
          main: "#64B5F6",
          light: "#90CAF9",
          dark: "#1976D2",
          contrastText: "#FFFFFF",
        },
        background: { default: "#F5F7FF", paper: "#FFFFFF" },
        text: { primary: "#1A237E", secondary: "#5C6BC0" },
        divider: "rgba(26, 35, 126, 0.12)",
      },
      dark: {
        primary: {
          main: "#9FA8DA",
          light: "#C5CAE9",
          dark: "#7986CB",
          contrastText: "#0D1117",
        },
        secondary: {
          main: "#AAB6FE",
          light: "#C5CAE9",
          dark: "#9FA8DA",
          contrastText: "#0D1117",
        },
        success: {
          main: "#81C784",
          light: "#A5D6A7",
          dark: "#66BB6A",
          contrastText: "#0D1117",
        },
        warning: {
          main: "#FFB74D",
          light: "#FFCC80",
          dark: "#FFA726",
          contrastText: "#0D1117",
        },
        error: {
          main: "#E57373",
          light: "#EF9A9A",
          dark: "#EF5350",
          contrastText: "#0D1117",
        },
        info: {
          main: "#64B5F6",
          light: "#90CAF9",
          dark: "#42A5F5",
          contrastText: "#0D1117",
        },
        background: { default: "#0D1117", paper: "#161B22" },
        text: { primary: "#E6EDF3", secondary: "#AAB6FE" },
        divider: "rgba(230, 237, 243, 0.12)",
      },
    },
  },
  pink: {
    name: "Pink Mauve",
    palette: {
      light: {
        primary: {
          main: "#997A8D",
          light: "#C4A7B7",
          dark: "#7A5F71",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#B89CAC",
          light: "#D9C4CF",
          dark: "#9A7E8E",
          contrastText: "#FFFFFF",
        },
        success: {
          main: "#81A77A",
          light: "#A8C9A3",
          dark: "#6A8F63",
          contrastText: "#FFFFFF",
        },
        warning: {
          main: "#E8B468",
          light: "#F3D1A0",
          dark: "#D49A3C",
          contrastText: "#FFFFFF",
        },
        error: {
          main: "#D89B9B",
          light: "#EBC4C4",
          dark: "#C47676",
          contrastText: "#FFFFFF",
        },
        info: {
          main: "#8AAFC9",
          light: "#B5D0E0",
          dark: "#6A91AD",
          contrastText: "#FFFFFF",
        },
        background: { default: "#FDF8FB", paper: "#FFFFFF" },
        text: { primary: "#4A2C3D", secondary: "#7A5F71" },
        divider: "rgba(74, 44, 61, 0.12)",
      },
      dark: {
        primary: {
          main: "#C4A7B7",
          light: "#D9C4CF",
          dark: "#997A8D",
          contrastText: "#1A0E15",
        },
        secondary: {
          main: "#D9C4CF",
          light: "#EDDFE6",
          dark: "#B89CAC",
          contrastText: "#1A0E15",
        },
        success: {
          main: "#A8C9A3",
          light: "#C4DFC0",
          dark: "#8FB58A",
          contrastText: "#1A0E15",
        },
        warning: {
          main: "#F3D1A0",
          light: "#F8E4C4",
          dark: "#E8B468",
          contrastText: "#1A0E15",
        },
        error: {
          main: "#EBC4C4",
          light: "#F5DEDE",
          dark: "#D89B9B",
          contrastText: "#1A0E15",
        },
        info: {
          main: "#B5D0E0",
          light: "#D4E6F0",
          dark: "#8AAFC9",
          contrastText: "#1A0E15",
        },
        background: { default: "#1A0E15", paper: "#2E1A28" },
        text: { primary: "#F8E8F1", secondary: "#D9C4CF" },
        divider: "rgba(248, 232, 241, 0.12)",
      },
    },
  },
  sage: {
    name: "Sage Green",
    palette: {
      light: {
        primary: {
          main: "#9CAF88",
          light: "#C5D5B5",
          dark: "#7A8F6F",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#B8C9A8",
          light: "#D4E3C8",
          dark: "#9AB187",
          contrastText: "#FFFFFF",
        },
        success: {
          main: "#88B878",
          light: "#B5D4A8",
          dark: "#6A9B5A",
          contrastText: "#FFFFFF",
        },
        warning: {
          main: "#E8C468",
          light: "#F3DFA0",
          dark: "#D4AA3C",
          contrastText: "#FFFFFF",
        },
        error: {
          main: "#D89B9B",
          light: "#EBC4C4",
          dark: "#C47676",
          contrastText: "#FFFFFF",
        },
        info: {
          main: "#8AAFC9",
          light: "#B5D0E0",
          dark: "#6A91AD",
          contrastText: "#FFFFFF",
        },
        background: { default: "#F8FAF6", paper: "#FFFFFF" },
        text: { primary: "#2D3A2E", secondary: "#5A6C5B" },
        divider: "rgba(90, 108, 91, 0.12)",
      },
      dark: {
        primary: {
          main: "#B8C9A8",
          light: "#D4E3C8",
          dark: "#9CAF88",
          contrastText: "#1A261A",
        },
        secondary: {
          main: "#C5D5B5",
          light: "#E0EAD5",
          dark: "#B8C9A8",
          contrastText: "#1A261A",
        },
        success: {
          main: "#B5D4A8",
          light: "#D4E8CA",
          dark: "#9BC08C",
          contrastText: "#1A261A",
        },
        warning: {
          main: "#F3DFA0",
          light: "#F8ECC4",
          dark: "#E8C468",
          contrastText: "#1A261A",
        },
        error: {
          main: "#EBC4C4",
          light: "#F5DEDE",
          dark: "#D89B9B",
          contrastText: "#1A261A",
        },
        info: {
          main: "#B5D0E0",
          light: "#D4E6F0",
          dark: "#8AAFC9",
          contrastText: "#1A261A",
        },
        background: { default: "#141A14", paper: "#1E261E" },
        text: { primary: "#E8F0E8", secondary: "#C5D5B5" },
        divider: "rgba(232, 240, 232, 0.12)",
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
            fontSize: "0.9375rem",
            fontWeight: 500,
            textTransform: "none",
          },
          contained: {
            "&:hover": {
              transform: "translateY(-1px)",
            },
          },
          outlined: {
            borderWidth: "1.5px",
            "&:hover": {
              borderWidth: "1.5px",
            },
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: "none",
            boxShadow: isDark
              ? "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)"
              : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
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
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 10,
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
              "& fieldset": {
                borderWidth: "1.5px",
              },
              "&:hover fieldset": {
                borderWidth: "1.5px",
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
            boxShadow: isDark
              ? "0 1px 3px rgba(0,0,0,0.3)"
              : "0 1px 3px rgba(0,0,0,0.04)",
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 500,
            fontSize: "0.9375rem",
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            height: 10,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.06)",
          },
          bar: {
            borderRadius: 10,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            boxShadow: isDark
              ? "0 12px 24px rgba(0,0,0,0.5)"
              : "0 12px 24px rgba(0,0,0,0.12)",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}

export function getThemeName(color: ThemeColor): string {
  return themeConfigs[color].name;
}
