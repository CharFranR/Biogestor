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
  FiCpu,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiX,
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
    permission: "ViewDashboard",
  },
  {
    name: "Llenados",
    href: "/llenados",
    icon: <FiDroplet className="w-5 h-5" />,
    permission: "ViewFillData",
  },
  {
    name: "Calibraciones",
    href: "/calibraciones",
    icon: <FiSliders className="w-5 h-5" />,
    permission: "ViewCalibrations",
  },
  {
    name: "Inventario",
    href: "/inventario",
    icon: <FiPackage className="w-5 h-5" />,
    permission: "ViewInventory",
  },
  {
    name: "Calculadora",
    href: "/calculadora",
    icon: <FiCpu className="w-5 h-5" />,
    permission: "ViewCalculator",
  },
  {
    name: "Usuarios",
    href: "/permisos",
    icon: <FiUsers className="w-5 h-5" />,
    permission: "ViewUsers",
  },
  {
    name: "Mi Perfil",
    href: "/perfil",
    icon: <FiUser className="w-5 h-5" />,
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Start with stored user for immediate render
    setUser(authService.getStoredUser());
    
    // Then fetch fresh data from server
    authService.getCurrentUser()
      .then((freshUser) => setUser(freshUser))
      .catch(() => {
        // Keep stored user if API fails
      });
  }, []);

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true;
    // Superusers (Django admins) have all permissions
    if (user?.is_superuser) return true;
    return user?.profile?.permissions?.[permission] ?? false;
  };

  const filteredNavItems = navItems.filter((item) => hasPermission(item.permission));

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={clsx(
          "fixed left-0 top-0 h-full bg-sidebar-bg text-white transition-all duration-300 z-40",
          "w-64 lg:translate-x-0",
          isCollapsed && "lg:w-20",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* Logo */}
      <div className="relative flex items-center justify-center h-16 border-b border-white/10 px-3">
        <button
          onClick={onCloseMobile}
          className="absolute right-3 p-2 rounded-lg text-gray-300 hover:text-white hover:bg-sidebar-hover lg:hidden"
          aria-label="Cerrar menú"
        >
          <FiX className="w-5 h-5" />
        </button>
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
      <nav className="mt-6 px-3 pb-20 h-[calc(100%-4rem)] overflow-y-auto">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
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
                  {(!isCollapsed || isMobileOpen) && (
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
        onClick={onToggleCollapse}
        className="hidden lg:block absolute bottom-6 left-1/2 transform -translate-x-1/2 p-2 bg-sidebar-hover rounded-lg text-gray-300 hover:text-white hover:bg-sidebar-active transition-colors"
        aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
      >
        {isCollapsed ? (
          <FiChevronRight className="w-5 h-5" />
        ) : (
          <FiChevronLeft className="w-5 h-5" />
        )}
      </button>
      </aside>
    </>
  );
}
