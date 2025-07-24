import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid as Grid,
  Switch,
  FormControlLabel,
  Paper,
  useTheme,
  alpha,
  Stack,
} from "@mui/material";
import {
  Palette as PaletteIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useAppTheme } from "../context/ThemeContext";
import type { ThemeColor } from "../themes/themeConfig";
import PageHeader from "../components/shared/PageHeader";

const Settings: React.FC = () => {
  const theme = useTheme();
  const { themeColor, themeMode, setThemeColor, toggleThemeMode, themeName } =
    useAppTheme();

  const themeOptions: Array<{
    id: ThemeColor;
    name: string;
    description: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
  }> = [
    {
      id: "indigo",
      name: "Indigo",
      description: "Professional and modern",
      primaryColor: "#667BC6",
      secondaryColor: "#7986CB",
      backgroundColor: "#F5F7FF",
    },
    {
      id: "pink",
      name: "Pink Mauve",
      description: "Elegant and sophisticated",
      primaryColor: "#997A8D",
      secondaryColor: "#B89CAC",
      backgroundColor: "#FDF8FB",
    },
    {
      id: "sage",
      name: "Sage Green",
      description: "Fresh and productive",
      primaryColor: "#9CAF88",
      secondaryColor: "#B8C9A8",
      backgroundColor: "#F8FAF6",
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Customize your Lockin experience"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <PaletteIcon
              sx={{ color: theme.palette.primary.main, fontSize: 28 }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Theme Color
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose your preferred color palette
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {themeOptions.map((option) => (
              <Grid key={option.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper
                  onClick={() => setThemeColor(option.id)}
                  sx={{
                    p: 2.5,
                    cursor: "pointer",
                    border:
                      themeColor === option.id
                        ? `2px solid ${theme.palette.primary.main}`
                        : "2px solid transparent",
                    backgroundColor:
                      themeColor === option.id
                        ? alpha(theme.palette.primary.main, 0.05)
                        : "transparent",
                    transition: "all 0.2s ease",
                    position: "relative",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 3,
                    },
                  }}
                >
                  {themeColor === option.id && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: theme.palette.primary.main,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CheckIcon sx={{ fontSize: 18, color: "white" }} />
                    </Box>
                  )}

                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {option.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 2 }}
                  >
                    {option.description}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        width: "100%",
                        height: 40,
                        borderRadius: 1.5,
                        backgroundColor: option.primaryColor,
                        boxShadow: 1,
                      }}
                    />
                    <Box
                      sx={{
                        width: "100%",
                        height: 40,
                        borderRadius: 1.5,
                        backgroundColor: option.secondaryColor,
                        boxShadow: 1,
                      }}
                    />
                  </Stack>

                  <Box
                    sx={{
                      width: "100%",
                      height: 24,
                      borderRadius: 1,
                      backgroundColor: option.backgroundColor,
                      border: "1px solid",
                      borderColor: alpha(option.primaryColor, 0.2),
                    }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {themeMode === "dark" ? (
                <DarkModeIcon
                  sx={{ color: theme.palette.primary.main, fontSize: 28 }}
                />
              ) : (
                <LightModeIcon
                  sx={{ color: theme.palette.primary.main, fontSize: 28 }}
                />
              )}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Dark Mode
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Toggle dark mode for {themeName} theme
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={themeMode === "dark"}
                  onChange={toggleThemeMode}
                />
              }
              label=""
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;
