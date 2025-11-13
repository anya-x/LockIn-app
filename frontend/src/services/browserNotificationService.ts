/**
 * Browser Notification service.
 *
 * BUG: Doesn't work on iOS Safari (Apple doesn't support it)
 * TODO: Add service worker for background notifications
 */

const PERMISSION_REQUESTED_KEY = 'notificationPermissionRequested';
const PERMISSION_PREFERENCE_KEY = 'notificationPermissionPreference';

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

  /**
   * Request notification permission on first AI request.
   * This is better UX - ask when user actually needs it!
   *
   * Stores preference so we don't ask repeatedly.
   */
  requestPermissionOnFirstAIRequest: async (): Promise<NotificationPermission> => {
    // Check if we already requested
    const alreadyRequested = localStorage.getItem(PERMISSION_REQUESTED_KEY);

    if (alreadyRequested === 'true') {
      // Already asked, return current permission
      return Notification.permission;
    }

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      localStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
      return 'denied';
    }

    // If already granted or denied, don't ask again
    if (Notification.permission !== 'default') {
      localStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
      return Notification.permission;
    }

    // Ask for permission!
    // TODO: Show a friendly toast explaining why we need it
    console.log('Requesting notification permission for AI updates...');
    const permission = await Notification.requestPermission();

    // Store that we requested
    localStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
    localStorage.setItem(PERMISSION_PREFERENCE_KEY, permission);

    return permission;
  },

  /**
   * Check if we should request permission
   */
  shouldRequestPermission: (): boolean => {
    const alreadyRequested = localStorage.getItem(PERMISSION_REQUESTED_KEY);
    return alreadyRequested !== 'true' && Notification.permission === 'default';
  },
};
