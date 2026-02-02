"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiLock } from "react-icons/fi";
import { authService } from "@/lib/auth";
import type { User, UserPermissions } from "@/types";

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: keyof UserPermissions;
  fallbackUrl?: string;
  showAccessDenied?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  fallbackUrl = "/sensores",
  showAccessDenied = true,
}: PermissionGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    setUser(storedUser);

    if (storedUser) {
      const userPermissions = storedUser.profile?.permissions;
      const permitted = userPermissions?.[permission] === true;
      setHasPermission(permitted);
    }

    setIsLoading(false);
  }, [permission]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (!hasPermission) {
    if (!showAccessDenied) {
      router.push(fallbackUrl);
      return null;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="bg-red-100 rounded-full p-4 mb-4">
          <FiLock className="w-12 h-12 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Acceso Denegado
        </h2>
        <p className="text-gray-600 mb-6 max-w-md">
          No tienes permisos para acceder a esta sección. Contacta a un administrador si crees que deberías tener acceso.
        </p>
        <button
          onClick={() => router.push(fallbackUrl)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
