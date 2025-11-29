import api from "./api";

export interface NotificationPreferences {
  aiNotifications: boolean;
  calendarNotifications: boolean;
  taskReminders: boolean;
}

export const userPreferencesService = {
  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get<NotificationPreferences>(
      "/users/preferences/notifications"
    );
    return response.data;
  },

  updateNotificationPreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const response = await api.put<NotificationPreferences>(
      "/users/preferences/notifications",
      preferences
    );
    return response.data;
  },
};

export default userPreferencesService;
