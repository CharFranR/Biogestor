"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiPlay,
  FiRefreshCw,
  FiInfo,
  FiTrendingUp,
  FiBarChart2,
  FiPlus,
} from "react-icons/fi";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import toast from "react-hot-toast";
import { Card, Button, Input, Select, StatCard } from "@/components/ui";
import { BasicParamsQuickCreateModal } from "@/components/BasicParamsQuickCreateModal";
import { PermissionGuard } from "@/components/PermissionGuard";
import {
  useBasicParams,
  useRunCalculation,
} from "@/lib/services/calculatorService";
import type { CalculationInput, CalculationResult } from "@/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function CalculadoraPage() {
  const { data: materials = [], isLoading: loadingMaterials, error: materialsError } = useBasicParams();
  const runCalculation = useRunCalculation();

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  // Debug: Log materials
  console.log("Materials:", materials, "Loading:", loadingMaterials, "Error:", materialsError);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CalculationInput>({
    defaultValues: {
      filling_mass: 100,
      approx_density: 1.0,
      added_watter: 50,
      type_material: 0,
      filling_moisture: 80,
      delay_time: 2,
      days: 30,
      temperature: 35,
    },
  });

  const selectedMaterialId = watch("type_material");
  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  const onSubmit = async (data: CalculationInput) => {
    try {
      const response = await runCalculation.mutateAsync(data);
      setResult(response);
      toast.success("Simulación completada exitosamente");
    } catch {
      toast.error("Error al ejecutar la simulación");
    }
  };

  const handleMaterialChange = (materialId: number) => {
    setValue("type_material", materialId, { shouldValidate: true });
    const material = materials.find((m) => m.id === materialId);
    if (material) {
      toast.success(`Material seleccionado: ${material.supplyName}`);
    }
  };

  const cumulativeChartData = {
    labels: result?.cumulative_production?.map((_, i) => `Día ${i + 1}`) || [],
    datasets: [
      {
        label: "Producción Acumulada (m³)",
        data: result?.cumulative_production || [],
        borderColor: "#26a69a",
        backgroundColor: "rgba(38, 166, 154, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const dailyChartData = {
    labels: result?.derivative_production?.map((_, i) => `Día ${i + 1}`) || [],
    datasets: [
      {
        label: "Producción Diaria (m³/día)",
        data: result?.derivative_production || [],
        borderColor: "#42a5f5",
        backgroundColor: "rgba(66, 165, 245, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <PermissionGuard permission="ViewCalculator">
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Parámetros */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="Parámetros de Entrada" icon={<FiInfo className="w-5 h-5" />}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    label="Material"
                    options={materials.map((m) => ({
                      value: m.id,
                      label: `${m.supplyName} (TS: ${m.TS}%)`,
                    }))}
                    placeholder={loadingMaterials ? "Cargando materiales..." : "Seleccione un material"}
                    error={errors.type_material?.message}
                    value={selectedMaterialId || ""}
                    onChange={(e) => handleMaterialChange(Number(e.target.value))}
                    disabled={loadingMaterials}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMaterialModalOpen(true)}
                  leftIcon={<FiPlus className="w-4 h-4" />}
                  className="mb-0.5"
                  title="Agregar nuevo material"
                >
                  <span className="hidden sm:inline">Nuevo</span>
                </Button>
              </div>

              {selectedMaterial && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1 text-gray-900">
                  <p>
                    <span className="font-medium text-gray-700">Sólidos Totales (TS):</span>{" "}
                    {selectedMaterial.TS}%
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">VS/TS:</span>{" "}
                    {selectedMaterial.VSTS}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Potencial:</span>{" "}
                    {selectedMaterial.potencial_production} m³/kg VS
                  </p>
                </div>
              )}

              <Input
                label="Masa de llenado (kg)"
                type="number"
                step="0.1"
                error={errors.filling_mass?.message}
                {...register("filling_mass", {
                  required: "Requerido",
                  min: { value: 0.1, message: "Debe ser mayor a 0" },
                  valueAsNumber: true,
                })}
              />

              <Input
                label="Densidad aproximada (kg/L)"
                type="number"
                step="0.01"
                error={errors.approx_density?.message}
                {...register("approx_density", {
                  required: "Requerido",
                  min: { value: 0.1, message: "Debe ser mayor a 0" },
                  valueAsNumber: true,
                })}
              />

              <Input
                label="Agua añadida (L)"
                type="number"
                step="0.1"
                error={errors.added_watter?.message}
                {...register("added_watter", {
                  required: "Requerido",
                  min: { value: 0, message: "No puede ser negativo" },
                  valueAsNumber: true,
                })}
              />

              <Input
                label="Humedad del llenado (%)"
                type="number"
                step="0.1"
                error={errors.filling_moisture?.message}
                {...register("filling_moisture", {
                  required: "Requerido",
                  min: { value: 0, message: "Min 0%" },
                  max: { value: 100, message: "Max 100%" },
                  valueAsNumber: true,
                })}
              />

              <Input
                label="Tiempo de retardo (días)"
                type="number"
                step="0.5"
                error={errors.delay_time?.message}
                {...register("delay_time", {
                  required: "Requerido",
                  min: { value: 0, message: "No puede ser negativo" },
                  valueAsNumber: true,
                })}
              />

              <Input
                label="Días de simulación"
                type="number"
                step="1"
                error={errors.days?.message}
                {...register("days", {
                  required: "Requerido",
                  min: { value: 1, message: "Mínimo 1 día" },
                  max: { value: 365, message: "Máximo 365 días" },
                  valueAsNumber: true,
                })}
              />

              <Input
                label="Temperatura (°C)"
                type="number"
                step="0.1"
                error={errors.temperature?.message}
                {...register("temperature", {
                  required: "Requerido",
                  min: { value: 20, message: "Min 20°C" },
                  max: { value: 60, message: "Max 60°C" },
                  valueAsNumber: true,
                })}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={runCalculation.isPending}
                  leftIcon={<FiPlay className="w-4 h-4" />}
                  fullWidth
                >
                  Simular
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResult(null)}
                  leftIcon={<FiRefreshCw className="w-4 h-4" />}
                >
                  Limpiar
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              {/* Resumen de Resultados */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Producción Potencial"
                  value={`${result.potencial_production?.toFixed(2) || "0"} m³`}
                  icon={<FiBarChart2 className="w-6 h-6" />}
                  trend={
                    result.potencial_production > 0
                      ? { value: 100, isPositive: true }
                      : undefined
                  }
                />
                <StatCard
                  title="Pico de Producción"
                  value={`${Math.max(...(result.derivative_production || [0])).toFixed(3)} m³/día`}
                  icon={<FiTrendingUp className="w-6 h-6" />}
                />
                <StatCard
                  title="Día del Pico"
                  value={`Día ${
                    (result.derivative_production?.indexOf(
                      Math.max(...(result.derivative_production || [0]))
                    ) || 0) + 1
                  }`}
                  icon={<FiInfo className="w-6 h-6" />}
                />
                <StatCard
                  title="VS Totales"
                  value={`${result.total_volatile_solids?.toFixed(2) || "0"} kg`}
                  icon={<FiBarChart2 className="w-6 h-6" />}
                />
              </div>

              {/* Gráfica de Producción Acumulada */}
              <Card
                title="Producción Acumulada"
                icon={<FiTrendingUp className="w-5 h-5" />}
              >
                <div className="h-80">
                  <Line data={cumulativeChartData} options={chartOptions} />
                </div>
              </Card>

              {/* Gráfica de Producción Diaria */}
              <Card
                title="Producción Diaria"
                icon={<FiBarChart2 className="w-5 h-5" />}
              >
                <div className="h-80">
                  <Line data={dailyChartData} options={chartOptions} />
                </div>
              </Card>
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-20">
              <FiBarChart2 className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Sin resultados
              </h3>
              <p className="text-gray-400 text-center max-w-md">
                Configura los parámetros de entrada y ejecuta la simulación para
                ver las predicciones de producción de biogás basadas en el modelo
                de Gompertz modificado.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Información del Modelo */}
      <Card title="Modelo de Gompertz Modificado" icon={<FiInfo className="w-5 h-5" />}>
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700">
            El sistema utiliza el modelo de Gompertz modificado para predecir la
            producción de biogás. Este modelo describe el crecimiento sigmoidal
            característico de la producción acumulada de biogás durante la digestión
            anaerobia.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg mt-4 font-mono text-center text-gray-900">
            Y(t) = P × exp(-b × exp(-c × t))
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
            <div className="bg-blue-100 p-3 rounded text-blue-900">
              <strong>Y(t):</strong> Producción acumulada en el tiempo t
            </div>
            <div className="bg-green-100 p-3 rounded text-green-900">
              <strong>P:</strong> Producción potencial máxima
            </div>
            <div className="bg-yellow-100 p-3 rounded text-yellow-900">
              <strong>b, c:</strong> Parámetros cinéticos del modelo
            </div>
          </div>
        </div>
      </Card>
    </div>

    <BasicParamsQuickCreateModal
      isOpen={isMaterialModalOpen}
      onClose={() => setIsMaterialModalOpen(false)}
      onCreated={(material) => {
        setValue("type_material", material.id, { shouldValidate: true });
      }}
    />
    </PermissionGuard>
  );
}
