"use client";

import { useState, useMemo } from "react";
import { FiWifi, FiWifiOff, FiRefreshCw, FiMaximize2 } from "react-icons/fi";
import { useSensorData } from "@/hooks/useSensorData";
import { SensorChart, DEFAULT_SENSOR_CONFIGS } from "@/components/SensorChart";
import { Card, Button, Modal } from "@/components/ui";
import { clsx } from "@/lib/utils";
import type { SensorReading } from "@/hooks/useSensorData";

type TimeRange = "5min" | "15min" | "1hr";

export default function SensoresPage() {
  const { sensorData, status, isConnected, retryCount, reconnect } =
    useSensorData({ maxDataPoints: 100 });

  const [timeRange, setTimeRange] = useState<TimeRange>("15min");
  const [fullscreenSensor, setFullscreenSensor] = useState<string | null>(null);

  // Filter data based on time range
  const filteredSensorData = useMemo(() => {
    const now = Date.now();
    const rangeMs = {
      "5min": 5 * 60 * 1000,
      "15min": 15 * 60 * 1000,
      "1hr": 60 * 60 * 1000,
    };

    const filtered = new Map<string, SensorReading>();

    sensorData.forEach((reading, key) => {
      const cutoffTime = now - rangeMs[timeRange];
      const filteredIndices = reading.timestamps
        .map((ts, i) => ({ ts: new Date(ts).getTime(), i }))
        .filter(({ ts }) => ts >= cutoffTime)
        .map(({ i }) => i);

      if (filteredIndices.length > 0) {
        const startIdx = filteredIndices[0];
        filtered.set(key, {
          sensorCode: reading.sensorCode,
          values: reading.values.slice(startIdx),
          timestamps: reading.timestamps.slice(startIdx),
        });
      } else {
        filtered.set(key, reading);
      }
    });

    return filtered;
  }, [sensorData, timeRange]);

  const statusColor = {
    connecting: "text-yellow-500",
    connected: "text-green-500",
    disconnected: "text-gray-400",
    error: "text-red-500",
  };

  const statusText = {
    connecting: "Conectando...",
    connected: "Conectado",
    disconnected: "Desconectado",
    error: "Error de conexión",
  };

  const fullscreenConfig = fullscreenSensor
    ? DEFAULT_SENSOR_CONFIGS.find((c) => c.sensorCode === fullscreenSensor)
    : null;

  const fullscreenReading = fullscreenSensor
    ? filteredSensorData.get(fullscreenSensor)
    : null;

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Connection Status Badge */}
          <div
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              isConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            )}
          >
            {isConnected ? (
              <FiWifi className="w-4 h-4" />
            ) : (
              <FiWifiOff className="w-4 h-4" />
            )}
            <span>{statusText[status]}</span>
            {retryCount > 0 && !isConnected && (
              <span className="text-xs">
                (Intento {retryCount})
              </span>
            )}
          </div>

          {!isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={reconnect}
              leftIcon={<FiRefreshCw className="w-4 h-4" />}
            >
              Reconectar
            </Button>
          )}
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {(["5min", "15min", "1hr"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={clsx(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                timeRange === range
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {range === "5min" ? "5 min" : range === "15min" ? "15 min" : "1 hora"}
            </button>
          ))}
        </div>
      </div>

      {/* Sensor Charts Grid */}
      {isConnected && sensorData.size > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {DEFAULT_SENSOR_CONFIGS.map((config) => {
            const reading = filteredSensorData.get(config.sensorCode);
            if (!reading || reading.values.length === 0) {
              // Show placeholder for unconfigured sensor
              return (
                <div
                  key={config.sensorCode}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-72 flex flex-col items-center justify-center text-gray-400"
                >
                  <p className="text-sm">{config.title}</p>
                  <p className="text-xs mt-1">Sin datos</p>
                </div>
              );
            }

            return (
              <div key={config.sensorCode} className="relative group">
                <SensorChart
                  sensorReading={reading}
                  title={config.title}
                  unit={config.unit}
                  color={config.color}
                  minValue={config.minValue}
                  maxValue={config.maxValue}
                />
                <button
                  onClick={() => setFullscreenSensor(config.sensorCode)}
                  className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Pantalla completa"
                >
                  <FiMaximize2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            {!isConnected ? (
              <>
                <FiWifiOff className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Sin conexión</p>
                <p className="text-sm mt-1">
                  Conectando al servidor de sensores...
                </p>
                {retryCount > 0 && (
                  <p className="text-xs mt-2 text-gray-400">
                    Reintentando conexión (intento {retryCount})
                  </p>
                )}
              </>
            ) : (
              <>
                <FiWifi className="w-12 h-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Esperando datos</p>
                <p className="text-sm mt-1">
                  Conectado, esperando datos de los sensores...
                </p>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Fullscreen Modal */}
      <Modal
        isOpen={!!fullscreenSensor}
        onClose={() => setFullscreenSensor(null)}
        title={fullscreenConfig?.title || "Sensor"}
        size="full"
      >
        {fullscreenReading && fullscreenConfig && (
          <div className="h-96">
            <SensorChart
              sensorReading={fullscreenReading}
              title={fullscreenConfig.title}
              unit={fullscreenConfig.unit}
              color={fullscreenConfig.color}
              minValue={fullscreenConfig.minValue}
              maxValue={fullscreenConfig.maxValue}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
