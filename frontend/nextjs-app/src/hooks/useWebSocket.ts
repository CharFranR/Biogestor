"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  maxRetries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
}

interface UseWebSocketReturn {
  status: WebSocketStatus;
  lastMessage: unknown;
  sendMessage: (message: unknown) => void;
  disconnect: () => void;
  reconnect: () => void;
  retryCount: number;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnect = true,
  maxRetries = 10,
  initialRetryDelay = 1000,
  maxRetryDelay = 30000,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryDelayRef = useRef(initialRetryDelay);
  const shouldReconnectRef = useRef(reconnect);

  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const [retryCount, setRetryCount] = useState(0);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Only connect in browser
    if (typeof window === "undefined") return;

    setStatus("connecting");

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        setRetryCount(0);
        retryDelayRef.current = initialRetryDelay;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch {
          // If not JSON, pass raw data
          setLastMessage(event.data);
          onMessage?.(event.data);
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        wsRef.current = null;
        onClose?.();

        // Attempt to reconnect with exponential backoff
        if (shouldReconnectRef.current && retryCount < maxRetries) {
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            // Exponential backoff with jitter
            const jitter = Math.random() * 1000;
            retryDelayRef.current = Math.min(
              retryDelayRef.current * 2 + jitter,
              maxRetryDelay
            );
            connect();
          }, retryDelayRef.current);
        }
      };

      ws.onerror = (error) => {
        setStatus("error");
        onError?.(error);
      };
    } catch (error) {
      setStatus("error");
      console.error("WebSocket connection error:", error);
    }
  }, [
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    retryCount,
    maxRetries,
    initialRetryDelay,
    maxRetryDelay,
  ]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearRetryTimeout();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus("disconnected");
    setRetryCount(0);
  }, [clearRetryTimeout]);

  const manualReconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    setRetryCount(0);
    retryDelayRef.current = initialRetryDelay;
    connect();
  }, [connect, initialRetryDelay]);

  const sendMessage = useCallback((message: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const data = typeof message === "string" ? message : JSON.stringify(message);
      wsRef.current.send(data);
    } else {
      console.warn("WebSocket is not connected. Message not sent.");
    }
  }, []);

  // Initial connection
  useEffect(() => {
    shouldReconnectRef.current = reconnect;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearRetryTimeout();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url]); // Only reconnect when URL changes

  return {
    status,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect: manualReconnect,
    retryCount,
  };
}
