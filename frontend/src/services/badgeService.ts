import axios from "axios";
import type { Badge, BadgeStats } from "../types/badge";

const API_URL = "/api/badges";

export const badgeService = {
  /**
   * Get all badges (earned and unearned)
   */
  async getAllBadges(): Promise<Badge[]> {
    const response = await axios.get<Badge[]>(`${API_URL}?earnedOnly=false`);
    return response.data;
  },

  /**
   * Get only earned badges
   */
  async getEarnedBadges(): Promise<Badge[]> {
    const response = await axios.get<Badge[]>(`${API_URL}?earnedOnly=true`);
    return response.data;
  },

  /**
   * Get badge statistics
   */
  async getBadgeStats(): Promise<BadgeStats> {
    const badges = await this.getAllBadges();
    const earnedBadges = badges.filter((b) => b.earned).length;
    const totalBadges = badges.length;

    return {
      totalBadges,
      earnedBadges,
      progressPercentage: Math.round((earnedBadges / totalBadges) * 100),
    };
  },
};
