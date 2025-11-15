import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Alert,
  Button,
} from '@mui/material';
import { AutoAwesome, Refresh } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Widget displaying AI-generated daily briefing.
 * Shown on dashboard, refreshes daily.
 */
export const DailyBriefingWidget: React.FC = () => {
  const {
    data: briefing,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['daily-briefing', new Date().toDateString()],
    queryFn: async () => {
      const response = await api.get('/ai/daily-briefing');
      return response.data;
    },
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" height={30} />
          <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load daily briefing. {(error as any).response?.status === 429
              ? 'Rate limit exceeded - try again tomorrow!'
              : 'Try again later.'}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome sx={{ color: 'white' }} />
            <Typography variant="h6" sx={{ color: 'white' }}>
              Your Daily Briefing
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<Refresh />}
            onClick={() => refetch()}
            sx={{ color: 'white' }}
          >
            Refresh
          </Button>
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: 'white',
            whiteSpace: 'pre-line',
            lineHeight: 1.6,
          }}
        >
          {briefing.briefingText}
        </Typography>

        {briefing.todayTasks.length > 0 && (
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.7)', mt: 2, display: 'block' }}
          >
            Based on {briefing.todayTasks.length} tasks today •
            Cost: ${briefing.costUSD.toFixed(4)}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
