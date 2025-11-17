import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme, ThemeColor, ThemeMode } from '../themes/themeConfig';

interface ThemeContextType {
  themeColor: ThemeColor;
  themeMode: ThemeMode;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Should we use localStorage? Not sure yet...
// const THEME_COLOR_KEY = 'lockin-theme-color';
// const THEME_MODE_KEY = 'lockin-theme-mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Just hardcode for now, will add localStorage later
  const [themeColor, setThemeColor] = useState<ThemeColor>('sage');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  const toggleThemeMode = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const theme = useMemo(() => createAppTheme(themeColor, themeMode), [themeColor, themeMode]);

  return (
    <ThemeContext.Provider
      value={{
        themeColor,
        themeMode,
        setThemeColor,
        setThemeMode,
        toggleThemeMode,
      }}
    >
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
};
