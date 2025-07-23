import React from "react";
import { Box, Typography } from "@mui/material";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <Box
    sx={{
      mb: 4,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    }}
  >
    <Box>
      <Typography variant="h3" sx={{ color: "#1A237E", mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" sx={{ color: "#5C6BC0" }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action && <Box>{action}</Box>}
  </Box>
);

export default PageHeader;
