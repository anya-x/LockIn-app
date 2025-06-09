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
  isRunning: boolean;
  sessionType: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  sessionId: number | null;
  selectedTaskId: number | null;
  selectedProfile: string;
  completionCounter: number;
  sessionStartedAt: number | null;
  plannedMinutes: number;
}

interface TimerContextType {
  timer: TimerState;
  selectedProfile: FocusProfile;
  startTimer: (taskId: number | null, notes?: string) => Promise<void>;
  pauseTimer: () => void;
  stopTimer: (notes?: string) => Promise<void>;
  setSessionType: (type: "WORK" | "SHORT_BREAK" | "LONG_BREAK") => void;
  setProfile: (profile: FocusProfile) => void;
  getTimerColor: () => string;
  saveSessionNotes: (notes: string) => Promise<void>;
  onSessionComplete?: () => void;
  triggerCompletion: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within TimerProvider");
  }
  return context;
};

export const TimerProvider: React.FC<{
  children: React.ReactNode;
  onSessionComplete?: () => void;
}> = ({ children, onSessionComplete }) => {
  const [selectedProfile, setSelectedProfile] = useState<FocusProfile>(() => {
    const savedProfile = localStorage.getItem("lastFocusProfile");
    return (
      FOCUS_PROFILES.find((p) => p.id === savedProfile) || getDefaultProfile()
    );
  });

  const getDefaultTimerState = useCallback((): TimerState => {
    return {
      isRunning: false,
      sessionType: "WORK",
      sessionId: null,
      selectedTaskId: null,
      selectedProfile: selectedProfile.id,
      completionCounter: 0,
      sessionStartedAt: null,
      plannedMinutes: selectedProfile.work,
    };
  }, [selectedProfile]);

  const [timer, setTimer] = useState<TimerState>(() => {
    const saved = localStorage.getItem("timerState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          isRunning: parsed.isRunning || false,
          sessionType: parsed.sessionType || "WORK",
          sessionId: parsed.sessionId || null,
          selectedTaskId: parsed.selectedTaskId || null,
          selectedProfile: parsed.selectedProfile || selectedProfile.id,
          completionCounter: parsed.completionCounter || 0,
          sessionStartedAt: parsed.sessionStartedAt || null,
          plannedMinutes: parsed.plannedMinutes || selectedProfile.work,
        };
      } catch {
        return getDefaultTimerState();
      }
    }
    return getDefaultTimerState();
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationShownRef = useRef(false);
  const titleUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/notification.wav");
  }, []);

  useEffect(() => {
    if (timer.isRunning && timer.sessionStartedAt) {
      const updateTitle = () => {
        const elapsedMs = Date.now() - (timer.sessionStartedAt || Date.now());
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const totalSeconds = timer.plannedMinutes * 60;
        const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        const mins = String(minutes).padStart(2, "0");
        const secs = String(seconds).padStart(2, "0");
        const sessionLabel =
          timer.sessionType === "WORK"
            ? "Focus"
            : timer.sessionType === "SHORT_BREAK"
            ? "Break"
            : "Long Break";

        document.title = `${mins}:${secs} ${sessionLabel} - Lockin`;
      };

      updateTitle();

      titleUpdateIntervalRef.current = setInterval(updateTitle, 1000);

      return () => {
        if (titleUpdateIntervalRef.current) {
          clearInterval(titleUpdateIntervalRef.current);
        }
      };
    } else {
      document.title = "Lockin";
      if (titleUpdateIntervalRef.current) {
        clearInterval(titleUpdateIntervalRef.current);
        titleUpdateIntervalRef.current = null;
      }
    }
  }, [
    timer.isRunning,
    timer.sessionStartedAt,
    timer.plannedMinutes,
    timer.sessionType,
  ]);

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


  const triggerCompletion = useCallback(async () => {
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
        await sessionService.completeSession(
          timer.sessionId,
          timer.plannedMinutes
        );

        if (onSessionComplete) {
          onSessionComplete();
        }
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }

    if (timer.sessionType === "WORK") {
      const nextType: "SHORT_BREAK" | "LONG_BREAK" =
        Math.floor(Math.random() * 4) === 3 ? "LONG_BREAK" : "SHORT_BREAK";
      const nextMinutes = getMinutesForProfile(selectedProfile, nextType);

      setTimer({
        isRunning: false,
        sessionType: nextType,
        sessionId: null,
        selectedTaskId: timer.selectedTaskId,
        selectedProfile: selectedProfile.id,
        completionCounter: timer.completionCounter + 1,
        sessionStartedAt: null,
        plannedMinutes: nextMinutes,
      });
    } else {
      const nextMinutes = getMinutesForProfile(selectedProfile, "WORK");
      setTimer({
        isRunning: false,
        sessionType: "WORK",
        sessionId: null,
        selectedTaskId: timer.selectedTaskId,
        selectedProfile: selectedProfile.id,
        completionCounter: timer.completionCounter + 1,
        sessionStartedAt: null,
        plannedMinutes: nextMinutes,
      });
    }

    setTimeout(() => {
      notificationShownRef.current = false;
    }, 2000);
  }, [timer, selectedProfile, onSessionComplete]);

  const startTimer = async (taskId: number | null, notes?: string) => {
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
        selectedTaskId: taskId,
        sessionStartedAt: Date.now(),
        plannedMinutes: plannedMinutes,
      }));

      if (notes && notes.trim() !== "") {
        try {
          await sessionService.updateSessionNotes(response.id, notes);
        } catch (error) {
          console.error("Failed to save session notes:", error);
        }
      }
    } catch (error) {
      console.error("Failed to start session:", error);
      throw error;
    }
  };

  const pauseTimer = () => {
    setTimer((prev) => ({
      ...prev,
      isRunning: !prev.isRunning,
    }));
  };

  const stopTimer = async (notes?: string) => {
    if (timer.sessionId) {
      try {
        const elapsedMs = Date.now() - (timer.sessionStartedAt || Date.now());
        const actualMinutes = Math.floor(elapsedMs / 60000);

        await sessionService.updateSession(timer.sessionId, actualMinutes);

        if (notes && notes.trim() !== "") {
          await sessionService.updateSessionNotes(timer.sessionId, notes);
        }
      } catch (error) {
        console.error("Failed to update stopped session:", error);
      }
    }

    const minutes = getMinutesForProfile(selectedProfile, timer.sessionType);
    setTimer({
      isRunning: false,
      sessionType: timer.sessionType,
      sessionId: null,
      selectedTaskId: null,
      selectedProfile: selectedProfile.id,
      completionCounter: timer.completionCounter,
      sessionStartedAt: null,
      plannedMinutes: minutes,
    });

    localStorage.removeItem("timerState");
  };

  const saveSessionNotes = async (notes: string) => {
    if (timer.sessionId) {
      try {
        await sessionService.updateSessionNotes(timer.sessionId, notes);
      } catch (error) {
        console.error("Failed to save session notes:", error);
        throw error;
      }
    }
  };

  const setSessionType = (type: "WORK" | "SHORT_BREAK" | "LONG_BREAK") => {
    if (!timer.isRunning) {
      const minutes = getMinutesForProfile(selectedProfile, type);
      setTimer((prev) => ({
        ...prev,
        sessionType: type,
        plannedMinutes: minutes,
        sessionStartedAt: null,
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
        selectedProfile: profile.id,
        plannedMinutes: minutes,
      }));
    }
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
    getTimerColor,
    saveSessionNotes,
    onSessionComplete,
    triggerCompletion,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
};
