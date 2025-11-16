import { createTheme } from '@mui/material/styles';

// Sage Modern Color Palette
export const SAGE_COLORS = {
  // Primary - Sage Green Tones
  sage: {
    50: '#f6f7f4',
    100: '#e8ebe3',
    200: '#d1d8c7',
    300: '#b4bfa4',
    400: '#96a57f',
    500: '#7a8c63', // Main sage
    600: '#637050',
    700: '#4f5840',
    800: '#3e4533',
    900: '#2d3225',
  },

  // Secondary - Warm Terracotta
  terracotta: {
    50: '#fdf6f3',
    100: '#f9e8df',
    200: '#f3d1bf',
    300: '#e9b195',
    400: '#dd8a69',
    500: '#c97252', // Main terracotta
    600: '#b05a3f',
    700: '#8f4a35',
    800: '#6d3828',
    900: '#4f291d',
  },

  // Accent - Muted Gold
  gold: {
    50: '#fdf9f0',
    100: '#f9f0db',
    200: '#f3e1b8',
    300: '#e9cc8a',
    400: '#ddb05c',
    500: '#c99653',
    600: '#a87940',
    700: '#856033',
    800: '#644829',
    900: '#47331d',
  },

  // Neutral - Warm Grays
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },

  // Status Colors (muted, earthy versions)
  status: {
    success: '#7a8c63', // Sage green
    warning: '#c99653', // Muted gold
    error: '#c97252', // Soft terracotta
    info: '#96a57f', // Light sage
  },
};

// Create the sage modern theme
export const sageTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: SAGE_COLORS.sage[500],
      light: SAGE_COLORS.sage[300],
      dark: SAGE_COLORS.sage[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: SAGE_COLORS.terracotta[500],
      light: SAGE_COLORS.terracotta[300],
      dark: SAGE_COLORS.terracotta[700],
      contrastText: '#ffffff',
    },
    success: {
      main: SAGE_COLORS.sage[600],
      light: SAGE_COLORS.sage[400],
      dark: SAGE_COLORS.sage[800],
    },
    warning: {
      main: SAGE_COLORS.gold[500],
      light: SAGE_COLORS.gold[300],
      dark: SAGE_COLORS.gold[700],
    },
    error: {
      main: SAGE_COLORS.terracotta[500],
      light: SAGE_COLORS.terracotta[300],
      dark: SAGE_COLORS.terracotta[700],
    },
    info: {
      main: SAGE_COLORS.sage[400],
      light: SAGE_COLORS.sage[200],
      dark: SAGE_COLORS.sage[600],
    },
    background: {
      default: '#fafaf9', // Warm white
      paper: '#ffffff',
    },
    text: {
      primary: SAGE_COLORS.neutral[900],
      secondary: SAGE_COLORS.neutral[600],
      disabled: SAGE_COLORS.neutral[400],
    },
    divider: SAGE_COLORS.neutral[200],
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: SAGE_COLORS.neutral[900],
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: SAGE_COLORS.neutral[900],
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: SAGE_COLORS.neutral[900],
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: SAGE_COLORS.neutral[800],
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: SAGE_COLORS.neutral[800],
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: SAGE_COLORS.neutral[800],
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(122, 140, 99, 0.25)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 6px 16px rgba(122, 140, 99, 0.3)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s ease',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: SAGE_COLORS.sage[400],
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px',
                borderColor: SAGE_COLORS.sage[500],
              },
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        filled: {
          backgroundColor: SAGE_COLORS.sage[100],
          color: SAGE_COLORS.sage[800],
          '&:hover': {
            backgroundColor: SAGE_COLORS.sage[200],
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: SAGE_COLORS.sage[50],
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: SAGE_COLORS.neutral[200],
        },
        bar: {
          borderRadius: 4,
          backgroundColor: SAGE_COLORS.sage[500],
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${SAGE_COLORS.neutral[200]}`,
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: SAGE_COLORS.neutral[900],
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginBottom: 4,
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: SAGE_COLORS.sage[100],
            color: SAGE_COLORS.sage[800],
            '&:hover': {
              backgroundColor: SAGE_COLORS.sage[200],
            },
            '& .MuiListItemIcon-root': {
              color: SAGE_COLORS.sage[700],
            },
          },
          '&:hover': {
            backgroundColor: SAGE_COLORS.neutral[100],
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        standardSuccess: {
          backgroundColor: SAGE_COLORS.sage[50],
          color: SAGE_COLORS.sage[900],
        },
        standardWarning: {
          backgroundColor: SAGE_COLORS.gold[50],
          color: SAGE_COLORS.gold[900],
        },
        standardError: {
          backgroundColor: SAGE_COLORS.terracotta[50],
          color: SAGE_COLORS.terracotta[900],
        },
      },
    },
  },
});

export default sageTheme;
