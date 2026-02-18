"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FiPlus, FiEdit2, FiTrash2, FiSliders } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  Card,
  Button,
  Table,
  Modal,
  ConfirmModal,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { PermissionGuard } from "@/components/PermissionGuard";
import {
  useCalibrations,
  useCreateCalibration,
  useUpdateCalibration,
  useDeleteCalibration,
} from "@/lib/services/calibrationService";
import { useSensors } from "@/lib/services/sensorService";
import { formatDate } from "@/lib/utils";
import type { Calibration, CalibrationCreateData, Sensor } from "@/types";

export default function CalibracionesPage() {
  const { data: calibrations = [], isLoading } = useCalibrations();
  const { data: sensors = [] } = useSensors();

  const createCalibration = useCreateCalibration();
  const updateCalibration = useUpdateCalibration();
  const deleteCalibration = useDeleteCalibration();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCalibration, setEditingCalibration] =
    useState<Calibration | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const handleCreate = () => {
    setEditingCalibration(null);
    setIsModalOpen(true);
  };

  const handleEdit = (calibration: Calibration) => {
    setEditingCalibration(calibration);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteCalibration.mutateAsync(deleteConfirm);
        toast.success("Calibración eliminada exitosamente");
        setDeleteConfirm(null);
      } catch {
        toast.error("Error al eliminar la calibración");
      }
    }
  };

  const renderPreviousCalibration = (value: string | null) => {
    if (!value) return "-";
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;
    return formatDate(value);
  };

  const columns = [
    {
      key: "date",
      header: "Fecha",
      render: (cal: Calibration) => formatDate(cal.date),
    },
    {
      key: "sensorId",
      header: "Sensor",
      render: (cal: Calibration) => {
        const sensor = sensors.find((s) => s.id === cal.sensorId);
        return sensor?.name || `ID: ${cal.sensorId}`;
      },
    },
    {
      key: "params",
      header: "Parámetros",
      render: (cal: Calibration) => cal.params,
    },
    {
      key: "result",
      header: "Resultado",
      render: (cal: Calibration) => cal.result,
    },
    {
      key: "previous_calibration",
      header: "Calibración Anterior",
      render: (cal: Calibration) => renderPreviousCalibration(cal.previous_calibration),
    },
    {
      key: "actions",
      header: "Acciones",
      render: (cal: Calibration) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(cal)}
            leftIcon={<FiEdit2 className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteConfirm(cal.id)}
            leftIcon={<FiTrash2 className="w-4 h-4 text-red-500" />}
            className="w-full sm:w-auto"
            aria-label="Eliminar calibración"
            title="Eliminar"
          />
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard permission="ViewCalibrations">
    <div className="space-y-4 sm:space-y-6">
      <Card
        title="Calibraciones de Sensores"
        subtitle="Registro histórico de calibraciones realizadas"
        headerAction={
          <Button onClick={handleCreate} leftIcon={<FiPlus className="w-4 h-4" />} className="w-full sm:w-auto">
            Nueva Calibración
          </Button>
        }
      >
        <Table
          columns={columns}
          data={calibrations}
          keyExtractor={(cal) => cal.id}
          isLoading={isLoading}
          emptyMessage="No hay calibraciones registradas"
        />
      </Card>

      {/* Create/Edit Modal */}
      <CalibrationFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCalibration(null);
        }}
        calibration={editingCalibration}
        sensors={sensors}
        onCreate={async (data) => {
          await createCalibration.mutateAsync(data);
          toast.success("Calibración creada exitosamente");
          setIsModalOpen(false);
        }}
        onUpdate={async (id, data) => {
          await updateCalibration.mutateAsync({ id, data });
          toast.success("Calibración actualizada exitosamente");
          setIsModalOpen(false);
          setEditingCalibration(null);
        }}
        isSubmitting={createCalibration.isPending || updateCalibration.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar Calibración"
        message="¿Estás seguro de que deseas eliminar este registro de calibración?"
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteCalibration.isPending}
      />
    </div>
    </PermissionGuard>
  );
}

interface CalibrationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibration: Calibration | null;
  sensors: Sensor[];
  onCreate: (data: CalibrationCreateData) => Promise<void>;
  onUpdate: (id: number, data: Partial<CalibrationCreateData>) => Promise<void>;
  isSubmitting: boolean;
}

function CalibrationFormModal({
  isOpen,
  onClose,
  calibration,
  sensors,
  onCreate,
  onUpdate,
  isSubmitting,
}: CalibrationFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CalibrationCreateData>();

  // Reset form when modal opens/closes or calibration changes
  useEffect(() => {
    if (isOpen) {
      if (calibration) {
        reset({
          userId: calibration.userId,
          sensorId: calibration.sensorId,
          date: calibration.date,
          params: calibration.params,
          note: calibration.note,
          result: calibration.result,
        });
      } else {
        reset({
          userId: 1, // TODO: Get from auth context
          sensorId: sensors[0]?.id || 0,
          date: new Date().toISOString().split("T")[0],
          params: "",
          note: "",
          result: "",
        });
      }
    }
  }, [isOpen, calibration, sensors, reset]);

  const onSubmit = async (data: CalibrationCreateData) => {
    try {
      if (calibration) {
        await onUpdate(calibration.id, data);
      } else {
        await onCreate(data);
      }
      reset();
    } catch {
      toast.error("Error al guardar la calibración");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={calibration ? "Editar Calibración" : "Nueva Calibración"}
      size="lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
          >
            {calibration ? "Guardar Cambios" : "Crear Calibración"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Sensor"
            options={sensors.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
            error={errors.sensorId?.message}
            {...register("sensorId", {
              required: "El sensor es requerido",
              valueAsNumber: true,
            })}
          />

          <Input
            label="Fecha"
            type="date"
            error={errors.date?.message}
            {...register("date", {
              required: "La fecha es requerida",
            })}
          />

          <div className="sm:col-span-2">
            <Input
              label="Parámetros"
              type="text"
              placeholder="Ej: pH 4.0, pH 7.0, pH 10.0"
              error={errors.params?.message}
              {...register("params", {
                required: "Los parámetros son requeridos",
              })}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Resultado"
              type="text"
              placeholder="Ej: Calibración exitosa, error < 0.1%"
              error={errors.result?.message}
              {...register("result", {
                required: "El resultado es requerido",
              })}
            />
          </div>
        </div>

        <Textarea
          label="Notas"
          placeholder="Observaciones adicionales sobre la calibración..."
          rows={3}
          {...register("note", {
            required: "Las notas son requeridas",
          })}
          error={errors.note?.message}
        />

        {/* Hidden field for userId - in production, get from auth context */}
        <input type="hidden" {...register("userId", { valueAsNumber: true })} />
      </form>
    </Modal>
  );
}
