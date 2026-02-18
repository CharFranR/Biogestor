import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import type { Item, Place, ItemCreateData, PlaceCreateData } from "@/types";

const ITEMS_KEY = "items";
const PLACES_KEY = "places";

type ApiItem = Omit<Item, "measurement"> & {
  measurement?: string;
  unit?: string;
};

function normalizeItem(item: ApiItem): Item {
  const measurement = item.measurement || item.unit || "";
  return {
    ...item,
    measurement,
  };
}

// ============================================
// API Functions - Items
// ============================================

async function fetchItems(): Promise<Item[]> {
  const response = await apiClient.get<ApiItem[]>("/api/items/");
  return response.data.map(normalizeItem);
}

async function fetchItem(id: number): Promise<Item> {
  const response = await apiClient.get<ApiItem>(`/api/items/${id}/`);
  return normalizeItem(response.data);
}

async function createItem(data: ItemCreateData): Promise<Item> {
  const response = await apiClient.post<Item>("/api/items/", data);
  return response.data;
}

async function updateItem(
  id: number,
  data: Partial<ItemCreateData>
): Promise<Item> {
  const response = await apiClient.put<Item>(`/api/items/${id}/`, data);
  return response.data;
}

async function deleteItem(id: number): Promise<void> {
  await apiClient.delete(`/api/items/${id}/`);
}

// ============================================
// API Functions - Places
// ============================================

async function fetchPlaces(): Promise<Place[]> {
  const response = await apiClient.get<Place[]>("/api/place/");
  return response.data;
}

async function fetchPlace(id: number): Promise<Place> {
  const response = await apiClient.get<Place>(`/api/place/${id}/`);
  return response.data;
}

async function createPlace(data: PlaceCreateData): Promise<Place> {
  const response = await apiClient.post<Place>("/api/place/", data);
  return response.data;
}

async function updatePlace(
  id: number,
  data: Partial<PlaceCreateData>
): Promise<Place> {
  const response = await apiClient.put<Place>(`/api/place/${id}/`, data);
  return response.data;
}

async function deletePlace(id: number): Promise<void> {
  await apiClient.delete(`/api/place/${id}/`);
}

async function generatePlaceReport(id: number): Promise<Blob> {
  const response = await apiClient.post(
    `/api/place/${id}/generate_report/`,
    {},
    { responseType: "blob" }
  );
  return response.data;
}

// ============================================
// React Query Hooks - Items
// ============================================

export function useItems() {
  return useQuery({
    queryKey: [ITEMS_KEY],
    queryFn: fetchItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useItem(id: number) {
  return useQuery({
    queryKey: [ITEMS_KEY, id],
    queryFn: () => fetchItem(id),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ItemCreateData> }) =>
      updateItem(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY, variables.id] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_KEY] });
    },
  });
}

// ============================================
// React Query Hooks - Places
// ============================================

export function usePlaces() {
  return useQuery({
    queryKey: [PLACES_KEY],
    queryFn: fetchPlaces,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePlace(id: number) {
  return useQuery({
    queryKey: [PLACES_KEY, id],
    queryFn: () => fetchPlace(id),
    enabled: !!id,
  });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLACES_KEY] });
    },
  });
}

export function useUpdatePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PlaceCreateData> }) =>
      updatePlace(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PLACES_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLACES_KEY, variables.id] });
    },
  });
}

export function useDeletePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLACES_KEY] });
    },
  });
}

export function useGeneratePlaceReport() {
  return useMutation({
    mutationFn: generatePlaceReport,
    onSuccess: (blob) => {
      // Download the PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventario_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}
