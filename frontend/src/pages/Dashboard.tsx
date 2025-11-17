import React, { useCallback, useMemo } from "react";
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
} from "@mui/material";
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

    const getChipColor = () => {
      switch (sessionType) {
        case "WORK":
          return profileColor;
        case "SHORT_BREAK":
          return "#2e7d32";
        case "LONG_BREAK":
          return "#7b1fa2";
        default:
          return "primary";
      }
    };

    return (
      <Chip
        icon={<TimerIcon />}
        label={countdown}
        onClick={onNavigate}
        sx={{
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.9rem",
          bgcolor: getChipColor(),
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

  const getChipColor = () => {
    switch (sessionType) {
      case "WORK":
        return profileColor;
      case "SHORT_BREAK":
        return "#2e7d32";
      case "LONG_BREAK":
        return "#7b1fa2";
      default:
        return "primary";
    }
  };

  return (
    <Chip
      label="•"
      size="small"
      sx={{
        fontSize: "0.7rem",
        height: 20,
        bgcolor: getChipColor(),
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

  const getCurrentView = ():
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
    if (path === "/tasks") return "tasks";
    if (path === "/categories") return "categories";
    if (path === "/matrix") return "matrix";
    if (path === "/statistics") return "statistics";
    if (path === "/timer") return "timer";
    if (path === "/analytics") return "analytics";
    if (path === "/goals") return "goals";
    if (path === "/badges") return "badges";
    if (path === "/settings") return "settings";
    return "tasks";
  };

  const currentView = getCurrentView();

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMenuItemClick = useCallback(
    (
      view:
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
      navigate(`/${view}`);
      if (isMobile) {
        setMobileOpen(false);
      }
    },
    [isMobile, navigate]
  );

  const handleTimerNavigate = useCallback(() => {
    navigate("/timer");
  }, [navigate]);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2.5, py: 2 }}>
        <Typography variant="h5" noWrap sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
          Lockin
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.1) }} />
      <List sx={{ px: 1.5, pt: 2 }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => handleMenuItemClick("tasks")}
            selected={currentView === "tasks"}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.18),
                },
                '& .MuiListItemIcon-root': {
                  color: theme.palette.primary.main,
                },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <TaskIcon />
            </ListItemIcon>
            <ListItemText primary="Tasks" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        {[
          { view: "categories", icon: <CategoryIcon />, label: "Categories" },
          { view: "matrix", icon: <GridOnIcon />, label: "Matrix" },
          { view: "statistics", icon: <StatsIcon />, label: "Statistics" },
        ].map(({ view, icon, label }) => (
          <ListItem key={view} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleMenuItemClick(view as any)}
              selected={currentView === view}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.18) },
                  '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
                },
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
              <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => handleMenuItemClick("timer")}
            selected={currentView === "timer"}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.18) },
                '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              },
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <TimerIcon />
            </ListItemIcon>
            <ListItemText primary="Timer" primaryTypographyProps={{ fontWeight: 500 }} />
            <SidebarTimerIndicator
              isRunning={timer.isRunning}
              sessionType={timer.sessionType}
              profileColor={selectedProfile.color}
            />
          </ListItemButton>
        </ListItem>
        {[
          { view: "analytics", icon: <AnalyticsIcon />, label: "Analytics" },
          { view: "goals", icon: <GoalsIcon />, label: "Goals" },
          { view: "badges", icon: <BadgesIcon />, label: "Badges" },
        ].map(({ view, icon, label }) => (
          <ListItem key={view} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleMenuItemClick(view as any)}
              selected={currentView === view}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.18) },
                  '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
                },
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
              <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.primary.main, 0.1) }} />
      <List sx={{ px: 1.5, pb: 2 }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => handleMenuItemClick("settings")}
            selected={currentView === "settings"}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.18) },
                '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              },
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={logout}
            sx={{
              borderRadius: 2,
              '&:hover': {
                backgroundColor: alpha('#EF4444', 0.08),
                color: '#EF4444',
                '& .MuiListItemIcon-root': { color: '#EF4444' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  const renderContent = useMemo(() => {
    switch (currentView) {
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
        return <Tasks />;
    }
  }, [currentView]);

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          boxShadow: `0 1px 3px ${alpha(theme.palette.primary.main, 0.05)}`,
        }}
      >
        <Toolbar sx={{ py: 1.5 }}>
          <IconButton
            color="primary"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            Welcome, {user?.firstName || user?.email || "User"}
          </Typography>

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
        </Toolbar>
      </AppBar>
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
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      {/*        <TaskLinkingDiagnostic /> */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {renderContent}
      </Box>
    </Box>
  );
};

export default Dashboard;
