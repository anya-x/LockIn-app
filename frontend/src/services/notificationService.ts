import api from "./api";

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

export interface PaginatedNotifications {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export const notificationService = {
  getNotifications: async (
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedNotifications> => {
    const response = await api.get<PaginatedNotifications>("/notifications", {
      params: { page, size },
    });
    return response.data;
  },
  getAllNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>("/notifications/all");
    return response.data;
  },
  getUnreadNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>("/notifications/unread");
    return response.data;
  },
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>(
      "/notifications/unread/count"
    );
    return response.data.count;
  },
  markAsRead: async (notificationId: number): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`);
  },
  markAllAsRead: async (): Promise<number> => {
    const response = await api.put<{ updated: number }>(
      "/notifications/read-all"
    );
    return response.data.updated;
  },
};

export default notificationService;
