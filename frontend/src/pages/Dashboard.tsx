import React, { useCallback, useMemo, useEffect, useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
  alpha,
  Snackbar,
  Alert,
} from "@mui/material";
import { getSessionTypeColor } from "../utils/colorMaps";
import {
  Menu as MenuIcon,
  Assignment as TaskIcon,
  Category as CategoryIcon,
  GridOn as GridOnIcon,
  ExitToApp as LogoutIcon,
  Timer as TimerIcon,
  BarChart as StatsIcon,
  Analytics as AnalyticsIcon,
  Checklist as GoalsIcon,
  EmojiEvents as BadgesIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTimer } from "../context/TimerContext";
import PomodoroTimer from "./PomodoroTimer";
import Categories from "./Categories";
import Matrix from "./Matrix";
import Statistics from "./Statistics";
import Tasks from "./Tasks";
import Analytics from "./Analytics";
import Goals from "./Goals";
import Badges from "./Badges";
import Settings from "./Settings";
import Today from "./Today";
import NotificationCenter from "../components/notifications/NotificationCenter";
import { websocketService } from "../services/websocketService";
import { browserNotificationService } from "../services/browserNotificationService";
import type { Notification } from "../services/notificationService";

const drawerWidth = 240;

const TimerChip: React.FC<{
  isRunning: boolean;
  sessionType: string;
  profileColor: string;
  sessionStartedAt: number | null;
  plannedMinutes: number;
  pausedElapsedMs: number;
  onNavigate: () => void;
  currentView: string;
}> = React.memo(
  ({
    isRunning,
    sessionType,
    profileColor,
    sessionStartedAt,
    plannedMinutes,
    pausedElapsedMs,
    onNavigate,
    currentView,
  }) => {
    const [countdown, setCountdown] = React.useState("00:00");

    React.useEffect(() => {
      if (!sessionStartedAt) {
        return;
      }

      const updateCountdown = () => {
        const currentElapsedMs = isRunning ? Date.now() - sessionStartedAt : 0;
        const totalElapsedMs = pausedElapsedMs + currentElapsedMs;
        const elapsedSeconds = Math.floor(totalElapsedMs / 1000);
        const totalSeconds = plannedMinutes * 60;
        const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        const formatted = `${String(minutes).padStart(2, "0")}:${String(
          seconds
        ).padStart(2, "0")}`;
        setCountdown(formatted);
      };

      updateCountdown();

      if (isRunning) {
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
      }
    }, [isRunning, sessionStartedAt, plannedMinutes, pausedElapsedMs]);

    if (!sessionStartedAt || currentView === "timer") return null;

    return (
      <Chip
        icon={<TimerIcon />}
        label={countdown}
        onClick={onNavigate}
        sx={{
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.9rem",
          bgcolor: getSessionTypeColor(sessionType, profileColor),
          color: "white",
          "&:hover": {
            opacity: 0.9,
          },
          "& .MuiChip-icon": {
            color: "white",
            animation: "pulse 2s ease-in-out infinite",
          },
          "@keyframes pulse": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.5 },
          },
        }}
      />
    );
  }
);

TimerChip.displayName = "TimerChip";

const SidebarTimerIndicator: React.FC<{
  isRunning: boolean;
  sessionType: string;
  profileColor: string;
}> = React.memo(({ isRunning, sessionType, profileColor }) => {
  if (!isRunning) return null;

  return (
    <Chip
      label="•"
      size="small"
      sx={{
        fontSize: "0.7rem",
        height: 20,
        bgcolor: getSessionTypeColor(sessionType, profileColor),
        color: "white",
        fontWeight: 600,
        minWidth: 24,
        "& .MuiChip-label": {
          px: 0.5,
        },
      }}
    />
  );
});

