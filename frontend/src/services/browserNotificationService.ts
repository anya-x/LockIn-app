/**
 * Browser Notification service.
 *
 * BUG: Doesn't work on iOS Safari (Apple doesn't support it)
 * BUG: User might have blocked notifications in browser
 */
class BrowserNotificationService {
  private permission: NotificationPermission = "default";

  constructor() {
    if ("Notification" in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request notification permission from user.
   */
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      this.permission = "granted";
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === "granted";
    }

    return false;
  }

  /**
   * Show browser notification.
   *
   * BUG: Won't work if user denied permission
   * BUG: Won't work on iOS Safari
   */
  showNotification(title: string, options?: NotificationOptions): Notification | undefined {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return undefined;
    }

    if (Notification.permission !== "granted") {
      console.warn("Notification permission not granted");
      return undefined;
    }

    try {
      const notification = new Notification(title, {
        icon: "/lockin-icon.png",
        badge: "/lockin-icon.png",
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    } catch (error) {
      console.error("Failed to show notification:", error);
      return undefined;
    }
  }

  /**
   * Check if notifications are supported and permitted.
   */
  isSupported(): boolean {
    return "Notification" in window && Notification.permission === "granted";
  }

  /**
   * Check if we're on iOS Safari (which doesn't support notifications).
   */
  isIOSSafari(): boolean {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    return isIOS && isSafari;
  }

  /**
   * Get permission status.
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }
}

export const browserNotificationService = new BrowserNotificationService();
export default browserNotificationService;
