import api from './api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export const notificationService = {
  getUnread: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  getAll: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    await api.post(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/mark-all-read');
  },

  // Back to WebSocket! This is the right way.
  // Fixed: Use proper callback to invalidate React Query
  subscribeToNotifications: (
    userId: string,
    onNotification: (notification: Notification) => void
  ) => {
    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket as any,
      onConnect: () => {
        console.log('WebSocket connected for notifications!');

        stompClient.subscribe(`/user/queue/notifications`, (message) => {
          const notification = JSON.parse(message.body);
          console.log('New notification received:', notification);

          // Trigger callback - this will invalidate React Query!
          onNotification(notification);
        });
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });

    stompClient.activate();
    return stompClient;
  },
};
