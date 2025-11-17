import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  useTheme,
} from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useAppTheme } from '../context/ThemeContext';
import PageHeader from '../components/shared/PageHeader';

const Settings: React.FC = () => {
  const theme = useTheme();
  const { themeMode, toggleThemeMode } = useAppTheme();

  // TODO: Add theme color selector
  // Need to create cards for each theme option

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Customize your Lockin experience"
      />

      {/* Dark Mode Toggle */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {themeMode === 'dark' ? <DarkMode /> : <LightMode />}
              <Box>
                <Typography variant="h6">Dark Mode</Typography>
                <Typography variant="body2" color="text.secondary">
                  Toggle dark mode
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={<Switch checked={themeMode === 'dark'} onChange={toggleThemeMode} />}
              label=""
            />
          </Box>
        </CardContent>
      </Card>

      {/* TODO: Add theme color cards here */}
    </Box>
  );
};

export default Settings;
