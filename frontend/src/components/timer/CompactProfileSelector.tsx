import React, { useState } from "react";
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  Paper,
  Collapse,
  IconButton,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Science as ScienceIcon,
  Verified as VerifiedIcon,
} from "@mui/icons-material";
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
  const theme = useTheme();
  const [showResearch, setShowResearch] = useState(false);

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

      {/* Selected Profile Details */}
      <Paper
        elevation={0}
        sx={{
          mt: 2,
          p: 2,
          bgcolor: alpha(selectedProfile.color, 0.08),
          border: `1px solid ${alpha(selectedProfile.color, 0.2)}`,
          borderRadius: 2,
        }}
      >
        {/* Header */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Typography variant="h6" sx={{ fontSize: "1.1rem" }}>
            {selectedProfile.icon} {selectedProfile.name}
          </Typography>
          {selectedProfile.verified && (
            <Tooltip title="Research-backed technique">
              <VerifiedIcon
                sx={{ fontSize: 16, color: theme.palette.success.main }}
              />
            </Tooltip>
          )}
          <Typography
            variant="caption"
            sx={{
              ml: "auto",
              bgcolor: alpha(selectedProfile.color, 0.2),
              color: selectedProfile.color,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            {selectedProfile.work}m / {selectedProfile.break}m / {selectedProfile.longBreak}m
          </Typography>
        </Box>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {selectedProfile.description}
        </Typography>

        {/* Use Cases */}
        <Typography
          variant="caption"
          fontWeight={600}
          color="text.secondary"
          sx={{ display: "block", mb: 0.75 }}
        >
          BEST FOR
        </Typography>
        <Box display="flex" gap={0.5} flexWrap="wrap" mb={1.5}>
          {selectedProfile.useCases.map((useCase, index) => (
            <Chip
              key={index}
              label={useCase}
              size="small"
              sx={{
                fontSize: "0.7rem",
                height: 24,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }}
            />
          ))}
        </Box>

        {/* Tips */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: theme.palette.background.paper,
            borderRadius: 1.5,
            borderLeft: `3px solid ${selectedProfile.color}`,
          }}
        >
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            💡 TIP
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
            {selectedProfile.tips}
          </Typography>
        </Box>

        {/* Research Toggle */}
        <Box
          sx={{
            mt: 1.5,
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => setShowResearch(!showResearch)}
        >
          <ScienceIcon sx={{ fontSize: 16, color: "text.secondary", mr: 0.5 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {showResearch ? "Hide" : "Show"} research background
          </Typography>
          <IconButton
            size="small"
            sx={{
              ml: 0.5,
              p: 0,
              transform: showResearch ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <ExpandMoreIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Collapse in={showResearch}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, fontSize: "0.8rem", fontStyle: "italic" }}
          >
            {selectedProfile.research}
          </Typography>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default CompactProfileSelector;
