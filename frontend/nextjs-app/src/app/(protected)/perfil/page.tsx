"use client";

import { FiUser, FiMail, FiCalendar, FiShield } from "react-icons/fi";
import { Card, StatCard, Badge } from "@/components/ui";
import { useCurrentUser } from "@/lib/services/userService";
import { getInitials, formatDate } from "@/lib/utils";

export default function PerfilPage() {
  const { data: user, isLoading, error } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <Card>
        <div className="text-center py-8 text-red-500">
          Error al cargar el perfil del usuario
        </div>
      </Card>
    );
  }

  const roleLabels = {
    ADMIN: "Administrador",
    COLAB: "Colaborador",
    VISIT: "Visitante",
  };

  const roleColors = {
    ADMIN: "danger" as const,
    COLAB: "info" as const,
    VISIT: "default" as const,
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-primary-400 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {getInitials(user.first_name, user.last_name)}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-500 mt-1">@{user.username}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              <Badge
                variant={roleColors[user.profile?.rol || "VISIT"]}
                size="md"
              >
                {roleLabels[user.profile?.rol || "VISIT"]}
              </Badge>
              {user.profile?.aprobado ? (
                <Badge variant="success" size="md">
                  Cuenta Aprobada
                </Badge>
              ) : (
                <Badge variant="warning" size="md">
                  Pendiente de Aprobación
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* User Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Información de la Cuenta">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FiUser className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Nombre de Usuario</p>
                <p className="font-medium text-gray-900">{user.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FiMail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Correo Electrónico</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FiShield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Rol</p>
                <p className="font-medium text-gray-900">
                  {roleLabels[user.profile?.rol || "VISIT"]}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Permisos Asignados">
          <div className="space-y-2">
            {user.profile?.permissions ? (
              Object.entries(user.profile.permissions).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <Badge variant={value ? "success" : "default"} size="sm">
                    {value ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                No hay permisos configurados
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Estado de Cuenta"
          value={user.profile?.aprobado ? "Activa" : "Pendiente"}
          color={user.profile?.aprobado ? "green" : "orange"}
          icon={<FiShield className="w-6 h-6" />}
        />
        <StatCard
          title="Tipo de Usuario"
          value={roleLabels[user.profile?.rol || "VISIT"]}
          color="primary"
          icon={<FiUser className="w-6 h-6" />}
        />
        <StatCard
          title="Permisos Activos"
          value={
            user.profile?.permissions
              ? Object.values(user.profile.permissions).filter(Boolean).length
              : 0
          }
          color="secondary"
          icon={<FiCalendar className="w-6 h-6" />}
        />
      </div>
    </div>
  );
}
