import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#9CAF88',        // Sage green - muted and earthy
      light: '#C5D5B5',
      dark: '#7A8F6F',
      contrastText: '#2D3A2E',
    },
    secondary: {
      main: '#B8C9A8',        // Light sage - natural accent
      light: '#D4E3C8',
      dark: '#9AB187',
      contrastText: '#2D3A2E',
    },
    background: {
      default: '#F8FAF6',     // Very subtle sage tint
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3A2E',     // Deep forest green-gray
      secondary: '#5A6C5B',   // Muted sage gray
    },
    grey: {
      50: '#F8F9F8',
      100: '#F1F3F0',
      200: '#E4E8E1',
      300: '#CED6C9',
      400: '#A3AE9E',
      500: '#7A8576',
      600: '#5A6C5B',
      700: '#454F46',
      800: '#2D3A2E',
      900: '#1A231B',
    },
    success: {
      main: '#88B878',        // Muted green
      light: '#B5D4A8',
      dark: '#6A9B5A',
      contrastText: '#1A3A14',
    },
    warning: {
      main: '#E8C468',        // Muted gold
      light: '#F3DFA0',
      dark: '#D4AA3C',
      contrastText: '#4A3A0F',
    },
    error: {
      main: '#D89B9B',        // Muted rose
      light: '#EBC4C4',
      dark: '#C47676',
      contrastText: '#5A2424',
    },
    info: {
      main: '#8AAFC9',        // Muted blue-gray
      light: '#B5D0E0',
      dark: '#6A91AD',
      contrastText: '#1E3A4A',
    },
    divider: 'rgba(90, 108, 91, 0.12)',
  },

  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '2.25rem', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.2 },
    h2: { fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em' },
    h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em' },
    h4: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em' },
    h5: { fontSize: '1.125rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' },
    button: { textTransform: 'none', fontWeight: 500 },
  },

  shape: {
    borderRadius: 12,
  },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          fontSize: '0.9375rem',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        },
      },
    },
  },
});

export default theme;
