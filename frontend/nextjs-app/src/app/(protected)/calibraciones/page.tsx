"use client";

import { useState } from "react";
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
import {
  useCalibrations,
  useCreateCalibration,
  useUpdateCalibration,
  useDeleteCalibration,
} from "@/lib/services/calibrationService";
import { useSensors } from "@/lib/services/sensorService";
import { formatDate } from "@/lib/utils";
import type { Calibration, CalibrationCreateData } from "@/types";

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

  const columns = [
    {
      key: "date",
      header: "Fecha",
      render: (cal: Calibration) => formatDate(cal.date),
    },
    {
      key: "sensor",
      header: "Sensor",
      render: (cal: Calibration) => {
        const sensor = sensors.find((s) => s.id === cal.sensor);
        return sensor?.name || `ID: ${cal.sensor}`;
      },
    },
    {
      key: "standard_value",
      header: "Valor Estándar",
      render: (cal: Calibration) => cal.standard_value.toFixed(3),
    },
    {
      key: "measured_value",
      header: "Valor Medido",
      render: (cal: Calibration) => cal.measured_value.toFixed(3),
    },
    {
      key: "error",
      header: "Error (%)",
      render: (cal: Calibration) => (
        <span
          className={
            Math.abs(cal.error) > 5 ? "text-red-500 font-medium" : "text-green-600"
          }
        >
          {cal.error.toFixed(2)}%
        </span>
      ),
    },
    {
      key: "calibrated_by",
      header: "Calibrado Por",
      render: (cal: Calibration) => cal.calibrated_by || "-",
    },
    {
      key: "actions",
      header: "Acciones",
      render: (cal: Calibration) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(cal)}
            leftIcon={<FiEdit2 className="w-4 h-4" />}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteConfirm(cal.id)}
            leftIcon={<FiTrash2 className="w-4 h-4 text-red-500" />}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Calibraciones de Sensores"
        subtitle="Registro histórico de calibraciones realizadas"
        headerAction={
          <Button onClick={handleCreate} leftIcon={<FiPlus className="w-4 h-4" />}>
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
  );
}

interface CalibrationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibration: Calibration | null;
  sensors: { id: number; name: string }[];
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<CalibrationCreateData>({
    defaultValues: calibration
      ? {
          sensor: calibration.sensor,
          date: calibration.date,
          standard_value: calibration.standard_value,
          measured_value: calibration.measured_value,
          error: calibration.error,
          observations: calibration.observations || "",
          calibrated_by: calibration.calibrated_by || "",
        }
      : {
          sensor: sensors[0]?.id || 0,
          date: new Date().toISOString().split("T")[0],
          standard_value: 0,
          measured_value: 0,
          error: 0,
          observations: "",
          calibrated_by: "",
        },
  });

  const standardValue = watch("standard_value");
  const measuredValue = watch("measured_value");

  // Auto-calculate error
  const calculateError = () => {
    if (standardValue && measuredValue && standardValue !== 0) {
      const error = ((measuredValue - standardValue) / standardValue) * 100;
      setValue("error", parseFloat(error.toFixed(4)));
    }
  };

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
        <div className="flex justify-end gap-3">
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
            error={errors.sensor?.message}
            {...register("sensor", {
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

          <Input
            label="Valor Estándar"
            type="number"
            step="0.0001"
            error={errors.standard_value?.message}
            {...register("standard_value", {
              required: "El valor estándar es requerido",
              valueAsNumber: true,
              onBlur: calculateError,
            })}
          />

          <Input
            label="Valor Medido"
            type="number"
            step="0.0001"
            error={errors.measured_value?.message}
            {...register("measured_value", {
              required: "El valor medido es requerido",
              valueAsNumber: true,
              onBlur: calculateError,
            })}
          />

          <Input
            label="Error (%)"
            type="number"
            step="0.0001"
            error={errors.error?.message}
            {...register("error", {
              required: "El error es requerido",
              valueAsNumber: true,
            })}
          />

          <Input
            label="Calibrado Por"
            type="text"
            placeholder="Nombre del técnico"
            {...register("calibrated_by")}
          />
        </div>

        <Textarea
          label="Observaciones"
          placeholder="Notas adicionales sobre la calibración..."
          rows={3}
          {...register("observations")}
        />
      </form>
    </Modal>
  );
}
