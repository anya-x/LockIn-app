import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import api from '../services/api';

interface AITaskBreakdownProps {
  title: string;
  description: string;
  onSubtasksGenerated: (subtasks: any[]) => void;
}

/**
 * WIP: Component for AI-powered task breakdown
 *
 * TODOs:
 * - Add loading state properly
 * - Handle errors gracefully
 * - Show cost to user?
 * - Disable after usage limit
 */
export const AITaskBreakdown: React.FC<AITaskBreakdownProps> = ({
  title,
  description,
  onSubtasksGenerated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBreakdown = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/ai/breakdown', {
        title,
        description,
      });

      // TODO: Convert API response to Task objects
      // TODO: Let user review before creating

      onSubtasksGenerated(response.data.subtasks);
    } catch (err: any) {
      console.error('AI breakdown failed:', err);
      setError(err.response?.data?.message || 'Failed to break down task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
        onClick={handleBreakdown}
        disabled={loading || !title}
        fullWidth
      >
        {loading ? 'AI is thinking...' : '✨ Break Down with AI'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};
