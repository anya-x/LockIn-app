import api from "./api";

export interface NotificationPreferences {
  aiNotifications: boolean;
  calendarNotifications: boolean;
  taskReminders: boolean;
}

export interface UserDataExport {
  exportedAt: string;
  profile: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string | null;
    notifyAiFeatures: boolean;
    notifyCalendarSync: boolean;
    notifyTaskReminders: boolean;
    createdAt: string;
    updatedAt: string;
  };
  tasks: Array<{
    id: number;
    title: string;
    description: string | null;
    isUrgent: boolean;
    isImportant: boolean;
    status: string;
    dueDate: string | null;
    categoryName: string | null;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
  }>;
  goals: Array<{
    id: number;
    title: string;
    description: string | null;
    type: string;
    startDate: string;
    endDate: string;
    targetTasks: number | null;
    targetPomodoros: number | null;
    targetFocusMinutes: number | null;
    currentTasks: number;
    currentPomodoros: number;
    currentFocusMinutes: number;
    completed: boolean;
    completedDate: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    color: string | null;
    createdAt: string;
  }>;
  focusSessions: Array<{
    id: number;
    sessionType: string;
    durationMinutes: number;
    startedAt: string;
    endedAt: string | null;
    completed: boolean;
    notes: string | null;
    taskTitle: string | null;
  }>;
  notifications: Array<{
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    readAt: string | null;
  }>;
  badges: Array<{
    id: number;
    badgeType: string;
    name: string;
    description: string;
    earnedAt: string;
  }>;
  analytics: Array<{
    date: string;
    tasksCreated: number;
    tasksCompleted: number;
    pomodorosCompleted: number;
    focusMinutes: number;
    productivityScore: number;
  }>;
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

  // GDPR: Export all user data
  exportUserData: async (): Promise<UserDataExport> => {
    const response = await api.get<UserDataExport>("/users/export");
    return response.data;
  },

  // GDPR: Delete user account and all data
  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>("/users/account");
    return response.data;
  },
};

export default userPreferencesService;
