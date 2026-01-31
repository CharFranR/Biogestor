"use client";

import { useState, useEffect } from "react";
import { FiCheck, FiX, FiUsers, FiUserCheck, FiShield } from "react-icons/fi";
import toast from "react-hot-toast";
import { Card, Button, Tabs, Table, Badge, Modal } from "@/components/ui";
import {
  useApprovedUsers,
  usePendingUsers,
  useApproveUser,
  useUserPermissions,
  useUpdateUserPermissions,
  useUpdateUserRole,
} from "@/lib/services/userService";
import type { User, UserPermissions } from "@/types";

const PERMISSION_LABELS: Record<string, string> = {
  VerDashboard: "Ver Dashboard",
  GestionarSensores: "Gestionar Sensores",
  GestionarCalibraciones: "Gestionar Calibraciones",
  GestionarInventario: "Gestionar Inventario",
  GestionarLlenados: "Gestionar Llenados",
  VerCalculadora: "Ver Calculadora",
  AprobarUsuarios: "Aprobar Usuarios",
  GestionarPermisos: "Gestionar Permisos",
};

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "COLAB", label: "Colaborador" },
  { value: "VISIT", label: "Visitante" },
];

export default function PermisosPage() {
  const { data: approvedUsers = [], isLoading: loadingApproved, error: approvedError } = useApprovedUsers();
  const { data: pendingUsers = [], isLoading: loadingPending, error: pendingError } = usePendingUsers();

  const approveUser = useApproveUser();
  const updatePermissions = useUpdateUserPermissions();
  const updateRole = useUpdateUserRole();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  // Handle auth errors
  if (approvedError || pendingError) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FiUsers className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error al cargar usuarios
            </h3>
            <p className="text-gray-500">
              No tienes permisos para ver esta sección o ha ocurrido un error.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const handleApproveUser = async (userId: number) => {
    try {
      await approveUser.mutateAsync(userId);
      toast.success("Usuario aprobado exitosamente");
    } catch {
      toast.error("Error al aprobar el usuario");
    }
  };

  const handleOpenPermissions = (user: User) => {
    setSelectedUser(user);
    setIsPermissionsModalOpen(true);
  };

  const pendingColumns = [
    { key: "username", header: "Usuario" },
    { key: "email", header: "Correo" },
    {
      key: "name",
      header: "Nombre",
      render: (user: User) => `${user.first_name} ${user.last_name}`,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (user: User) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleApproveUser(user.id)}
            isLoading={approveUser.isPending}
            leftIcon={<FiCheck className="w-4 h-4" />}
          >
            Aprobar
          </Button>
        </div>
      ),
    },
  ];

  const approvedColumns = [
    { key: "username", header: "Usuario" },
    { key: "email", header: "Correo" },
    {
      key: "name",
      header: "Nombre",
      render: (user: User) => `${user.first_name} ${user.last_name}`,
    },
    {
      key: "role",
      header: "Rol",
      render: (user: User) => {
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
          <Badge variant={roleColors[user.profile?.rol || "VISIT"]}>
            {roleLabels[user.profile?.rol || "VISIT"]}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Acciones",
      render: (user: User) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenPermissions(user)}
          leftIcon={<FiShield className="w-4 h-4" />}
        >
          Permisos
        </Button>
      ),
    },
  ];

  const tabs = [
    {
      id: "approved",
      label: `Aprobados (${approvedUsers.length})`,
      icon: <FiUserCheck className="w-4 h-4" />,
      content: (
        <Table
          columns={approvedColumns}
          data={approvedUsers}
          keyExtractor={(user) => user.id}
          isLoading={loadingApproved}
          emptyMessage="No hay usuarios aprobados"
        />
      ),
    },
    {
      id: "pending",
      label: `Pendientes (${pendingUsers.length})`,
      icon: <FiUsers className="w-4 h-4" />,
      content: (
        <Table
          columns={pendingColumns}
          data={pendingUsers}
          keyExtractor={(user) => user.id}
          isLoading={loadingPending}
          emptyMessage="No hay usuarios pendientes de aprobación"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <Tabs tabs={tabs} />
      </Card>

      {/* Permissions Modal */}
      {selectedUser && (
        <PermissionsModal
          user={selectedUser}
          isOpen={isPermissionsModalOpen}
          onClose={() => {
            setIsPermissionsModalOpen(false);
            setSelectedUser(null);
          }}
          updatePermissions={updatePermissions}
          updateRole={updateRole}
        />
      )}
    </div>
  );
}

interface PermissionsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  updatePermissions: ReturnType<typeof useUpdateUserPermissions>;
  updateRole: ReturnType<typeof useUpdateUserRole>;
}

function PermissionsModal({
  user,
  isOpen,
  onClose,
  updatePermissions,
  updateRole,
}: PermissionsModalProps) {
  const { data: permissions, isLoading } = useUserPermissions(user.id);
  const [localPermissions, setLocalPermissions] = useState<UserPermissions>({});
  const [localRole, setLocalRole] = useState(user.profile?.rol || "VISIT");

  // Update local state when permissions are loaded
  useEffect(() => {
    if (permissions) {
      setLocalPermissions(permissions);
    }
  }, [permissions]);

  const handleTogglePermission = (key: string) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      await updatePermissions.mutateAsync({
        userId: user.id,
        permissions: localPermissions,
      });

      if (localRole !== user.profile?.rol) {
        await updateRole.mutateAsync({
          userId: user.id,
          role: localRole as "ADMIN" | "COLAB" | "VISIT",
        });
      }

      toast.success("Permisos actualizados exitosamente");
      onClose();
    } catch {
      toast.error("Error al actualizar permisos");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Permisos de ${user.first_name} ${user.last_name}`}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={updatePermissions.isPending || updateRole.isPending}
          >
            Guardar Cambios
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol del Usuario
            </label>
            <div className="flex gap-2">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLocalRole(option.value as "ADMIN" | "COLAB" | "VISIT")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localRole === option.value
                      ? "bg-primary-400 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Grid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permisos
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleTogglePermission(key)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    localPermissions[key]
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <span className="text-sm text-gray-700">{label}</span>
                  {localPermissions[key] ? (
                    <FiCheck className="w-5 h-5 text-green-500" />
                  ) : (
                    <FiX className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
