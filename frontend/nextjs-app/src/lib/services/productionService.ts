import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import type { RealProductionData, RealProductionSummary, SensorData } from "@/types";

const PRODUCTION_KEY = "realProduction";

// ============================================
// API Functions
// ============================================

function mapSensorDataToRealProduction(
  fillId: number,
  sensorData: SensorData[]
): RealProductionData[] {
  const sorted = [...sensorData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let cumulative = 0;
  return sorted.map((entry, index) => {
    const dailyProduction = Number(entry.value) || 0;
    cumulative += dailyProduction;

    return {
      id: entry.id ?? index + 1,
      fill: fillId,
      date: entry.date,
      daily_production: dailyProduction,
      cumulative_production: cumulative,
    };
  });
}

/**
 * Fetch real production data for a specific fill
 * Backend actual: GET /api/sensor-data/?fill={fillId}
 */
async function fetchRealProductionByFill(fillId: number): Promise<RealProductionData[]> {
  const response = await apiClient.get<SensorData[]>(
    `/api/sensor-data/?fill=${fillId}`
  );
  return mapSensorDataToRealProduction(fillId, response.data);
}

/**
 * Fetch aggregated production summary for a fill
 * Se calcula en frontend desde /api/sensor-data/?fill={fillId}
 */
async function fetchProductionSummary(fillId: number): Promise<RealProductionSummary> {
  const rawData = await fetchRealProductionByFill(fillId);
  return (
    processProductionData(rawData) || {
      fill_id: fillId,
      dates: [],
      daily_values: [],
      cumulative_values: [],
      total_production: 0,
    }
  );
}

// ============================================
// Helper Functions
// ============================================

/**
 * Process raw production data into chart-ready format
 * Use this if backend only returns raw data points
 */
export function processProductionData(data: RealProductionData[]): RealProductionSummary | null {
  if (!data || data.length === 0) return null;

  // Sort by date
  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const dates = sorted.map((d) => d.date);
  const daily_values = sorted.map((d) => d.daily_production);
  
  // Calculate cumulative if not provided by backend
  let cumulative = 0;
  const cumulative_values = sorted.map((d) => {
    if (d.cumulative_production > 0) {
      return d.cumulative_production;
    }
    cumulative += d.daily_production;
    return cumulative;
  });

  return {
    fill_id: sorted[0].fill,
    dates,
    daily_values,
    cumulative_values,
    total_production: cumulative_values[cumulative_values.length - 1] || 0,
  };
}

// ============================================
// React Query Hooks
// ============================================

/**
 * Hook to fetch real production data for a specific fill
 * Returns raw data points
 */
export function useRealProductionByFill(fillId: number) {
  return useQuery({
    queryKey: [PRODUCTION_KEY, "fill", fillId],
    queryFn: () => fetchRealProductionByFill(fillId),
    enabled: !!fillId,
    staleTime: 60 * 1000, // 1 minute
    retry: false, // Don't retry if endpoint doesn't exist yet
  });
}

/**
 * Hook to fetch production summary (chart-ready data)
 * Returns aggregated data with arrays for dates, daily and cumulative values
 */
export function useProductionSummary(fillId: number) {
  return useQuery({
    queryKey: [PRODUCTION_KEY, "summary", fillId],
    queryFn: () => fetchProductionSummary(fillId),
    enabled: !!fillId,
    staleTime: 60 * 1000, // 1 minute
    retry: false, // Don't retry if endpoint doesn't exist yet
  });
}

/**
 * Hook that fetches raw data and processes it into chart format
 * Use this as a fallback if summary endpoint is not available
 */
export function useProcessedProduction(fillId: number) {
  const query = useRealProductionByFill(fillId);
  
  return {
    ...query,
    data: query.data ? processProductionData(query.data) : null,
  };
}
