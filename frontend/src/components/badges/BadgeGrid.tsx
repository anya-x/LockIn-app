import React from "react";
import { Grid } from "@mui/material";
import { BadgeCard } from "./BadgeCard";
import type { Badge } from "../../types/badge";

interface BadgeGridProps {
  badges: Badge[];
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({ badges }) => {
  // Sort badges: earned first, then by requirement
  const sortedBadges = [...badges].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    return a.requirement - b.requirement;
  });

  return (
    <Grid container spacing={3}>
      {sortedBadges.map((badge) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={badge.badgeType}>
          <BadgeCard badge={badge} />
        </Grid>
      ))}
    </Grid>
  );
};
