import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import type { Fill, FillCreateData } from "@/types";

const FILLS_KEY = "fills";

// ============================================
// API Functions
// ============================================

async function fetchFills(): Promise<Fill[]> {
  const response = await apiClient.get<Fill[]>("/api/Fill/");
  return response.data;
}

async function fetchFill(id: number): Promise<Fill> {
  const response = await apiClient.get<Fill>(`/api/Fill/${id}/`);
  return response.data;
}

async function fetchActiveFill(): Promise<Fill | null> {
  const response = await apiClient.get<Fill[]>("/api/Fill/");
  // Find fill without last_day (active)
  const activeFill = response.data.find((fill) => !fill.last_day);
  return activeFill || null;
}

async function createFill(data: FillCreateData): Promise<Fill> {
  const response = await apiClient.post<Fill>("/api/Fill/", data);
  return response.data;
}

async function updateFill(
  id: number,
  data: Partial<FillCreateData>
): Promise<Fill> {
  const response = await apiClient.put<Fill>(`/api/Fill/${id}/`, data);
  return response.data;
}

async function deleteFill(id: number): Promise<void> {
  await apiClient.delete(`/api/Fill/${id}/`);
}

async function endFill(id: number): Promise<Fill> {
  const response = await apiClient.post<Fill>(`/api/Fill/${id}/end_fill/`);
  return response.data;
}

// ============================================
// React Query Hooks
// ============================================

export function useFills() {
  return useQuery({
    queryKey: [FILLS_KEY],
    queryFn: fetchFills,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useFill(id: number) {
  return useQuery({
    queryKey: [FILLS_KEY, id],
    queryFn: () => fetchFill(id),
    enabled: !!id,
  });
}

export function useActiveFill() {
  return useQuery({
    queryKey: [FILLS_KEY, "active"],
    queryFn: fetchActiveFill,
    staleTime: 30 * 1000,
  });
}

export function useCreateFill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FILLS_KEY] });
    },
  });
}

export function useUpdateFill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FillCreateData> }) =>
      updateFill(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [FILLS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILLS_KEY, variables.id] });
    },
  });
}

export function useDeleteFill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FILLS_KEY] });
    },
  });
}

export function useEndFill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endFill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FILLS_KEY] });
    },
  });
}
