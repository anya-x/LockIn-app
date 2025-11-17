import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  badgeType: string;
}

const fetchBadges = async (): Promise<Badge[]> => {
  const response = await api.get('/badges');
  return response.data;
};

const checkAndAwardBadges = async (): Promise<Badge[]> => {
  const response = await api.post('/badges/check');
  return response.data;
};

export const useBadges = () => {
  return useQuery<Badge[], Error>({
    queryKey: ['badges'],
    queryFn: fetchBadges,
  });
};

export const useCheckBadges = () => {
  const queryClient = useQueryClient();

  return useMutation<Badge[], Error>({
    mutationFn: checkAndAwardBadges,
    onSuccess: (newBadges) => {
      // Invalidate and refetch badges
      queryClient.invalidateQueries({ queryKey: ['badges'] });

      // Show notifications for new badges
      if (newBadges && newBadges.length > 0) {
        newBadges.forEach((badge) => {
          // You can integrate with a toast notification library here
          console.log(`🎉 Badge earned: ${badge.name} ${badge.icon}`);
        });
      }
    },
  });
};
