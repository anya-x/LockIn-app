import { createTheme, Theme, ThemeOptions } from "@mui/material/styles";

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
        background: { default: "#F5F7FF", paper: "#FFFFFF" },
        text: { primary: "#1A237E", secondary: "#5C6BC0" },
      },
      dark: {
        primary: {
          main: "#9FA8DA",
          light: "#C5CAE9",
          dark: "#7986CB",
          contrastText: "#000000",
        },
        secondary: {
          main: "#AAB6FE",
          light: "#C5CAE9",
          dark: "#9FA8DA",
          contrastText: "#000000",
        },
        background: { default: "#0D1117", paper: "#161B22" },
        text: { primary: "#E6EDF3", secondary: "#AAB6FE" },
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
        background: { default: "#FDF8FB", paper: "#FFFFFF" },
        text: { primary: "#4A2C3D", secondary: "#7A5F71" },
      },
      dark: {
        primary: {
          main: "#C4A7B7",
          light: "#D9C4CF",
          dark: "#997A8D",
          contrastText: "#000000",
        },
        secondary: {
          main: "#D9C4CF",
          light: "#EDDFE6",
          dark: "#B89CAC",
          contrastText: "#000000",
        },
        background: { default: "#1A0E15", paper: "#2E1A28" },
        text: { primary: "#F8E8F1", secondary: "#D9C4CF" },
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
          contrastText: "#2D3A2E",
        },
        secondary: {
          main: "#B8C9A8",
          light: "#D4E3C8",
          dark: "#9AB187",
          contrastText: "#2D3A2E",
        },
        background: { default: "#F8FAF6", paper: "#FFFFFF" },
        text: { primary: "#2D3A2E", secondary: "#5A6C5B" },
      },
      dark: {
        primary: {
          main: "#B8C9A8",
          light: "#D4E3C8",
          dark: "#9CAF88",
          contrastText: "#000000",
        },
        secondary: {
          main: "#C5D5B5",
          light: "#E0EAD5",
          dark: "#B8C9A8",
          contrastText: "#000000",
        },
        background: { default: "#141A14", paper: "#1E261E" },
        text: { primary: "#E8F0E8", secondary: "#C5D5B5" },
      },
    },
  },
};

export function createAppTheme(color: ThemeColor, mode: ThemeMode): Theme {
  const paletteConfig = themeConfigs[color].palette[mode];

  return createTheme({
    palette: {
      mode,
      ...paletteConfig,
    },
    typography: baseTypography,
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: "10px 20px",
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
    },
  });
}

export function getThemeName(color: ThemeColor): string {
  return themeConfigs[color].name;
}
