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
} from "@mui/material";
import {
  Menu as MenuIcon,
  Assignment as TaskIcon,
  Category as CategoryIcon,
  GridOn as GridOnIcon,
  ExitToApp as LogoutIcon,
  Timer as TimerIcon,
  BarChart as StatsIcon,
} from "@mui/icons-material";
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
    | "timer" => {
    const path = location.pathname;
    if (path === "/tasks") return "tasks";
    if (path === "/categories") return "categories";
    if (path === "/matrix") return "matrix";
    if (path === "/statistics") return "statistics";
    if (path === "/timer") return "timer";
    return "tasks";
  };

  const currentView = getCurrentView();

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMenuItemClick = useCallback(
    (view: "tasks" | "categories" | "matrix" | "statistics" | "timer") => {
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
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Lockin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleMenuItemClick("tasks")}
            selected={currentView === "tasks"}
          >
            <ListItemIcon>
              <TaskIcon />
            </ListItemIcon>
            <ListItemText primary="Tasks" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleMenuItemClick("categories")}
            selected={currentView === "categories"}
          >
            <ListItemIcon>
              <CategoryIcon />
            </ListItemIcon>
            <ListItemText primary="Categories" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleMenuItemClick("matrix")}
            selected={currentView === "matrix"}
          >
            <ListItemIcon>
              <GridOnIcon />
            </ListItemIcon>
            <ListItemText primary="Matrix" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleMenuItemClick("statistics")}
            selected={currentView === "statistics"}
          >
            <ListItemIcon>
              <StatsIcon />
            </ListItemIcon>
            <ListItemText primary="Statistics" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleMenuItemClick("timer")}
            selected={currentView === "timer"}
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
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={logout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  const renderContent = () => {
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
      default:
        return <Tasks />;
    }
  };

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
        {renderContent()}
      </Box>
    </Box>
  );
};

export default Dashboard;
