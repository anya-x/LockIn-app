import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { AutoAwesome, Timer, AttachMoney } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

interface Subtask {
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: string;
}

interface AITaskBreakdownProps {
  title: string;
  description: string;
  onSubtasksGenerated: (subtasks: Subtask[]) => void;
}

/**
 * Component for AI-powered task breakdown.
 * Uses React Query for caching expensive AI calls.
 */
export const AITaskBreakdown: React.FC<AITaskBreakdownProps> = ({
  title,
  description,
  onSubtasksGenerated,
}) => {
  const [result, setResult] = useState<any>(null);

  // Use React Query mutation (learned this in Month 3!)
  const breakdownMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/ai/breakdown', {
        title,
        description,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setResult(data);
      onSubtasksGenerated(data.subtasks);
    },
  });

  const handleBreakdown = () => {
    breakdownMutation.mutate();
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="outlined"
        startIcon={
          breakdownMutation.isPending ? (
            <CircularProgress size={20} />
          ) : (
            <AutoAwesome />
          )
        }
        onClick={handleBreakdown}
        disabled={breakdownMutation.isPending || !title}
        fullWidth
      >
        {breakdownMutation.isPending
          ? 'AI is thinking...'
          : '✨ Break Down with AI'}
      </Button>

      {result && (
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Chip
            icon={<AttachMoney />}
            label={`Cost: $${result.cost.toFixed(4)}`}
            size="small"
          />
          <Chip
            icon={<Timer />}
            label={`${result.totalTokens} tokens`}
            size="small"
          />
        </Box>
      )}

      {breakdownMutation.isError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {(breakdownMutation.error as any)?.response?.data?.message ||
            'Failed to break down task'}
        </Alert>
      )}
    </Box>
  );
};
