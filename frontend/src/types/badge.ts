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

export interface BadgeStats {
  totalBadges: number;
  earnedBadges: number;
  progressPercentage: number;
}
