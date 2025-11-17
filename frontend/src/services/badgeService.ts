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
  /**
   * Get all badges for the authenticated user
   * @param earnedOnly - if true, only return earned badges; if false, return all badges
   */
  getUserBadges: (earnedOnly: boolean = false) => {
    return api.get<Badge[]>(`/badges?earnedOnly=${earnedOnly}`);
  },

  /**
   * Get only earned badges
   */
  getEarnedBadges: () => {
    return api.get<Badge[]>("/badges?earnedOnly=true");
  },
};

export default badgeService;
