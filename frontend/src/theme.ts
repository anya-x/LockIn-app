import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667BC6',
      light: '#9FA8DA',
      dark: '#4A5FA8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7986CB',
      light: '#AAB6FE',
      dark: '#5C6BC0',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F7FF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A237E',
      secondary: '#5C6BC0',
    },
  },

  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },

  shape: {
    borderRadius: 12,
  },

  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
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
      defaultProps: {
        elevation: 0,
      },
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
