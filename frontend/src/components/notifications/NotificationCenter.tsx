import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

// Trying Dialog instead...
export const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Notifications
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* TODO: Notification list */}
        <Typography>No notifications</Typography>
      </DialogContent>
    </Dialog>
  );
};
