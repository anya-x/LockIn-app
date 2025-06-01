import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  List,
  ListItemText,
  Divider,
  Alert,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ScienceIcon from "@mui/icons-material/Science";
import VerifiedIcon from "@mui/icons-material/Verified";
import { FOCUS_PROFILES, type FocusProfile } from "../config/focusProfiles";

interface ProfileSelectorProps {
  selectedProfile: FocusProfile;
  onProfileChange: (profile: FocusProfile) => void;
  disabled?: boolean;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  selectedProfile,
  onProfileChange,
  disabled = false,
}) => {
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [dialogProfile, setDialogProfile] = useState<FocusProfile | null>(null);

  const verifiedProfiles = FOCUS_PROFILES.filter((p) => p.verified);
  const experimentalProfiles = FOCUS_PROFILES.filter((p) => !p.verified);

  const handleInfoClick = (profile: FocusProfile, event: React.MouseEvent) => {
    event.stopPropagation();
    setDialogProfile(profile);
    setInfoDialogOpen(true);
  };

  const handleProfileChange = (profileId: string) => {
    const profile = FOCUS_PROFILES.find((p) => p.id === profileId);
    if (profile) {
      onProfileChange(profile);
      localStorage.setItem("lastFocusProfile", profileId);
    }
  };

  return (
    <>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Focus Cycle</InputLabel>
        <Select
          value={selectedProfile.id}
          onChange={(e) => handleProfileChange(e.target.value)}
          disabled={disabled}
          label="Focus Cycle"
        >
          {verifiedProfiles.map((profile) => (
            <MenuItem key={profile.id} value={profile.id}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                width="100%"
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <span style={{ fontSize: "1.5rem" }}>{profile.icon}</span>
                  <Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="body1" fontWeight={500}>
                        {profile.name}
                      </Typography>
                      <VerifiedIcon
                        sx={{ fontSize: 16, color: "success.main" }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      {profile.cycleName} • {profile.description}
                    </Typography>
                  </Box>
                </Box>
                <Tooltip title="View details" placement="left">
                  <IconButton
                    size="small"
                    onClick={(e) => handleInfoClick(profile, e)}
                    sx={{ ml: 1 }}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </MenuItem>
          ))}

          <Divider sx={{ my: 1 }}>
            <Chip
              icon={<ScienceIcon />}
              label="Community Favorites"
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
          </Divider>

          {experimentalProfiles.map((profile) => (
            <MenuItem key={profile.id} value={profile.id}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                width="100%"
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <span style={{ fontSize: "1.5rem" }}>{profile.icon}</span>
                  <Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="body1" fontWeight={500}>
                        {profile.name}
                      </Typography>
                      <Chip
                        label="Popular"
                        size="small"
                        sx={{
                          fontSize: "0.65rem",
                          height: 18,
                          bgcolor: "action.hover",
                          color: "text.secondary",
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      {profile.cycleName} • {profile.description}
                    </Typography>
                  </Box>
                </Box>
                <Tooltip title="View details" placement="left">
                  <IconButton
                    size="small"
                    onClick={(e) => handleInfoClick(profile, e)}
                    sx={{ ml: 1 }}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </MenuItem>
          ))}
        </Select>

        <Box sx={{ mt: 1.5, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="body2" fontWeight={600}>
              {selectedProfile.work} min focus → {selectedProfile.break} min
              break
            </Typography>
            {!selectedProfile.verified && (
              <Chip
                label="Community Favorite"
                size="small"
                sx={{
                  fontSize: "0.65rem",
                  height: 20,
                  bgcolor: "warning.lighter",
                  color: "warning.dark",
                }}
              />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" display="block">
            💡 {selectedProfile.tips}
          </Typography>
        </Box>

        {!selectedProfile.verified && (
          <Alert
            severity="info"
            variant="outlined"
            sx={{ mt: 1.5, fontSize: "0.8rem" }}
          >
            <Typography variant="caption">
              This timing comes from productivity tracking data, not controlled
              studies. Many users find it helpful-try it and see what works for
              you!
            </Typography>
          </Alert>
        )}
      </FormControl>

      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {dialogProfile && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1.5}>
                <span style={{ fontSize: "2rem" }}>{dialogProfile.icon}</span>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6">{dialogProfile.name}</Typography>
                    {dialogProfile.verified ? (
                      <VerifiedIcon
                        sx={{ fontSize: 20, color: "success.main" }}
                      />
                    ) : (
                      <Chip
                        label="Community Favorite"
                        size="small"
                        sx={{
                          fontSize: "0.7rem",
                          height: 22,
                          bgcolor: "warning.lighter",
                          color: "warning.dark",
                        }}
                      />
                    )}
                  </Box>
                  <Chip
                    label={dialogProfile.cycleName}
                    size="small"
                    sx={{
                      mt: 0.5,
                      bgcolor: dialogProfile.color,
                      color: "white",
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Timing Pattern
                </Typography>
                <Typography variant="body1">
                  <strong>{dialogProfile.work} minutes</strong> work →{" "}
                  <strong>{dialogProfile.break} minutes</strong> break
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Long break: {dialogProfile.longBreak} minutes (after 4 cycles)
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Description
                </Typography>
                <Typography variant="body2">
                  {dialogProfile.description}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Best For
                </Typography>
                <List dense disablePadding>
                  {dialogProfile.useCases.map((useCase, index) => (
                    <ListItemText
                      key={index}
                      primary={
                        <Typography variant="body2">• {useCase}</Typography>
                      }
                    />
                  ))}
                </List>
              </Box>

              <Box
                sx={{ mb: 3, p: 2, bgcolor: "info.lighter", borderRadius: 1 }}
              >
                <Typography variant="subtitle2" color="info.dark" gutterBottom>
                  💡 Pro Tips
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {dialogProfile.tips}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 2,
                  bgcolor: dialogProfile.verified
                    ? "success.lighter"
                    : "warning.lighter",
                  borderRadius: 1,
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  {dialogProfile.verified ? (
                    <>
                      <VerifiedIcon
                        sx={{ fontSize: 18, color: "success.dark" }}
                      />
                      <Typography
                        variant="subtitle2"
                        color="success.dark"
                        fontWeight={600}
                      >
                        Research-Backed
                      </Typography>
                    </>
                  ) : (
                    <>
                      <ScienceIcon
                        sx={{ fontSize: 18, color: "warning.dark" }}
                      />
                      <Typography
                        variant="subtitle2"
                        color="warning.dark"
                        fontWeight={600}
                      >
                        Community Favorite
                      </Typography>
                    </>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontStyle="italic"
                >
                  {dialogProfile.research}
                </Typography>
              </Box>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleProfileChange(dialogProfile.id);
                  setInfoDialogOpen(false);
                }}
                disabled={selectedProfile.id === dialogProfile.id}
              >
                {selectedProfile.id === dialogProfile.id
                  ? "Currently Selected"
                  : "Use This Cycle"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default ProfileSelector;
