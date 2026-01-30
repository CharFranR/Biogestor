import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import type { User, UserPermissions } from "@/types";

const USERS_KEY = "users";
const PENDING_USERS_KEY = "pendingUsers";
const CURRENT_USER_KEY = "currentUser";

// ============================================
// API Functions
// ============================================

async function fetchApprovedUsers(): Promise<User[]> {
  const response = await apiClient.get<User[]>("/api/users/");
  return response.data;
}

async function fetchPendingUsers(): Promise<User[]> {
  const response = await apiClient.get<User[]>("/api/users/pending/");
  return response.data;
}

async function fetchCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>("/api/users/me/");
  return response.data;
}

async function approveUser(userId: number): Promise<User> {
  const response = await apiClient.post<User>(`/api/users/${userId}/approve/`);
  return response.data;
}

async function fetchUserPermissions(userId: number): Promise<UserPermissions> {
  const response = await apiClient.get<UserPermissions>(
    `/api/users/${userId}/permissions/`
  );
  return response.data;
}

async function updateUserPermissions(
  userId: number,
  permissions: UserPermissions
): Promise<UserPermissions> {
  const response = await apiClient.post<UserPermissions>(
    `/api/users/${userId}/permissions/`,
    permissions
  );
  return response.data;
}

async function updateUserRole(
  userId: number,
  role: "ADMIN" | "COLAB" | "VISIT"
): Promise<User> {
  const response = await apiClient.post<User>(`/api/users/${userId}/role/`, {
    rol: role,
  });
  return response.data;
}

// ============================================
// React Query Hooks
// ============================================

export function useApprovedUsers() {
  return useQuery({
    queryKey: [USERS_KEY],
    queryFn: fetchApprovedUsers,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function usePendingUsers() {
  return useQuery({
    queryKey: [PENDING_USERS_KEY],
    queryFn: fetchPendingUsers,
    staleTime: 30 * 1000,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: [CURRENT_USER_KEY],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserPermissions(userId: number) {
  return useQuery({
    queryKey: [USERS_KEY, userId, "permissions"],
    queryFn: () => fetchUserPermissions(userId),
    enabled: !!userId,
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PENDING_USERS_KEY] });
    },
  });
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: number;
      permissions: UserPermissions;
    }) => updateUserPermissions(userId, permissions),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [USERS_KEY, variables.userId, "permissions"],
      });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: number;
      role: "ADMIN" | "COLAB" | "VISIT";
    }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}
