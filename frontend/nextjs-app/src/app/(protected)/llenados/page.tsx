"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiStopCircle,
  FiDroplet,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  Card,
  Button,
  Table,
  Badge,
  Modal,
  ConfirmModal,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import {
  useFills,
  useCreateFill,
  useUpdateFill,
  useDeleteFill,
  useEndFill,
} from "@/lib/services/fillService";
import { useBasicParams } from "@/lib/services/calculatorService";
import { formatDate } from "@/lib/utils";
import type { Fill, FillCreateData } from "@/types";

export default function LlenadosPage() {
  const { data: fills = [], isLoading } = useFills();
  const { data: materials = [] } = useBasicParams();

  const createFill = useCreateFill();
  const updateFill = useUpdateFill();
  const deleteFill = useDeleteFill();
  const endFill = useEndFill();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFill, setEditingFill] = useState<Fill | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [endConfirm, setEndConfirm] = useState<number | null>(null);

  const handleCreate = () => {
    setEditingFill(null);
    setIsModalOpen(true);
  };

  const handleEdit = (fill: Fill) => {
    setEditingFill(fill);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteFill.mutateAsync(deleteConfirm);
        toast.success("Llenado eliminado exitosamente");
        setDeleteConfirm(null);
      } catch {
        toast.error("Error al eliminar el llenado");
      }
    }
  };

  const handleEndFill = async () => {
    if (endConfirm) {
      try {
        await endFill.mutateAsync(endConfirm);
        toast.success("Llenado finalizado exitosamente");
        setEndConfirm(null);
      } catch {
        toast.error("Error al finalizar el llenado");
      }
    }
  };

  const activeFill = fills.find((f) => !f.last_day);

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (fill: Fill) => `#${fill.id}`,
    },
    {
      key: "first_day",
      header: "Fecha Inicio",
      render: (fill: Fill) => formatDate(fill.first_day),
    },
    {
      key: "last_day",
      header: "Fecha Fin",
      render: (fill: Fill) =>
        fill.last_day ? (
          formatDate(fill.last_day)
        ) : (
          <Badge variant="success">Activo</Badge>
        ),
    },
    {
      key: "filling_mass",
      header: "Masa (kg)",
      render: (fill: Fill) => fill.filling_mass.toFixed(2),
    },
    {
      key: "type_material",
      header: "Material",
      render: (fill: Fill) => {
        const material = materials.find((m) => m.id === fill.type_material);
        return material?.supplyName || `ID: ${fill.type_material}`;
      },
    },
    {
      key: "actions",
      header: "Acciones",
      render: (fill: Fill) => (
        <div className="flex gap-2">
          {!fill.last_day && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setEndConfirm(fill.id)}
              leftIcon={<FiStopCircle className="w-4 h-4" />}
            >
              Finalizar
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(fill)}
            leftIcon={<FiEdit2 className="w-4 h-4" />}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteConfirm(fill.id)}
            leftIcon={<FiTrash2 className="w-4 h-4 text-red-500" />}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Active Fill Banner */}
      {activeFill && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiDroplet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">Llenado Activo</p>
              <p className="text-sm text-green-600">
                Iniciado el {formatDate(activeFill.first_day)} • Masa:{" "}
                {activeFill.filling_mass} kg
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setEndConfirm(activeFill.id)}
            leftIcon={<FiStopCircle className="w-4 h-4" />}
          >
            Finalizar Llenado
          </Button>
        </div>
      )}

      {/* Main Card */}
      <Card
        title="Gestión de Llenados"
        subtitle="Administra los ciclos de llenado del biodigestor"
        headerAction={
          <Button
            onClick={handleCreate}
            leftIcon={<FiPlus className="w-4 h-4" />}
            disabled={!!activeFill}
          >
            Nuevo Llenado
          </Button>
        }
      >
        <Table
          columns={columns}
          data={fills}
          keyExtractor={(fill) => fill.id}
          isLoading={isLoading}
          emptyMessage="No hay llenados registrados"
        />
      </Card>

      {/* Create/Edit Modal */}
      <FillFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFill(null);
        }}
        fill={editingFill}
        materials={materials}
        onCreate={async (data) => {
          await createFill.mutateAsync(data);
          toast.success("Llenado creado exitosamente");
          setIsModalOpen(false);
        }}
        onUpdate={async (id, data) => {
          await updateFill.mutateAsync({ id, data });
          toast.success("Llenado actualizado exitosamente");
          setIsModalOpen(false);
          setEditingFill(null);
        }}
        isSubmitting={createFill.isPending || updateFill.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar Llenado"
        message="¿Estás seguro de que deseas eliminar este llenado? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteFill.isPending}
      />

      {/* End Fill Confirmation */}
      <ConfirmModal
        isOpen={endConfirm !== null}
        onClose={() => setEndConfirm(null)}
        onConfirm={handleEndFill}
        title="Finalizar Llenado"
        message="¿Estás seguro de que deseas finalizar este llenado? Se registrará la fecha actual como fecha de fin."
        confirmText="Finalizar"
        variant="warning"
        isLoading={endFill.isPending}
      />
    </div>
  );
}

