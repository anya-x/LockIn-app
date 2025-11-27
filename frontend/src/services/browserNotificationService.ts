/**
 * Browser Notification service.
 *
 * KNOWN LIMITATIONS:
 * - iOS Safari doesn't support Web Push API (Apple limitation)
 * - User might have blocked notifications in browser settings
 * - Some browsers block by default until user interaction
 *
 * Graceful degradation: Uses in-app notifications when browser push unavailable.
 */
class BrowserNotificationService {
  private permission: NotificationPermission = "default";
  private isIOSSafariBrowser: boolean = false;

  constructor() {
    this.isIOSSafariBrowser = this.detectIOSSafari();

    // Only check permission if browser supports it and not iOS Safari
    if (!this.isIOSSafariBrowser && "Notification" in window) {
      this.permission = Notification.permission;
    }

    // Log platform information for debugging
    if (this.isIOSSafariBrowser) {
      console.info("iOS Safari detected - browser notifications unavailable (Apple limitation)");
    }
  }

  /**
   * Detect iOS Safari browser.
   */
  private detectIOSSafari(): boolean {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isWebKit = /AppleWebKit/.test(ua);
    const isChrome = /CriOS/.test(ua);
    const isFirefox = /FxiOS/.test(ua);
    // iOS Safari is webkit but not chrome or firefox
    return isIOS && isWebKit && !isChrome && !isFirefox;
  }

  /**
   * Request notification permission from user.
   * Returns false gracefully on iOS Safari.
   */
  async requestPermission(): Promise<boolean> {
    // iOS Safari doesn't support notifications - fail gracefully
    if (this.isIOSSafariBrowser) {
      console.info("Notification permission skipped - iOS Safari doesn't support Web Push");
      return false;
    }

    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      this.permission = "granted";
      return true;
    }

    if (Notification.permission !== "denied") {
      try {
        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission === "granted";
      } catch (error) {
        console.error("Failed to request notification permission:", error);
        return false;
      }
    }

    return false;
  }

  /**
   * Show browser notification.
   * Returns undefined gracefully on unsupported platforms.
   */
  showNotification(title: string, options?: NotificationOptions): Notification | undefined {
    // iOS Safari doesn't support notifications - fail silently
    if (this.isIOSSafariBrowser) {
      return undefined;
    }

    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return undefined;
    }

    if (Notification.permission !== "granted") {
      // Don't spam console, permission denial is normal
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
   * Returns false on iOS Safari (graceful degradation).
   */
  isSupported(): boolean {
    if (this.isIOSSafariBrowser) {
      return false;
    }
    return "Notification" in window && Notification.permission === "granted";
  }

  /**
   * Check if we're on iOS Safari (which doesn't support Web Push).
   */
  isIOSSafari(): boolean {
    return this.isIOSSafariBrowser;
  }

  /**
   * Get permission status.
   * Returns "denied" on iOS Safari (since it's not supported).
   */
  getPermission(): NotificationPermission {
    if (this.isIOSSafariBrowser) {
      return "denied"; // Treat as denied since it's not supported
    }
    return this.permission;
  }

  /**
   * Get a user-friendly message about notification support.
   */
  getSupportMessage(): string {
    if (this.isIOSSafariBrowser) {
      return "Browser notifications are not available on iOS Safari. You'll still see in-app notifications.";
    }
    if (!("Notification" in window)) {
      return "Your browser doesn't support notifications.";
    }
    if (this.permission === "denied") {
      return "Notifications are blocked. Check your browser settings to enable them.";
    }
    if (this.permission === "granted") {
      return "Browser notifications are enabled.";
    }
    return "Click to enable browser notifications.";
  }
}

export const browserNotificationService = new BrowserNotificationService();
export default browserNotificationService;
