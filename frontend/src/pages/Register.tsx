import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Grid,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
  LockOpen as LockOpenIcon,
  CheckCircleOutline,
} from "@mui/icons-material";
import { SAGE_COLORS } from "../theme/theme";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Pomodoro timer with customizable focus profiles",
    "Smart task management and prioritization",
    "Eisenhower Matrix for decision making",
    "Detailed analytics and productivity insights",
    "Goal tracking and progress monitoring",
    "Focus session history and statistics",
  ];

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
          background: `linear-gradient(135deg, ${SAGE_COLORS.terracotta[500]} 0%, ${SAGE_COLORS.terracotta[700]} 100%)`,
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
        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
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
            Start Your Journey
          </Typography>

          <Typography
            variant="h6"
            sx={{
              opacity: 0.95,
              fontWeight: 400,
              mb: 4,
              lineHeight: 1.6,
            }}
          >
            Join thousands of productive people who are achieving their goals with LockIn
          </Typography>

          <Box sx={{ mt: 4 }}>
            {features.map((feature, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  opacity: 0.95,
                }}
              >
                <CheckCircleOutline sx={{ mr: 2, fontSize: 20 }} />
                <Typography variant="body2">{feature}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right side - Register form */}
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
            maxWidth: 520,
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
                Create your account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start boosting your productivity today
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
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    autoComplete="given-name"
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: SAGE_COLORS.sage[500] }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    autoComplete="family-name"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: SAGE_COLORS.sage[500] }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: SAGE_COLORS.sage[500] }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mt: 2, mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                helperText="At least 8 characters"
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
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: SAGE_COLORS.sage[500] }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  mb: 3,
                  background: `linear-gradient(135deg, ${SAGE_COLORS.terracotta[500]} 0%, ${SAGE_COLORS.terracotta[600]} 100%)`,
                  "&:hover": {
                    background: `linear-gradient(135deg, ${SAGE_COLORS.terracotta[600]} 0%, ${SAGE_COLORS.terracotta[700]} 100%)`,
                  },
                }}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    style={{
                      color: SAGE_COLORS.terracotta[600],
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    Sign In
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

export default Register;
