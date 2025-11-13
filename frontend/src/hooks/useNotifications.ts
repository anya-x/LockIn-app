import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { notificationService, Notification } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for all notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getAll,
    refetchInterval: false, // We use WebSocket, not polling!
  });

  // Query for unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const unread = await notificationService.getUnread();
      return unread.length;
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // WebSocket subscription - invalidate cache on new notification!
  useEffect(() => {
    if (!user) return;

    console.log('Setting up WebSocket for notifications...');

    const stompClient = notificationService.subscribeToNotifications(
      user.email,
      (notification: Notification) => {
        console.log('New notification via WebSocket:', notification);

        // THIS IS THE KEY! Invalidate React Query cache when WebSocket receives notification
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });

        // Also invalidate AI requests if it's an AI notification
        if (notification.type === 'AI_BREAKDOWN') {
          queryClient.invalidateQueries({ queryKey: ['ai-requests'] });
        }
      }
    );

    return () => {
      console.log('Cleaning up WebSocket...');
      stompClient.deactivate();
    };
  }, [user, queryClient]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
};
