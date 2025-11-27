import React, { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  Badge,
  Divider,
  Button,
  CircularProgress,
  useTheme,
  alpha,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import InfoIcon from "@mui/icons-material/Info";
import {
  notificationService,
  Notification,
} from "../../services/notificationService";
import { useNavigate } from "react-router-dom";

/**
 * Get icon for notification type.
 */
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "AI_BREAKDOWN":
    case "DAILY_BRIEFING":
      return <SmartToyIcon fontSize="small" />;
    case "CALENDAR_SYNC":
      return <CalendarMonthIcon fontSize="small" />;
    case "TASK_DUE":
      return <TaskAltIcon fontSize="small" />;
    default:
      return <InfoIcon fontSize="small" />;
  }
};

/**
 * Format time ago from date string.
 */
function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

interface NotificationCenterProps {
  onNewNotification?: (notification: Notification) => void;
}

/**
 * Notification center with slide-out drawer.
 *
 * Modern UI with Material-UI v7.
 */
const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onNewNotification,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const updateUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to get unread count:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAllNotifications();
      setNotifications(data);
      updateUnreadCount();
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [updateUnreadCount]);

  // Fetch unread count on mount
  useEffect(() => {
    updateUnreadCount();
  }, [updateUnreadCount]);

  // Fetch full list when drawer opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      updateUnreadCount();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      setOpen(false);
      navigate(notification.actionUrl);
    }
  };

  /**
   * Add new notification from WebSocket.
   */
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
    onNewNotification?.(notification);
  }, [onNewNotification]);

  // Expose addNotification via ref or context if needed
  // For now, parent can use websocketService to call this

  return (
    <>
      {/* Notification Bell Icon */}
      <IconButton
        color="inherit"
        onClick={() => setOpen(true)}
        sx={{ ml: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Slide-out Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: 400 },
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Notifications
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>

          <Box>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<CheckIcon />}
                onClick={handleMarkAllAsRead}
                sx={{ mr: 1 }}
              >
                Mark all read
              </Button>
            )}
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Notification List */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ flexGrow: 1, overflow: "auto", p: 0 }}>
            {notifications.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <NotificationsIcon
                  sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                />
                <Typography color="text.secondary">
                  No notifications yet
                </Typography>
              </Box>
            ) : (
              notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    disablePadding
                    sx={{
                      bgcolor: notification.isRead
                        ? "transparent"
                        : alpha(theme.palette.primary.main, 0.04),
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleNotificationClick(notification)}
                      sx={{ py: 1.5, px: 2 }}
                    >
                      <Box
                        sx={{
                          mr: 1.5,
                          color: notification.isRead
                            ? "text.secondary"
                            : "primary.main",
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Box>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: notification.isRead ? 400 : 600,
                              }}
                            >
                              {notification.title}
                            </Typography>
                            {!notification.isRead && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  bgcolor: "primary.main",
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 0.5 }}
                            >
                              {notification.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatTimeAgo(notification.createdAt)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>
        )}
      </Drawer>
    </>
  );
};

export default NotificationCenter;
