import api from "./api";

export interface Badge {
  id?: number;
  badgeType: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  earnedAt?: string;
  earned: boolean;
}

export type BadgeCategory = "TASK" | "POMODORO" | "GOAL";

const badgeService = {
  getUserBadges: (earnedOnly: boolean = false) => {
    return api.get<Badge[]>(`/badges?earnedOnly=${earnedOnly}`);
  },

  getEarnedBadges: () => {
    return api.get<Badge[]>("/badges?earnedOnly=true");
  },
};

export default badgeService;
