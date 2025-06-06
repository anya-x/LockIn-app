import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { sessionService } from "../services/sessionService";
import {
  FOCUS_PROFILES,
  type FocusProfile,
  getDefaultProfile,
} from "../config/focusProfiles";

interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  sessionType: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  sessionId: number | null;
  initialMinutes: number;
  sessionStartTime: number | null;
  selectedTaskId: number | null;
  selectedProfile: string;
}

interface TimerContextType {
  timer: TimerState;
  selectedProfile: FocusProfile;
  startTimer: (taskId: number | null) => Promise<void>;
  pauseTimer: () => void;
  stopTimer: () => Promise<void>;
  setSessionType: (type: "WORK" | "SHORT_BREAK" | "LONG_BREAK") => void;
  setProfile: (profile: FocusProfile) => void;
  formatTime: () => string;
  getTimerColor: () => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within TimerProvider");
  }
  return context;
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<FocusProfile>(() => {
    const savedProfile = localStorage.getItem("lastFocusProfile");
    return (
      FOCUS_PROFILES.find((p) => p.id === savedProfile) || getDefaultProfile()
    );
  });

  const getDefaultTimerState = useCallback((): TimerState => {
    return {
      minutes: selectedProfile.work,
      seconds: 0,
      isRunning: false,
      sessionType: "WORK",
      sessionId: null,
      initialMinutes: selectedProfile.work,
      sessionStartTime: null,
      selectedTaskId: null,
      selectedProfile: selectedProfile.id,
    };
  }, [selectedProfile]);

  const [timer, setTimer] = useState<TimerState>(() => {
    const saved = localStorage.getItem("timerState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.sessionStartTime) {
          const elapsed = Math.floor(
            (Date.now() - parsed.sessionStartTime) / 1000
          );
          const totalElapsed = Math.floor(elapsed);
          const minutes = Math.floor(
            (parsed.minutes * 60 + parsed.seconds - totalElapsed) / 60
          );
          const seconds =
            (parsed.minutes * 60 + parsed.seconds - totalElapsed) % 60;

          if (minutes < 0 || (minutes === 0 && seconds <= 0)) {
            return {
              ...parsed,
              minutes: 0,
              seconds: 0,
              isRunning: false,
              sessionStartTime: null,
            };
          }

          return {
            ...parsed,
            minutes: Math.max(0, minutes),
            seconds: Math.max(0, seconds),
          };
        }
        return parsed;
      } catch {
        return getDefaultTimerState();
      }
    }
    return getDefaultTimerState();
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationShownRef = useRef(false);

  useEffect(() => {
    audioRef.current = new Audio("/notification.wav");
  }, []);

  useEffect(() => {
    localStorage.setItem("timerState", JSON.stringify(timer));
  }, [timer]);

  const getMinutesForProfile = (
    profile: FocusProfile,
    type: string
  ): number => {
    switch (type) {
      case "WORK":
        return profile.work;
      case "SHORT_BREAK":
        return profile.break;
      case "LONG_BREAK":
        return profile.longBreak;
      default:
        return profile.work;
    }
  };

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Failed to play sound:", error);
      });
    }
  };

  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/lockin-icon.png",
      });
    }
  };

  const handleTimerComplete = useCallback(async () => {
    console.log("⏰ Timer completed!");

    if (notificationShownRef.current) return;
    notificationShownRef.current = true;

    playSound();

    const title =
      timer.sessionType === "WORK"
        ? "Work session complete!"
        : "Break time over!";
    const body =
      timer.sessionType === "WORK"
        ? "Great work! Take a break."
        : "Time to get back to work!";

    showNotification(title, body);

    if (timer.sessionId) {
      try {
        const plannedMinutes = getMinutesForProfile(
          selectedProfile,
          timer.sessionType
        );
        await sessionService.completeSession(timer.sessionId, plannedMinutes);
        console.log("✅ Session saved to backend");
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }

    if (timer.sessionType === "WORK") {
      const nextType: "SHORT_BREAK" | "LONG_BREAK" =
        Math.floor(Math.random() * 4) === 3 ? "LONG_BREAK" : "SHORT_BREAK";
      const nextMinutes = getMinutesForProfile(selectedProfile, nextType);

      setTimer({
        minutes: nextMinutes,
        seconds: 0,
        isRunning: false,
        sessionType: nextType,
        sessionId: null,
        initialMinutes: nextMinutes,
        sessionStartTime: null,
        selectedTaskId: timer.selectedTaskId,
        selectedProfile: selectedProfile.id,
      });
    } else {
      const nextMinutes = getMinutesForProfile(selectedProfile, "WORK");
      setTimer({
        minutes: nextMinutes,
        seconds: 0,
        isRunning: false,
        sessionType: "WORK",
        sessionId: null,
        initialMinutes: nextMinutes,
        sessionStartTime: null,
        selectedTaskId: timer.selectedTaskId,
        selectedProfile: selectedProfile.id,
      });
    }

    setTimeout(() => {
      notificationShownRef.current = false;
    }, 2000);
  }, [timer, selectedProfile]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev.seconds === 0) {
            if (prev.minutes === 0) {
              handleTimerComplete();
              return {
                ...prev,
                isRunning: false,
                sessionStartTime: null,
              };
            }
            return {
              ...prev,
              minutes: prev.minutes - 1,
              seconds: 59,
            };
          }
          return {
            ...prev,
            seconds: prev.seconds - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, handleTimerComplete]);

  useEffect(() => {
    if (timer.isRunning) {
      const mins = String(timer.minutes).padStart(2, "0");
      const secs = String(timer.seconds).padStart(2, "0");
      const sessionLabel =
        timer.sessionType === "WORK"
          ? "Focus"
          : timer.sessionType === "SHORT_BREAK"
          ? "Break"
          : "Long Break";

      document.title = `${mins}:${secs} ${sessionLabel} - Lockin`;
    } else {
      document.title = "Lockin";
    }
  }, [timer.isRunning, timer.minutes, timer.seconds, timer.sessionType]);

  const startTimer = async (taskId: number | null) => {
    try {
      const plannedMinutes = getMinutesForProfile(
        selectedProfile,
        timer.sessionType
      );

      const response = await sessionService.startSession({
        plannedMinutes: plannedMinutes,
        sessionType: timer.sessionType,
        taskId: taskId,
        profileName: selectedProfile.id,
      });

      setTimer((prev) => ({
        ...prev,
        isRunning: true,
        sessionId: response.id,
        initialMinutes: plannedMinutes,
        sessionStartTime: Date.now(),
        selectedTaskId: taskId,
      }));

      console.log("✅ Timer started, session ID:", response.id);
    } catch (error) {
      console.error("Failed to start session:", error);
      throw error;
    }
  };

  const pauseTimer = () => {
    setTimer((prev) => {
      const newIsRunning = !prev.isRunning;

      return {
        ...prev,
        isRunning: newIsRunning,
        sessionStartTime: newIsRunning ? Date.now() : null,
      };
    });
  };

  const stopTimer = async () => {
    if (timer.sessionId) {
      try {
        const actualMinutes = Math.floor(
          (timer.initialMinutes * 60 - (timer.minutes * 60 + timer.seconds)) /
            60
        );

        await sessionService.updateSession(timer.sessionId, actualMinutes);
        console.log("🛑 Session stopped and updated (not completed)");
      } catch (error) {
        console.error("Failed to update stopped session:", error);
      }
    }

    const minutes = getMinutesForProfile(selectedProfile, timer.sessionType);
    setTimer({
      minutes,
      seconds: 0,
      isRunning: false,
      sessionType: timer.sessionType,
      sessionId: null,
      initialMinutes: minutes,
      sessionStartTime: null,
      selectedTaskId: null,
      selectedProfile: selectedProfile.id,
    });

    localStorage.removeItem("timerState");
  };

  const setSessionType = (type: "WORK" | "SHORT_BREAK" | "LONG_BREAK") => {
    if (!timer.isRunning) {
      const minutes = getMinutesForProfile(selectedProfile, type);
      setTimer((prev) => ({
        ...prev,
        sessionType: type,
        minutes,
        seconds: 0,
        initialMinutes: minutes,
      }));
    }
  };

  const setProfile = (profile: FocusProfile) => {
    setSelectedProfile(profile);
    localStorage.setItem("lastFocusProfile", profile.id);

    if (!timer.isRunning) {
      const minutes = getMinutesForProfile(profile, timer.sessionType);
      setTimer((prev) => ({
        ...prev,
        minutes,
        seconds: 0,
        selectedProfile: profile.id,
        initialMinutes: minutes,
      }));
    }
  };

  const formatTime = (): string => {
    const mins = String(timer.minutes).padStart(2, "0");
    const secs = String(timer.seconds).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const getTimerColor = () => {
    if (!timer.isRunning) return "text.primary";

    switch (timer.sessionType) {
      case "WORK":
        return selectedProfile.color;
      case "SHORT_BREAK":
        return "success.main";
      case "LONG_BREAK":
        return "#7b1fa2";
      default:
        return "text.primary";
    }
  };

  const value: TimerContextType = {
    timer,
    selectedProfile,
    startTimer,
    pauseTimer,
    stopTimer,
    setSessionType,
    setProfile,
    formatTime,
    getTimerColor,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
};