interface FillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  fill: Fill | null;
  materials: { id: number; supplyName: string }[];
  onCreate: (data: FillCreateData) => Promise<void>;
  onUpdate: (id: number, data: Partial<FillCreateData>) => Promise<void>;
  isSubmitting: boolean;
}

function FillFormModal({
  isOpen,
  onClose,
  fill,
  materials,
  onCreate,
  onUpdate,
  isSubmitting,
}: FillFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FillCreateData>({
    defaultValues: fill
      ? {
          people_involved: fill.people_involved || "",
          filling_mass: fill.filling_mass,
          approx_density: fill.approx_density,
          added_watter: fill.added_watter,
          type_material: fill.type_material,
          filling_moisture: fill.filling_moisture,
          delay_time: fill.delay_time,
        }
      : {
          filling_mass: 0,
          approx_density: 1,
          added_watter: 0,
          type_material: materials[0]?.id || 0,
          filling_moisture: 0,
          delay_time: 0,
        },
  });

  const onSubmit = async (data: FillCreateData) => {
    try {
      if (fill) {
        await onUpdate(fill.id, data);
      } else {
        await onCreate(data);
      }
      reset();
    } catch {
      toast.error("Error al guardar el llenado");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={fill ? "Editar Llenado" : "Nuevo Llenado"}
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
            {fill ? "Guardar Cambios" : "Crear Llenado"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Masa de Llenado (kg)"
            type="number"
            step="0.01"
            error={errors.filling_mass?.message}
            {...register("filling_mass", {
              required: "La masa es requerida",
              min: { value: 0.01, message: "Debe ser mayor a 0" },
              valueAsNumber: true,
            })}
          />

          <Input
            label="Densidad Aproximada (kg/L)"
            type="number"
            step="0.01"
            error={errors.approx_density?.message}
            {...register("approx_density", {
              required: "La densidad es requerida",
              min: { value: 0.01, message: "Debe ser mayor a 0" },
              valueAsNumber: true,
            })}
          />

          <Input
            label="Agua Agregada (L)"
            type="number"
            step="0.01"
            error={errors.added_watter?.message}
            {...register("added_watter", {
              required: "El agua agregada es requerida",
              min: { value: 0, message: "No puede ser negativo" },
              valueAsNumber: true,
            })}
          />

          <Select
            label="Tipo de Material"
            options={materials.map((m) => ({
              value: m.id,
              label: m.supplyName,
            }))}
            error={errors.type_material?.message}
            {...register("type_material", {
              required: "El material es requerido",
              valueAsNumber: true,
            })}
          />

          <Input
            label="Humedad del Llenado (%)"
            type="number"
            step="0.01"
            error={errors.filling_moisture?.message}
            {...register("filling_moisture", {
              required: "La humedad es requerida",
              min: { value: 0, message: "No puede ser negativo" },
              max: { value: 100, message: "No puede ser mayor a 100" },
              valueAsNumber: true,
            })}
          />

          <Input
            label="Tiempo de Retardo (días)"
            type="number"
            step="0.1"
            error={errors.delay_time?.message}
            {...register("delay_time", {
              required: "El tiempo de retardo es requerido",
              min: { value: 0, message: "No puede ser negativo" },
              valueAsNumber: true,
            })}
          />
        </div>

        <Textarea
          label="Personas Involucradas"
          placeholder="Nombres de las personas que participaron en el llenado..."
          rows={3}
          {...register("people_involved")}
        />
      </form>
    </Modal>
  );
}
