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

export interface NotificationPreferences {
  browserNotifications: boolean;
  aiNotifications: boolean;
  calendarNotifications: boolean;
  taskReminders: boolean;
}

export const notificationService = {
  /**
   * Get notifications with pagination.
   */
  getNotifications: async (
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedNotifications> => {
    const response = await api.get<PaginatedNotifications>("/notifications", {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Get all notifications (non-paginated).
   */
  getAllNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>("/notifications/all");
    return response.data;
  },

  /**
   * Get unread notifications only.
   */
  getUnreadNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>("/notifications/unread");
    return response.data;
  },

  /**
   * Get unread notification count.
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>("/notifications/unread/count");
    return response.data.count;
  },

  /**
   * Mark a specific notification as read.
   */
  markAsRead: async (notificationId: number): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read.
   */
  markAllAsRead: async (): Promise<number> => {
    const response = await api.put<{ updated: number }>("/notifications/read-all");
    return response.data.updated;
  },

  /**
   * Get notification preferences.
   */
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get<NotificationPreferences>("/notifications/preferences");
    return response.data;
  },

  /**
   * Update notification preferences.
   */
  updatePreferences: async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await api.put<NotificationPreferences>("/notifications/preferences", preferences);
    return response.data;
  },
};

export default notificationService;
