import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export type NotificationHandler = (notification: unknown) => void;

/**
 * WebSocket service for real-time notifications.
 *
 * Uses STOMP over SockJS for Spring compatibility.
 */
class WebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private notificationHandler: NotificationHandler | null = null;

  /**
   * Connect to WebSocket server.
   */
  connect(userEmail: string, onNotification: NotificationHandler): void {
    if (this.client?.connected) {
      console.log("WebSocket already connected");
      return;
    }

    this.notificationHandler = onNotification;

    const wsUrl =
      import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg) => {
        if (import.meta.env.DEV) {
          console.debug("STOMP:", msg);
        }
      },
    });

    this.client.onConnect = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;

      // Subscribe to user-specific notification queue
      this.subscription = this.client!.subscribe(
        `/user/${userEmail}/queue/notifications`,
        (message: IMessage) => {
          try {
            const notification = JSON.parse(message.body);
            console.log("Received notification:", notification);
            this.notificationHandler?.(notification);
          } catch (error) {
            console.error("Failed to parse notification:", error);
          }
        }
      );
    };

    this.client.onStompError = (frame) => {
      console.error("STOMP error:", frame.headers["message"]);
      console.error("Details:", frame.body);
    };

    this.client.onWebSocketClose = () => {
      console.log("WebSocket disconnected");
      this.handleReconnect(userEmail);
    };

    this.client.onWebSocketError = (error) => {
      console.error("WebSocket error:", error);
    };

    this.client.activate();
  }

  /**
   * Handle reconnection with exponential backoff.
   */
  private handleReconnect(userEmail: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.notificationHandler) {
        this.connect(userEmail, this.notificationHandler);
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket server.
   */
  disconnect(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.notificationHandler = null;
    this.reconnectAttempts = 0;
    console.log("WebSocket disconnected");
  }

  /**
   * Check if connected.
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
