import { type ReactNode } from "react";
import { clsx } from "@/lib/utils";

export interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  headerAction?: ReactNode;
  noPadding?: boolean;
}

export function Card({
  children,
  className,
  title,
  subtitle,
  icon,
  headerAction,
  noPadding = false,
}: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-xl shadow-sm border border-gray-100",
        className
      )}
    >
      {(title || headerAction) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex items-start gap-2">
            {icon && <span className="text-primary-400 mt-0.5">{icon}</span>}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {headerAction && <div className="w-full sm:w-auto">{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-4 sm:p-6"}>{children}</div>
    </div>
  );
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "secondary" | "orange" | "purple" | "red" | "green";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  color = "primary",
  className,
}: StatCardProps) {
  const colorStyles = {
    primary: "border-l-primary-400 bg-primary-50/50",
    secondary: "border-l-secondary-400 bg-secondary-50/50",
    orange: "border-l-accent-orange bg-orange-50/50",
    purple: "border-l-accent-purple bg-purple-50/50",
    red: "border-l-red-500 bg-red-50/50",
    green: "border-l-green-500 bg-green-50/50",
  };

  const iconColors = {
    primary: "text-primary-400",
    secondary: "text-secondary-400",
    orange: "text-accent-orange",
    purple: "text-accent-purple",
    red: "text-red-500",
    green: "text-green-500",
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 p-6",
        colorStyles[color],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p
              className={clsx(
                "text-sm mt-2 flex items-center gap-1",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div
            className={clsx(
              "p-3 rounded-lg bg-white shadow-sm",
              iconColors[color]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
