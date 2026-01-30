import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import type {
  Sensor,
  SensorData,
  SensorCreateData,
  MeasuredVariable,
} from "@/types";

const SENSORS_KEY = "sensors";
const SENSOR_DATA_KEY = "sensorData";
const MEASURED_VARIABLES_KEY = "measuredVariables";

// ============================================
// API Functions
// ============================================

async function fetchSensors(): Promise<Sensor[]> {
  const response = await apiClient.get<Sensor[]>("/api/sensors/");
  return response.data;
}

async function fetchSensor(id: number): Promise<Sensor> {
  const response = await apiClient.get<Sensor>(`/api/sensors/${id}/`);
  return response.data;
}

async function createSensor(data: SensorCreateData): Promise<Sensor> {
  const response = await apiClient.post<Sensor>("/api/sensors/", data);
  return response.data;
}

async function updateSensor(
  id: number,
  data: Partial<SensorCreateData>
): Promise<Sensor> {
  const response = await apiClient.put<Sensor>(`/api/sensors/${id}/`, data);
  return response.data;
}

async function deleteSensor(id: number): Promise<void> {
  await apiClient.delete(`/api/sensors/${id}/`);
}

async function fetchSensorData(sensorId?: number): Promise<SensorData[]> {
  const url = sensorId
    ? `/api/sensor-data/?sensor=${sensorId}`
    : "/api/sensor-data/";
  const response = await apiClient.get<SensorData[]>(url);
  return response.data;
}

async function fetchMeasuredVariables(): Promise<MeasuredVariable[]> {
  const response = await apiClient.get<MeasuredVariable[]>(
    "/api/measuredVariables/"
  );
  return response.data;
}

// ============================================
// React Query Hooks
// ============================================

export function useSensors() {
  return useQuery({
    queryKey: [SENSORS_KEY],
    queryFn: fetchSensors,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useSensor(id: number) {
  return useQuery({
    queryKey: [SENSORS_KEY, id],
    queryFn: () => fetchSensor(id),
    enabled: !!id,
  });
}

export function useSensorData(sensorId?: number) {
  return useQuery({
    queryKey: [SENSOR_DATA_KEY, sensorId],
    queryFn: () => fetchSensorData(sensorId),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useMeasuredVariables() {
  return useQuery({
    queryKey: [MEASURED_VARIABLES_KEY],
    queryFn: fetchMeasuredVariables,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSensor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSensor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SENSORS_KEY] });
    },
  });
}

export function useUpdateSensor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SensorCreateData> }) =>
      updateSensor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SENSORS_KEY] });
      queryClient.invalidateQueries({ queryKey: [SENSORS_KEY, variables.id] });
    },
  });
}

export function useDeleteSensor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSensor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SENSORS_KEY] });
    },
  });
}
