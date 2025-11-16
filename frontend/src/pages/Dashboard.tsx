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
  Avatar,
  ListSubheader,
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
  LockOpen as LockOpenIcon,
} from "@mui/icons-material";
import { SAGE_COLORS } from "../theme/theme";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTimer } from "../context/TimerContext";
import TaskList from "./Tasks";
import CategoryList from "./Categories";
import EisenhowerMatrix from "./Matrix";
import FocusStatistics from "./Statistics";
import PomodoroTimer from "./PomodoroTimer";
import TaskLinkingDiagnostic from "../components/TaskLinkingDiagnosic";
import Categories from "./Categories";
import Matrix from "./Matrix";
import Statistics from "./Statistics";
import Tasks from "./Tasks";
import Analytics from "./Analytics";
import Goals from "./Goals";

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
          return SAGE_COLORS.sage[600];
        case "LONG_BREAK":
          return SAGE_COLORS.gold[500];
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
        return SAGE_COLORS.sage[600];
      case "LONG_BREAK":
        return SAGE_COLORS.gold[500];
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
    | "goals" => {
    const path = location.pathname;
    if (path === "/tasks") return "tasks";
    if (path === "/categories") return "categories";
    if (path === "/matrix") return "matrix";
    if (path === "/statistics") return "statistics";
    if (path === "/timer") return "timer";
    if (path === "/analytics") return "analytics";
    if (path === "/goals") return "goals";
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
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Brand Area */}
      <Box
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${SAGE_COLORS.sage[500]} 0%, ${SAGE_COLORS.sage[700]} 100%)`,
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Avatar
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.2)",
              width: 40,
              height: 40,
              mr: 1.5,
            }}
          >
            <LockOpenIcon />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            LockIn
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{
            opacity: 0.9,
            fontSize: "0.75rem",
            letterSpacing: "0.5px",
          }}
        >
          Productivity Hub
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: "auto", px: 2, py: 2 }}>
        <List
          subheader={
            <ListSubheader
              sx={{
                bgcolor: "transparent",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: SAGE_COLORS.neutral[600],
                px: 2,
                py: 1,
              }}
            >
              Workspace
            </ListSubheader>
          }
        >
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleMenuItemClick("tasks")}
              selected={currentView === "tasks"}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon>
                <TaskIcon />
              </ListItemIcon>
              <ListItemText primary="Tasks" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleMenuItemClick("categories")}
              selected={currentView === "categories"}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon>
                <CategoryIcon />
              </ListItemIcon>
              <ListItemText primary="Categories" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleMenuItemClick("matrix")}
              selected={currentView === "matrix"}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon>
                <GridOnIcon />
              </ListItemIcon>
              <ListItemText primary="Matrix" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleMenuItemClick("goals")}
              selected={currentView === "goals"}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon>
                <GoalsIcon />
              </ListItemIcon>
              <ListItemText primary="Goals" />
            </ListItemButton>
          </ListItem>
        </List>

        <List
          subheader={
            <ListSubheader
              sx={{
                bgcolor: "transparent",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: SAGE_COLORS.neutral[600],
                px: 2,
                py: 1,
                mt: 2,
              }}
            >
              Focus & Insights
            </ListSubheader>
          }
        >
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleMenuItemClick("timer")}
              selected={currentView === "timer"}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon>
                <TimerIcon />
              </ListItemIcon>
              <ListItemText primary="Timer" />
              <SidebarTimerIndicator
                isRunning={timer.isRunning}
                sessionType={timer.sessionType}
                profileColor={selectedProfile.color}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleMenuItemClick("statistics")}
              selected={currentView === "statistics"}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon>
                <StatsIcon />
              </ListItemIcon>
              <ListItemText primary="Statistics" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleMenuItemClick("analytics")}
              selected={currentView === "analytics"}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon>
                <AnalyticsIcon />
              </ListItemIcon>
              <ListItemText primary="Analytics" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* User Section */}
      <Box sx={{ borderTop: `1px solid ${SAGE_COLORS.neutral[200]}`, p: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 2,
            bgcolor: SAGE_COLORS.sage[50],
            borderRadius: 2,
            mb: 1,
          }}
        >
          <Avatar
            sx={{
              bgcolor: SAGE_COLORS.sage[500],
              width: 36,
              height: 36,
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {user?.firstName?.[0] || user?.email?.[0] || "U"}
          </Avatar>
          <Box sx={{ ml: 1.5, flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: SAGE_COLORS.neutral[900],
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.firstName || "User"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: SAGE_COLORS.neutral[600],
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {user?.email}
            </Typography>
          </Box>
        </Box>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 2,
            color: SAGE_COLORS.terracotta[600],
            "&:hover": {
              bgcolor: SAGE_COLORS.terracotta[50],
            },
          }}
        >
          <ListItemIcon sx={{ color: SAGE_COLORS.terracotta[600] }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
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
      default:
        return <Tasks />;
    }
  }, [currentView]);

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
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
