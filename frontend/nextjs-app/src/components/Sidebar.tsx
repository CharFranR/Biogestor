"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/utils";
import {
  FiActivity,
  FiSliders,
  FiPackage,
  FiDroplet,
  FiUsers,
  FiCalculator,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { authService } from "@/lib/auth";
import type { User } from "@/types";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
}

const navItems: NavItem[] = [
  {
    name: "Sensores",
    href: "/sensores",
    icon: <FiActivity className="w-5 h-5" />,
    permission: "GestionarSensores",
  },
  {
    name: "Llenados",
    href: "/llenados",
    icon: <FiDroplet className="w-5 h-5" />,
    permission: "GestionarLlenados",
  },
  {
    name: "Calibraciones",
    href: "/calibraciones",
    icon: <FiSliders className="w-5 h-5" />,
    permission: "GestionarCalibraciones",
  },
  {
    name: "Inventario",
    href: "/inventario",
    icon: <FiPackage className="w-5 h-5" />,
    permission: "GestionarInventario",
  },
  {
    name: "Calculadora",
    href: "/calculadora",
    icon: <FiCalculator className="w-5 h-5" />,
    permission: "VerCalculadora",
  },
  {
    name: "Usuarios",
    href: "/permisos",
    icon: <FiUsers className="w-5 h-5" />,
    permission: "GestionarPermisos",
  },
  {
    name: "Mi Perfil",
    href: "/perfil",
    icon: <FiUser className="w-5 h-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(authService.getStoredUser());
  }, []);

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true;
    if (user?.perfil?.rol === "ADMIN") return true;
    return user?.perfil?.permisos?.[permission] ?? false;
  };

  const filteredNavItems = navItems.filter((item) => hasPermission(item.permission));

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-full bg-sidebar-bg text-white transition-all duration-300 z-30",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-400 rounded-lg flex items-center justify-center">
            <FiActivity className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold">Biogestor</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-active text-white"
                      : "text-gray-300 hover:bg-sidebar-hover hover:text-white"
                  )}
                >
                  <span
                    className={clsx(
                      "flex-shrink-0",
                      isActive ? "text-primary-400" : ""
                    )}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 p-2 bg-sidebar-hover rounded-lg text-gray-300 hover:text-white hover:bg-sidebar-active transition-colors"
      >
        {isCollapsed ? (
          <FiChevronRight className="w-5 h-5" />
        ) : (
          <FiChevronLeft className="w-5 h-5" />
        )}
      </button>
    </aside>
  );
}
