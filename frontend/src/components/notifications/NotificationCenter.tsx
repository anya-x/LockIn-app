import React from 'react';
import { Drawer, Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

// WIP: Just trying drawer layout first
export const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose }) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 350 }, // 350px feels a bit narrow?
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Notifications</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* TODO: Add notification list here */}
        <Typography color="text.secondary">
          No notifications yet
        </Typography>
      </Box>
    </Drawer>
  );
};