SidebarTimerIndicator.displayName = "SidebarTimerIndicator";

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { logout, user } = useAuth();

  const { timer, selectedProfile } = useTimer();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    if (user?.email) {
      browserNotificationService.requestPermission();

      websocketService.connect(user.email, (notification: unknown) => {
        const notif = notification as Notification;

        if (browserNotificationService.isSupported()) {
          browserNotificationService.showNotification(notif.title, {
            body: notif.message,
            tag: String(notif.id),
          });
        }

        setSnackbarMessage(notif.title);
        setSnackbarOpen(true);
      });

      return () => {
        websocketService.disconnect();
      };
    }
  }, [user?.email]);

  const getCurrentView = ():
    | "today"
    | "tasks"
    | "categories"
    | "matrix"
    | "statistics"
    | "timer"
    | "analytics"
    | "goals"
    | "badges"
    | "settings" => {
    const path = location.pathname;
    if (path === "/" || path === "/today") return "today";
    if (path === "/tasks") return "tasks";
    if (path === "/categories") return "categories";
    if (path === "/matrix") return "matrix";
    if (path === "/statistics") return "statistics";
    if (path === "/timer") return "timer";
    if (path === "/analytics") return "analytics";
    if (path === "/goals") return "goals";
    if (path === "/badges") return "badges";
    if (path === "/settings") return "settings";
    return "today";
  };

  const currentView = getCurrentView();

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMenuItemClick = useCallback(
    (
      view:
        | "today"
        | "tasks"
        | "categories"
        | "matrix"
        | "statistics"
        | "timer"
        | "analytics"
        | "goals"
        | "badges"
        | "settings"
    ) => {
      navigate(view === "today" ? "/" : `/${view}`);
      if (isMobile) {
        setMobileOpen(false);
      }
    },
    [isMobile, navigate]
  );

  const handleTimerNavigate = useCallback(() => {
    navigate("/timer");
  }, [navigate]);

  const navigationGroups = [
    {
      section: "MAIN",
      items: [
        { view: "today", icon: <HomeIcon />, label: "Today" },
        { view: "tasks", icon: <TaskIcon />, label: "Tasks" },
        { view: "matrix", icon: <GridOnIcon />, label: "Matrix" },
        {
          view: "timer",
          icon: <TimerIcon />,
          label: "Focus Timer",
          hasIndicator: true,
        },
      ],
    },
    {
      section: "INSIGHTS",
      items: [
        { view: "statistics", icon: <StatsIcon />, label: "Statistics" },
        { view: "analytics", icon: <AnalyticsIcon />, label: "Analytics" },
        { view: "goals", icon: <GoalsIcon />, label: "Goals" },
        { view: "badges", icon: <BadgesIcon />, label: "Achievements" },
      ],
    },
    {
      section: "MANAGE",
      items: [
        { view: "categories", icon: <CategoryIcon />, label: "Categories" },
        { view: "settings", icon: <SettingsIcon />, label: "Settings" },
      ],
    },
  ];

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Lockin
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 2 }}>
        {navigationGroups.map((group) => (
          <Box key={group.section} sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 1,
                display: "block",
                color: alpha(theme.palette.text.secondary, 0.6),
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              {group.section}
            </Typography>
            <List disablePadding>
              {group.items.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <ListItem key={item.view} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => handleMenuItemClick(item.view as any)}
                      sx={{
                        borderRadius: 2,
                        py: 1.25,
                        px: 1.5,
                        backgroundColor: isActive
                          ? alpha(theme.palette.primary.main, 0.08)
                          : "transparent",
                        color: isActive
                          ? theme.palette.primary.main
                          : theme.palette.text.secondary,
                        "&:hover": {
                          backgroundColor: isActive
                            ? alpha(theme.palette.primary.main, 0.12)
                            : alpha(theme.palette.action.hover, 0.04),
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 36,
                          color: isActive
                            ? theme.palette.primary.main
                            : alpha(theme.palette.text.secondary, 0.6),
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: "0.9375rem",
                          fontWeight: isActive ? 600 : 500,
                        }}
                      />
                      {item.hasIndicator && (
                        <SidebarTimerIndicator
                          isRunning={timer.isRunning}
                          sessionType={timer.sessionType}
                          profileColor={selectedProfile.color}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
            mb: 1,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: theme.palette.primary.main,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: theme.palette.text.primary }}
            >
              {user?.firstName || user?.email || "User"}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: alpha(theme.palette.text.secondary, 0.7) }}
            >
              {user?.email || "user@lockin.app"}
            </Typography>
          </Box>
        </Box>

        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 2,
            py: 1,
            px: 1.5,
            color: theme.palette.text.secondary,
            "&:hover": {
              backgroundColor: alpha("#EF4444", 0.08),
              color: "#EF4444",
              "& .MuiListItemIcon-root": { color: "#EF4444" },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 36,
              color: alpha(theme.palette.text.secondary, 0.6),
            }}
          >
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 500 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  const renderContent = useMemo(() => {
    switch (currentView) {
      case "today":
        return <Today />;
      case "tasks":
        return <Tasks />;
      case "categories":
        return <Categories />;
      case "matrix":
        return <Matrix />;
      case "statistics":
        return <Statistics />;
      case "timer":
        return <PomodoroTimer />;
      case "analytics":
        return <Analytics />;
      case "goals":
        return <Goals />;
      case "badges":
        return <Badges />;
      case "settings":
        return <Settings />;
      default:
        return <Today />;
    }
  }, [currentView]);

  return (
    <Box
      sx={{
        display: "flex",
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
            },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Mobile Menu Button */}
      <IconButton
        color="primary"
        onClick={handleDrawerToggle}
        sx={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 1200,
          display: { xs: "flex", md: "none" },
          backgroundColor: theme.palette.background.paper,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          "&:hover": {
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Fixed top-right area for timer and notifications */}
      <Box
        sx={{
          position: "fixed",
          top: { xs: 16, md: 24 },
          right: { xs: 16, md: 24 },
          zIndex: 1100,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {timer.sessionStartedAt && currentView !== "timer" && (
          <TimerChip
            isRunning={timer.isRunning}
            sessionType={timer.sessionType}
            profileColor={selectedProfile.color}
            sessionStartedAt={timer.sessionStartedAt}
            plannedMinutes={timer.plannedMinutes}
            pausedElapsedMs={timer.pausedElapsedMs || 0}
            onNavigate={handleTimerNavigate}
            currentView={currentView}
          />
        )}
        <Box
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: "50%",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <NotificationCenter />
        </Box>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 3, md: 5 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          maxWidth: { md: `calc(100vw - ${drawerWidth}px)` },
        }}
      >
        {renderContent}
      </Box>

      {/* Notification snackbar for real-time alerts */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="info"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
