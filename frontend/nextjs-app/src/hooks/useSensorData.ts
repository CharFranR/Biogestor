"use client";

import { useState, useCallback, useMemo } from "react";
import { useWebSocket, type WebSocketStatus } from "./useWebSocket";

export interface SensorReading {
  sensorCode: string;
  values: number[];
  timestamps: string[];
}

interface SensorDataMessage {
  [sensorCode: string]: string[];
}

interface UseSensorDataOptions {
  maxDataPoints?: number;
}

interface UseSensorDataReturn {
  sensorData: Map<string, SensorReading>;
  status: WebSocketStatus;
  isConnected: boolean;
  retryCount: number;
  reconnect: () => void;
  disconnect: () => void;
}

export function useSensorData(
  options: UseSensorDataOptions = {}
): UseSensorDataReturn {
  const { maxDataPoints = 50 } = options;

  const [sensorData, setSensorData] = useState<Map<string, SensorReading>>(
    new Map()
  );

  const wsUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${window.location.host}`;
    return `${wsHost}/ws/dataSensor/`;
  }, []);

  const handleMessage = useCallback(
    (data: unknown) => {
      const message = data as SensorDataMessage;

      setSensorData((prevData) => {
        const newData = new Map(prevData);

        Object.entries(message).forEach(([rawKey, values]) => {
          // Quitar prefijo 'Biogestor/' si existe
          const sensorCode = rawKey.replace('Biogestor/', '');
          if (Array.isArray(values)) {
            const numericValues = values
              .map((v) => parseFloat(v))
              .filter((v) => !isNaN(v));

            const existing = newData.get(sensorCode) || {
              sensorCode,
              values: [],
              timestamps: [],
            };

            // Add new values with timestamps
            const now = new Date();
            const newTimestamps = numericValues.map((_, i) => {
              const timestamp = new Date(now.getTime() - (numericValues.length - 1 - i) * 1000);
              return timestamp.toISOString();
            });

            const combinedValues = [...existing.values, ...numericValues];
            const combinedTimestamps = [...existing.timestamps, ...newTimestamps];

            // Keep only the last maxDataPoints
            const startIndex = Math.max(0, combinedValues.length - maxDataPoints);

            newData.set(sensorCode, {
              sensorCode,
              values: combinedValues.slice(startIndex),
              timestamps: combinedTimestamps.slice(startIndex),
            });
          }
        });

        return newData;
      });
    },
    [maxDataPoints]
  );

  const { status, reconnect, disconnect, retryCount } = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
    reconnect: true,
    maxRetries: 10,
  });

  const isConnected = status === "connected";

  return {
    sensorData,
    status,
    isConnected,
    retryCount,
    reconnect,
    disconnect,
  };
}
