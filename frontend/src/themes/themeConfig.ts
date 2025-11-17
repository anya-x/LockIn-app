// Experimenting with different theme configurations
// TODO: figure out best approach for theme switching

import { createTheme } from '@mui/material/styles';

// Maybe we can have multiple theme configs?
export const themes = {
  indigo: {
    primary: '#667BC6',
    secondary: '#7986CB',
  },
  sage: {
    primary: '#9CAF88',
    secondary: '#B8C9A8',
  },
  // pink: {
  //   primary: '#997A8D',
  //   secondary: '#B89CAC',
  // },
};

// Not sure if this is the right way...
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
