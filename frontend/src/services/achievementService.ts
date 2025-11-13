import api from "./api";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "TASKS" | "FOCUS" | "GOALS" | "STREAK";
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  target: number;
  progressPercentage: number;
}

const achievementService = {
  getAchievements: () => {
    return api.get<Achievement[]>("/achievements");
  },
};

export default achievementService;
