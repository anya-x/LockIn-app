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
import { SubtaskReviewDialog } from './SubtaskReviewDialog';

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
  const [showReview, setShowReview] = useState(false);
  const [generatedSubtasks, setGeneratedSubtasks] = useState<any[]>([]);

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
      setGeneratedSubtasks(data.subtasks);
      setShowReview(true); // Show review dialog!
    },
  });

  const createSubtasksMutation = useMutation({
    mutationFn: async (subtasks: any[]) => {
      // Create all subtasks in database
      const promises = subtasks.map((subtask) =>
        api.post('/tasks', {
          title: subtask.title,
          description: subtask.description,
          estimatedMinutes: subtask.estimatedMinutes,
          priority: subtask.priority,
          // TODO: Link to parent task?
          // TODO: Set isSubtask flag?
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      setShowReview(false);
      // TODO: Refresh task list
      // TODO: Show success message
    },
  });

  const handleBreakdown = () => {
    breakdownMutation.mutate();
  };

  const handleConfirm = (editedSubtasks: any[]) => {
    createSubtasksMutation.mutate(editedSubtasks);
  };

  return (
    <>
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

      <SubtaskReviewDialog
        open={showReview}
        subtasks={generatedSubtasks}
        onClose={() => setShowReview(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};
