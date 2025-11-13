import api from './api';

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

// Try polling approach first - simpler!
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

  // WebSocket version - save for later
  // subscribeToNotifications: (userId: string, callback: (notification: Notification) => void) => {
  //   const stompClient = new Client({
  //     brokerURL: 'ws://localhost:8080/ws',
  //     onConnect: () => {
  //       stompClient.subscribe(`/user/queue/notifications`, (message) => {
  //         const notification = JSON.parse(message.body);
  //         callback(notification);
  //       });
  //     },
  //   });
  //   stompClient.activate();
  //   return stompClient;
  // },
};
