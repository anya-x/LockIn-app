import { createTheme } from "@mui/material/styles";

export const themes = {
  indigo: {
    primary: "#667BC6",
    secondary: "#7986CB",
  },
  sage: {
    primary: "#9CAF88",
    secondary: "#B8C9A8",
  },
  // pink: {
  //   primary: '#997A8D',
  //   secondary: '#B89CAC',
  // },
};

export function createAppTheme(themeName: string) {
  const colors = themes[themeName as keyof typeof themes];

  return createTheme({
    palette: {
      primary: {
        main: colors.primary,
      },
      secondary: {
        main: colors.secondary,
      },
    },
  });
}
