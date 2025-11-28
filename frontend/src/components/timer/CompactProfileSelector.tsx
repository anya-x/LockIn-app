import React from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { FOCUS_PROFILES, type FocusProfile } from "../../config/focusProfiles";

interface CompactProfileSelectorProps {
  selectedProfile: FocusProfile;
  onProfileChange: (profile: FocusProfile) => void;
  disabled?: boolean;
}

export const CompactProfileSelector: React.FC<CompactProfileSelectorProps> = ({
  selectedProfile,
  onProfileChange,
  disabled = false,
}) => {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: "text.secondary",
          mb: 1,
          fontWeight: 500,
        }}
      >
        Focus Cycle
      </Typography>
      <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
        {FOCUS_PROFILES.map((profile) => (
          <Tooltip
            key={profile.id}
            title={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {profile.name}
                </Typography>
                <Typography variant="caption">
                  {profile.work}min work / {profile.break}min break
                </Typography>
              </Box>
            }
            placement="top"
          >
            <Chip
              icon={<span style={{ fontSize: "1rem" }}>{profile.icon}</span>}
              label={profile.cycleName}
              onClick={() => !disabled && onProfileChange(profile)}
              variant={selectedProfile.id === profile.id ? "filled" : "outlined"}
              disabled={disabled}
              sx={{
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                ...(selectedProfile.id === profile.id && {
                  bgcolor: profile.color,
                  color: "white",
                  borderColor: profile.color,
                  "&:hover": {
                    bgcolor: profile.color,
                    opacity: 0.9,
                  },
                }),
                ...(!disabled &&
                  selectedProfile.id !== profile.id && {
                    "&:hover": {
                      borderColor: profile.color,
                      bgcolor: `${profile.color}15`,
                    },
                  }),
              }}
            />
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};

export default CompactProfileSelector;
