import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import type { Calibration, CalibrationCreateData } from "@/types";

const CALIBRATIONS_KEY = "calibrations";

// ============================================
// API Functions
// ============================================

async function fetchCalibrations(): Promise<Calibration[]> {
  const response = await apiClient.get<Calibration[]>("/api/calibration/");
  return response.data;
}

async function fetchCalibration(id: number): Promise<Calibration> {
  const response = await apiClient.get<Calibration>(`/api/calibration/${id}/`);
  return response.data;
}

async function createCalibration(
  data: CalibrationCreateData
): Promise<Calibration> {
  const response = await apiClient.post<Calibration>("/api/calibration/", data);
  return response.data;
}

async function updateCalibration(
  id: number,
  data: Partial<CalibrationCreateData>
): Promise<Calibration> {
  const response = await apiClient.put<Calibration>(
    `/api/calibration/${id}/`,
    data
  );
  return response.data;
}

async function deleteCalibration(id: number): Promise<void> {
  await apiClient.delete(`/api/calibration/${id}/`);
}

// ============================================
// React Query Hooks
// ============================================

export function useCalibrations() {
  return useQuery({
    queryKey: [CALIBRATIONS_KEY],
    queryFn: fetchCalibrations,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCalibration(id: number) {
  return useQuery({
    queryKey: [CALIBRATIONS_KEY, id],
    queryFn: () => fetchCalibration(id),
    enabled: !!id,
  });
}

export function useCreateCalibration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCalibration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALIBRATIONS_KEY] });
    },
  });
}

export function useUpdateCalibration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CalibrationCreateData>;
    }) => updateCalibration(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CALIBRATIONS_KEY] });
      queryClient.invalidateQueries({
        queryKey: [CALIBRATIONS_KEY, variables.id],
      });
    },
  });
}

export function useDeleteCalibration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCalibration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALIBRATIONS_KEY] });
    },
  });
}
