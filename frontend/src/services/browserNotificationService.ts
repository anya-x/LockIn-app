/**
 * Browser Notification service.
 *
 * BUG: Doesn't work on iOS Safari (Apple doesn't support it)
 * TODO: Add service worker for background notifications
 */

export const browserNotificationService = {
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  },

  showNotification: (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      // BUG: This constructor might not work on all browsers
      new Notification(title, {
        icon: '/logo.png',
        badge: '/badge.png',
        ...options,
      });
    }
  },

  // Try to show notification with error handling
  safeShowNotification: (title: string, body: string, url?: string) => {
    try {
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: '/logo.png',
          tag: 'lockin-notification', // Replaces previous notification
        });

        if (url) {
          notification.onclick = () => {
            window.focus();
            window.location.href = url;
            notification.close();
          };
        }
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
      // Silently fail - don't break the app
    }
  },
};
