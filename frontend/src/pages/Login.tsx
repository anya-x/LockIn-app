import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  LockOpen as LockOpenIcon,
} from "@mui/icons-material";
import { SAGE_COLORS } from "../theme/theme";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/tasks";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        background: `linear-gradient(135deg, ${SAGE_COLORS.sage[100]} 0%, ${SAGE_COLORS.neutral[100]} 100%)`,
      }}
    >
      {/* Left side - Branding */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: `linear-gradient(135deg, ${SAGE_COLORS.sage[500]} 0%, ${SAGE_COLORS.sage[700]} 100%)`,
          color: "white",
          p: 8,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-10%",
            right: "-10%",
            width: "40%",
            height: "40%",
            borderRadius: "50%",
            background: `rgba(255, 255, 255, 0.1)`,
            filter: "blur(60px)",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: "-15%",
            left: "-10%",
            width: "50%",
            height: "50%",
            borderRadius: "50%",
            background: `rgba(255, 255, 255, 0.08)`,
            filter: "blur(80px)",
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: "24px",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 4,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            }}
          >
            <LockOpenIcon sx={{ fontSize: 48, color: "white" }} />
          </Box>

          <Typography
            variant="h2"
            sx={{
              mb: 2,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            LockIn
          </Typography>

          <Typography
            variant="h5"
            sx={{
              opacity: 0.95,
              fontWeight: 400,
              maxWidth: 400,
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            Master your time, achieve your goals, and unlock your full potential
          </Typography>

          <Box
            sx={{
              mt: 6,
              display: "flex",
              gap: 4,
              justifyContent: "center",
              opacity: 0.9,
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                10K+
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Active Users
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                1M+
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Tasks Completed
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right side - Login form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 4 },
        }}
      >
        <Card
          sx={{
            maxWidth: 480,
            width: "100%",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
            borderRadius: 4,
            border: `1px solid ${SAGE_COLORS.neutral[200]}`,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  mb: 1,
                  fontWeight: 700,
                  color: SAGE_COLORS.neutral[900],
                }}
              >
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your credentials to continue your productivity journey
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: SAGE_COLORS.terracotta[50],
                  color: SAGE_COLORS.terracotta[900],
                  "& .MuiAlert-icon": {
                    color: SAGE_COLORS.terracotta[700],
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: SAGE_COLORS.sage[500] }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: SAGE_COLORS.sage[500] }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />

              <Box sx={{ textAlign: "right", mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: SAGE_COLORS.sage[600],
                    cursor: "pointer",
                    "&:hover": {
                      color: SAGE_COLORS.sage[700],
                      textDecoration: "underline",
                    },
                  }}
                >
                  Forgot password?
                </Typography>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  mb: 3,
                  background: `linear-gradient(135deg, ${SAGE_COLORS.sage[500]} 0%, ${SAGE_COLORS.sage[600]} 100%)`,
                  "&:hover": {
                    background: `linear-gradient(135deg, ${SAGE_COLORS.sage[600]} 0%, ${SAGE_COLORS.sage[700]} 100%)`,
                  },
                }}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>

              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    style={{
                      color: SAGE_COLORS.sage[600],
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Sign Up
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Login;
