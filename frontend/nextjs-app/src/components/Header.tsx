"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FiLogOut, FiUser, FiChevronDown } from "react-icons/fi";
import { authService } from "@/lib/auth";
import { clsx, getInitials } from "@/lib/utils";
import type { User } from "@/types";

const pageTitles: Record<string, string> = {
  "/sensores": "Monitoreo de Sensores",
  "/llenados": "Gestión de Llenados",
  "/calibraciones": "Calibraciones",
  "/inventario": "Inventario",
  "/calculadora": "Calculadora de Producción",
  "/permisos": "Gestión de Usuarios",
  "/perfil": "Mi Perfil",
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(authService.getStoredUser());
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  const pageTitle = pageTitles[pathname] || "Dashboard";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
      </div>

      {/* User Menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-9 h-9 bg-primary-400 rounded-full flex items-center justify-center text-white font-medium">
            {getInitials(user?.first_name, user?.last_name)}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500">
              {user?.perfil?.rol === "ADMIN"
                ? "Administrador"
                : user?.perfil?.rol === "COLAB"
                ? "Colaborador"
                : "Visitante"}
            </p>
          </div>
          <FiChevronDown
            className={clsx(
              "w-4 h-4 text-gray-400 transition-transform hidden sm:block",
              isDropdownOpen && "transform rotate-180"
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-fade-in">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                router.push("/perfil");
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <FiUser className="w-4 h-4" />
              Mi Perfil
            </button>
            <hr className="my-1 border-gray-200" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <FiLogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
