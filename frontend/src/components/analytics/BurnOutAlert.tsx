import React from "react";
import { Alert, AlertTitle, Box } from "@mui/material";
import { Warning } from "@mui/icons-material";

interface BurnoutAlertProps {
  riskScore: number;
  lateNightSessions: number;
  overworkMinutes: number;
}

const BurnoutAlert: React.FC<BurnoutAlertProps> = ({
  riskScore,
  lateNightSessions,
  overworkMinutes,
}) => {
  if (riskScore < 40) {
    return null;
  }

  const severity =
    riskScore > 70 ? "error" : riskScore > 50 ? "warning" : "info";

  return (
    <Alert severity={severity} icon={<Warning />} sx={{ mb: 3 }}>
      <AlertTitle>
        {riskScore > 70 ? "High Burnout Risk Detected" : "Burnout Risk Warning"}
      </AlertTitle>

      <Box>
        Your burnout risk score is {riskScore.toFixed(0)}/100.
        {lateNightSessions > 0 && (
          <Box mt={1}>
            • {lateNightSessions} late night work sessions detected
          </Box>
        )}
        {overworkMinutes > 0 && (
          <Box mt={1}>
            • Working {Math.round(overworkMinutes / 60)} hours over healthy
            limit
          </Box>
        )}
        <Box mt={2}>
          <strong>Recommendations:</strong>
          <ul style={{ marginTop: 8, marginBottom: 0 }}>
            <li>Take regular breaks between focus sessions</li>
            <li>Avoid working late into the night</li>
            <li>Aim for 4-6 hours of deep work per day</li>
            <li>Maintain work-life balance</li>
          </ul>
        </Box>
      </Box>
    </Alert>
  );
};

export default BurnoutAlert;
