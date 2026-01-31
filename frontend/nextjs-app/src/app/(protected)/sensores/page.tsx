"use client";

import { useState, useMemo } from "react";
import { FiWifi, FiWifiOff, FiRefreshCw, FiMaximize2, FiPlus } from "react-icons/fi";
import { useSensorData } from "@/hooks/useSensorData";
import { SensorChart } from "@/components/SensorChart";
import { Card, Button, Modal, Input, Select } from "@/components/ui";
import { clsx } from "@/lib/utils";
import { useSensors, useMeasuredVariables, useCreateSensor, useCreateMeasuredVariable } from "@/lib/services/sensorService";
import type { SensorReading } from "@/hooks/useSensorData";
import type { SensorCreateData } from "@/types";

type TimeRange = "5min" | "15min" | "1hr";

// Colores para sensores dinámicos
const SENSOR_COLORS = [
  "#26a69a", "#42a5f5", "#ffa726", "#7e57c2", "#66bb6a",
  "#ef5350", "#ab47bc", "#29b6f6", "#ffca28", "#8d6e63",
];

const getSensorColor = (index: number) => SENSOR_COLORS[index % SENSOR_COLORS.length];

const initialSensorForm: SensorCreateData = {
  name: "",
  mqtt_code: "",
  measured_variable: 0,
  min_range: 0,
  max_range: 100,
  hysteresis: null,
  accuracy: null,
  precision: null,
};

export default function SensoresPage() {
  const { sensorData, status, isConnected, retryCount, reconnect } =
    useSensorData({ maxDataPoints: 100 });

  const [timeRange, setTimeRange] = useState<TimeRange>("15min");
  const [fullscreenSensor, setFullscreenSensor] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sensorForm, setSensorForm] = useState<SensorCreateData>(initialSensorForm);
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [newVariableName, setNewVariableName] = useState("");

  // Queries
  const { data: sensors, refetch: refetchSensors } = useSensors();
  const { data: measuredVariables, refetch: refetchVariables } = useMeasuredVariables();
  const createSensorMutation = useCreateSensor();
  const createVariableMutation = useCreateMeasuredVariable();
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateSensor = async () => {
    setFormError(null);
    
    if (!sensorForm.name || !sensorForm.mqtt_code || !sensorForm.measured_variable) {
      setFormError("Por favor complete todos los campos requeridos");
      return;
    }

    try {
      await createSensorMutation.mutateAsync(sensorForm);
      setIsCreateModalOpen(false);
      setSensorForm(initialSensorForm);
      setFormError(null);
      refetchSensors();
    } catch (error) {
      console.error("Error al crear sensor:", error);
      setFormError("Error al crear el sensor. Verifique los datos e intente de nuevo.");
    }
  };

  const handleCreateVariable = async () => {
    if (!newVariableName.trim()) return;

    try {
      const newVariable = await createVariableMutation.mutateAsync(newVariableName.trim());
      setSensorForm({ ...sensorForm, measured_variable: newVariable.id });
      setNewVariableName("");
      setIsAddingVariable(false);
      refetchVariables();
    } catch (error) {
      console.error("Error al crear variable:", error);
    }
  };

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

  // Generar configuración dinámica para el sensor en fullscreen
  const fullscreenReading = fullscreenSensor
    ? filteredSensorData.get(fullscreenSensor)
    : null;

  const fullscreenConfig = fullscreenSensor
    ? {
        sensorCode: fullscreenSensor,
        title: fullscreenSensor,
        unit: "",
        color: getSensorColor(
          Array.from(filteredSensorData.keys()).indexOf(fullscreenSensor)
        ),
      }
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

        {/* Add Sensor Button */}
        <Button
          variant="primary"
          leftIcon={<FiPlus className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Agregar Sensor
        </Button>
      </div>

      {/* Sensor Charts Grid - Muestra solo sensores con datos */}
      {isConnected && sensorData.size > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from(filteredSensorData.entries()).map(([sensorCode, reading], index) => {
            if (!reading || reading.values.length === 0) {
              return null;
            }

            return (
              <div key={sensorCode} className="relative group">
                <SensorChart
                  sensorReading={reading}
                  title={sensorCode}
                  unit=""
                  color={getSensorColor(index)}
                />
                <button
                  onClick={() => setFullscreenSensor(sensorCode)}
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
            />
          </div>
        )}
      </Modal>

      {/* Create Sensor Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSensorForm(initialSensorForm);
          setFormError(null);
        }}
        title="Agregar Nuevo Sensor"
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {formError}
            </div>
          )}
          
          <Input
            label="Nombre del Sensor"
            value={sensorForm.name}
            onChange={(e) => setSensorForm({ ...sensorForm, name: e.target.value })}
            placeholder="Ej: Sensor de Temperatura"
            required
          />

          <Input
            label="Código MQTT"
            value={sensorForm.mqtt_code}
            onChange={(e) => setSensorForm({ ...sensorForm, mqtt_code: e.target.value })}
            placeholder="Ej: temperatura"
            helperText="El topic MQTT será: Biogestor/{código}"
            required
          />

          {/* Variable Medida con opción de agregar nueva */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Variable Medida
            </label>
            
            {!isAddingVariable ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={sensorForm.measured_variable?.toString() || ""}
                    onChange={(e) => setSensorForm({ ...sensorForm, measured_variable: parseInt(e.target.value) || 0 })}
                    placeholder="Seleccionar variable..."
                    options={measuredVariables?.map((variable) => ({
                      value: variable.id,
                      label: variable.name,
                    })) || []}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingVariable(true)}
                  title="Agregar nueva variable"
                >
                  <FiPlus className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={newVariableName}
                    onChange={(e) => setNewVariableName(e.target.value)}
                    placeholder="Nombre de la variable (ej: Temperatura)"
                    autoFocus
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCreateVariable}
                  disabled={!newVariableName.trim() || createVariableMutation.isPending}
                >
                  {createVariableMutation.isPending ? "..." : "Crear"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingVariable(false);
                    setNewVariableName("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Rango Mínimo"
              value={sensorForm.min_range}
              onChange={(e) => setSensorForm({ ...sensorForm, min_range: parseFloat(e.target.value) || 0 })}
              required
            />
            <Input
              type="number"
              label="Rango Máximo"
              value={sensorForm.max_range}
              onChange={(e) => setSensorForm({ ...sensorForm, max_range: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              label="Histéresis (%)"
              value={sensorForm.hysteresis ?? ""}
              onChange={(e) => setSensorForm({ ...sensorForm, hysteresis: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="Opcional"
            />
            <Input
              type="number"
              label="Precisión (%)"
              value={sensorForm.accuracy ?? ""}
              onChange={(e) => setSensorForm({ ...sensorForm, accuracy: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="Opcional"
            />
            <Input
              type="number"
              label="Exactitud (%)"
              value={sensorForm.precision ?? ""}
              onChange={(e) => setSensorForm({ ...sensorForm, precision: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="Opcional"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setSensorForm(initialSensorForm);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSensor}
              disabled={!sensorForm.name || !sensorForm.mqtt_code || !sensorForm.measured_variable || createSensorMutation.isPending}
            >
              {createSensorMutation.isPending ? "Creando..." : "Crear Sensor"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
