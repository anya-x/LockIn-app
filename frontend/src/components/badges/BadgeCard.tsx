import React from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { Lock as LockIcon, CheckCircle as CheckIcon } from "@mui/icons-material";
import type { Badge } from "../../types/badge";

interface BadgeCardProps {
  badge: Badge;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  const isEarned = badge.earned;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        opacity: isEarned ? 1 : 0.6,
        transition: "all 0.3s ease",
        "&:hover": {
          transform: isEarned ? "translateY(-4px)" : "none",
          boxShadow: isEarned ? 6 : 1,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, textAlign: "center", p: 3 }}>
        {/* Badge Icon */}
        <Box
          sx={{
            fontSize: "4rem",
            mb: 2,
            filter: isEarned ? "none" : "grayscale(100%)",
          }}
        >
          {badge.icon}
        </Box>

        {/* Status Indicator */}
        <Box sx={{ position: "absolute", top: 12, right: 12 }}>
          {isEarned ? (
            <CheckIcon color="success" fontSize="small" />
          ) : (
            <LockIcon color="disabled" fontSize="small" />
          )}
        </Box>

        {/* Badge Name */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: isEarned ? "text.primary" : "text.disabled",
          }}
        >
          {badge.name}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, minHeight: 40 }}
        >
          {badge.description}
        </Typography>

        {/* Requirement */}
        <Chip
          label={`Requirement: ${badge.requirement}`}
          size="small"
          variant={isEarned ? "filled" : "outlined"}
          color={isEarned ? "primary" : "default"}
        />

        {/* Earned Date */}
        {isEarned && badge.earnedAt && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 2 }}
          >
            Earned:{" "}
            {new Date(badge.earnedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
