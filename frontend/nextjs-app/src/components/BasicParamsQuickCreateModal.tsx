"use client";

import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiPlus } from "react-icons/fi";
import { Modal, Button, Input } from "@/components/ui";
import { useCreateBasicParams } from "@/lib/services/calculatorService";
import type { BasicParams, BasicParamsCreateData } from "@/types";

interface BasicParamsQuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (material: BasicParams) => void;
}

export function BasicParamsQuickCreateModal({
  isOpen,
  onClose,
  onCreated,
}: BasicParamsQuickCreateModalProps) {
  const createBasicParams = useCreateBasicParams();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BasicParamsCreateData>({
    defaultValues: {
      supplyName: "",
      TS: 0,
      VSTS: 0,
      potencial_production: 0,
    },
  });

  const onSubmit = async (data: BasicParamsCreateData) => {
    try {
      const created = await createBasicParams.mutateAsync(data);
      toast.success("Material creado exitosamente");
      onCreated?.(created);
      reset();
      onClose();
    } catch {
      toast.error("Error al crear el material");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Material"
      size="md"
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            isLoading={createBasicParams.isPending}
            leftIcon={<FiPlus className="w-4 h-4" />}
          >
            Crear Material
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <Input
          label="Nombre del material"
          error={errors.supplyName?.message}
          {...register("supplyName", {
            required: "El nombre es requerido",
          })}
        />

        <Input
          label="Sólidos Totales (TS)"
          type="number"
          step="0.01"
          error={errors.TS?.message}
          {...register("TS", {
            required: "TS es requerido",
            min: { value: 0, message: "Debe ser >= 0" },
            valueAsNumber: true,
          })}
        />

        <Input
          label="Relación VS/TS"
          type="number"
          step="0.01"
          error={errors.VSTS?.message}
          {...register("VSTS", {
            required: "VSTS es requerido",
            min: { value: 0, message: "Debe ser >= 0" },
            valueAsNumber: true,
          })}
        />

        <Input
          label="Potencial de producción (m³/kg VS)"
          type="number"
          step="0.001"
          error={errors.potencial_production?.message}
          {...register("potencial_production", {
            required: "El potencial es requerido",
            min: { value: 0, message: "Debe ser >= 0" },
            valueAsNumber: true,
          })}
        />
      </form>
    </Modal>
  );
}
