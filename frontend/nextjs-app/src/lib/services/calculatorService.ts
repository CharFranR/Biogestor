import { useQuery, useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import type {
  BasicParams,
  BasicParamsCreateData,
  CalculationInput,
  CalculationResult,
} from "@/types";

const BASIC_PARAMS_KEY = "basicParams";

// ============================================
// API Functions
// ============================================

async function fetchBasicParams(): Promise<BasicParams[]> {
  const response = await apiClient.get<BasicParams[]>("/api/BasicParams/");
  return response.data;
}

async function fetchBasicParam(id: number): Promise<BasicParams> {
  const response = await apiClient.get<BasicParams>(`/api/BasicParams/${id}/`);
  return response.data;
}

async function createBasicParams(
  data: BasicParamsCreateData
): Promise<BasicParams> {
  const response = await apiClient.post<BasicParams>("/api/BasicParams/", data);
  return response.data;
}

async function runCalculation(
  data: CalculationInput
): Promise<CalculationResult> {
  const response = await apiClient.post<CalculationResult>(
    "/api/calculation/",
    data
  );
  return response.data;
}

// ============================================
// React Query Hooks
// ============================================

export function useBasicParams() {
  return useQuery({
    queryKey: [BASIC_PARAMS_KEY],
    queryFn: fetchBasicParams,
    staleTime: 10 * 60 * 1000, // 10 minutes - static data
  });
}

export function useBasicParam(id: number) {
  return useQuery({
    queryKey: [BASIC_PARAMS_KEY, id],
    queryFn: () => fetchBasicParam(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateBasicParams() {
  return useMutation({
    mutationFn: createBasicParams,
  });
}

export function useRunCalculation() {
  return useMutation({
    mutationFn: runCalculation,
  });
}
