import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export type NotificationHandler = (notification: unknown) => void;
export type ConnectionStatusHandler = (connected: boolean) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private notificationHandler: NotificationHandler | null = null;
  private connectionStatusHandler: ConnectionStatusHandler | null = null;
  private userEmail: string | null = null;
  private isIntentionalDisconnect = false;

  connect(
    userEmail: string,
    onNotification: NotificationHandler,
    onConnectionStatus?: ConnectionStatusHandler
  ): void {
    if (this.client?.connected) {
      console.log("WebSocket already connected");
      return;
    }

    // Get JWT token for authentication
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("WebSocket connection requires authentication token");
      return;
    }

    this.userEmail = userEmail;
    this.notificationHandler = onNotification;
    this.connectionStatusHandler = onConnectionStatus || null;
    this.isIntentionalDisconnect = false;

    const wsUrl = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 0,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // Pass JWT token in STOMP headers for backend authentication
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (msg) => {
        if (import.meta.env.DEV) {
          console.debug("STOMP:", msg);
        }
      },
    });

    this.client.onConnect = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
      this.connectionStatusHandler?.(true);

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
      this.connectionStatusHandler?.(false);
    };

    this.client.onWebSocketClose = () => {
      console.log("WebSocket disconnected");
      this.connectionStatusHandler?.(false);

      if (!this.isIntentionalDisconnect) {
        this.handleReconnect();
      }
    };

    this.client.onWebSocketError = (error) => {
      console.error("WebSocket error:", error);
      this.connectionStatusHandler?.(false);
    };

    this.client.activate();
  }

  private handleReconnect(): void {
    if (this.isIntentionalDisconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached, giving up");
      return;
    }

    this.reconnectAttempts++;

    const exponentialDelay =
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000;
    const delay = Math.min(exponentialDelay + jitter, this.maxReconnectDelay);

    console.log(
      `Reconnecting in ${Math.round(delay)}ms (attempt ${
        this.reconnectAttempts
      }/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (
        this.userEmail &&
        this.notificationHandler &&
        !this.isIntentionalDisconnect
      ) {
        if (this.client) {
          try {
            this.client.deactivate();
          } catch (e) {}
          this.client = null;
        }

        this.connect(
          this.userEmail,
          this.notificationHandler,
          this.connectionStatusHandler || undefined
        );
      }
    }, delay);
  }

  disconnect(): void {
    this.isIntentionalDisconnect = true;

    if (this.subscription) {
      try {
        this.subscription.unsubscribe();
      } catch (e) {}
      this.subscription = null;
    }

    if (this.client) {
      try {
        this.client.deactivate();
      } catch (e) {}
      this.client = null;
    }

    this.notificationHandler = null;
    this.connectionStatusHandler = null;
    this.userEmail = null;
    this.reconnectAttempts = 0;
    console.log("WebSocket intentionally disconnected");
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
