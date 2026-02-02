"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiStopCircle,
  FiDroplet,
  FiTrendingUp,
  FiActivity,
  FiThermometer,
  FiEye,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { PermissionGuard } from "@/components/PermissionGuard";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
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
import { useSensorDataByFill, useSensors } from "@/lib/services/sensorService";
import { useProductionSummary } from "@/lib/services/productionService";
import { formatDate } from "@/lib/utils";
import type { Fill, FillCreateData, SensorData, RealProductionSummary } from "@/types";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

export default function LlenadosPage() {
  const { data: fills = [], isLoading } = useFills();
  const { data: materials = [] } = useBasicParams();
  const { data: sensors = [] } = useSensors();

  const createFill = useCreateFill();
  const updateFill = useUpdateFill();
  const deleteFill = useDeleteFill();
  const endFill = useEndFill();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFill, setEditingFill] = useState<Fill | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [endConfirm, setEndConfirm] = useState<number | null>(null);
  const [selectedFillForData, setSelectedFillForData] = useState<number | null>(null);

  // Find the active fill
  const activeFill = fills.find((f) => !f.last_day);

  // Fetch real sensor data for selected fill
  const { data: fillSensorData = [], isLoading: isLoadingSensorData } = useSensorDataByFill(
    selectedFillForData || 0
  );

  // Fetch real production data for the active fill
  const { data: realProduction, isLoading: isLoadingProduction } = useProductionSummary(
    activeFill?.id || 0
  );

  // Set selected fill to active fill by default if available
  const effectiveFillId = selectedFillForData ?? activeFill?.id ?? null;
  const selectedFill = fills.find((f) => f.id === effectiveFillId);

  // Group sensor data by sensor for charts
  const sensorDataGrouped = useMemo(() => {
    const grouped: Record<string, { name: string; values: number[]; dates: string[] }> = {};
    
    fillSensorData.forEach((data: SensorData) => {
      const sensorName = data.sensor?.name || `Sensor ${data.sensor?.id}`;
      if (!grouped[sensorName]) {
        grouped[sensorName] = { name: sensorName, values: [], dates: [] };
      }
      grouped[sensorName].values.push(data.value);
      grouped[sensorName].dates.push(new Date(data.date).toLocaleDateString());
    });
    
    return grouped;
  }, [fillSensorData]);

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
          <Button
            size="sm"
            variant={selectedFillForData === fill.id ? "primary" : "ghost"}
            onClick={() => setSelectedFillForData(selectedFillForData === fill.id ? null : fill.id)}
            leftIcon={<FiEye className="w-4 h-4" />}
          >
            Ver Datos
          </Button>
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
    <PermissionGuard permission="ViewFillData">
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

      {/* Production Charts - Only show when there's an active fill with prediction */}
      {activeFill?.prediction && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cumulative Production Chart - Predicted vs Real */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiTrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Producción Acumulada</h3>
                </div>
                {isLoadingProduction && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                )}
              </div>
              <div className="h-64">
                <Line
                  data={{
                    labels: activeFill.prediction.cumulative_production.map((_, i) => i + 1),
                    datasets: [
                      {
                        label: "Predicción (m³)",
                        data: activeFill.prediction.cumulative_production,
                        borderColor: "#3b82f6",
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderDash: [5, 5],
                      },
                      ...(realProduction ? [{
                        label: "Real (m³)",
                        data: realProduction.cumulative_values,
                        borderColor: "#f59e0b",
                        backgroundColor: "rgba(245, 158, 11, 0.1)",
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: "#f59e0b",
                      }] : []),
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        display: !!realProduction,
                        position: "top" as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(3)} m³`,
                          title: (ctx) => `Día ${ctx[0]?.label ?? ''}`,
                        },
                      },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: "Días" },
                        ticks: { maxTicksLimit: 10 },
                      },
                      y: {
                        title: { display: true, text: "m³" },
                      },
                    },
                  }}
                />
              </div>
              <div className="mt-3 flex justify-around text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Potencial Total</p>
                  <p className="font-medium text-blue-600">
                    {activeFill.prediction.potencial_production.toFixed(3)} m³
                  </p>
                </div>
                {realProduction && (
                  <div className="text-center">
                    <p className="text-gray-500">Real Acumulado</p>
                    <p className="font-medium text-amber-600">
                      {realProduction.total_production.toFixed(3)} m³
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Daily Production Chart - Predicted vs Real */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FiActivity className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-800">Producción Diaria</h3>
                </div>
              </div>
              <div className="h-64">
                <Line
                  data={{
                    labels: activeFill.prediction.derivative_production.map((_, i) => i + 1),
                    datasets: [
                      {
                        label: "Predicción (m³/día)",
                        data: activeFill.prediction.derivative_production,
                        borderColor: "#22c55e",
                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderDash: [5, 5],
                      },
                      ...(realProduction ? [{
                        label: "Real (m³/día)",
                        data: realProduction.daily_values,
                        borderColor: "#ef4444",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        fill: false,
                        tension: 0.4,
                        pointRadius: 3,
                        pointBackgroundColor: "#ef4444",
                      }] : []),
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        display: !!realProduction,
                        position: "top" as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(4)} m³/día`,
                          title: (ctx) => `Día ${ctx[0]?.label ?? ''}`,
                        },
                      },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: "Días" },
                        ticks: { maxTicksLimit: 10 },
                      },
                      y: {
                        title: { display: true, text: "m³/día" },
                      },
                    },
                  }}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-500">Sólidos Totales</p>
                  <p className="font-medium text-gray-800">{activeFill.prediction.total_solids.toFixed(3)} kg</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500">Sólidos Volátiles</p>
                  <p className="font-medium text-gray-800">{activeFill.prediction.total_volatile_solids.toFixed(3)} kg</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* No Real Data Banner - Show when prediction exists but no real data */}
      {activeFill?.prediction && !realProduction && !isLoadingProduction && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <FiActivity className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-800">Sin datos de producción real</p>
              <p className="text-sm text-amber-600">
                Las gráficas muestran solo las predicciones del modelo. Los datos reales se mostrarán cuando estén disponibles.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Real Sensor Data Charts - Show when a fill is selected */}
      {selectedFillForData && (
        <Card
          title={`Datos Reales de Sensores - Llenado #${selectedFillForData}`}
          subtitle={
            selectedFill
              ? `${formatDate(selectedFill.first_day)}${selectedFill.last_day ? ` - ${formatDate(selectedFill.last_day)}` : " (Activo)"}`
              : ""
          }
        >
          {isLoadingSensorData ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              Cargando datos de sensores...
            </div>
          ) : fillSensorData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiThermometer className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay datos de sensores registrados para este llenado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
              {Object.entries(sensorDataGrouped).map(([sensorName, data]) => (
                <div key={sensorName} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FiThermometer className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-800">{sensorName}</h4>
                    <Badge variant="info">{data.values.length} lecturas</Badge>
                  </div>
                  <div className="h-48">
                    <Line
                      data={{
                        labels: data.dates,
                        datasets: [
                          {
                            label: sensorName,
                            data: data.values,
                            borderColor: "#8b5cf6",
                            backgroundColor: "rgba(139, 92, 246, 0.1)",
                            fill: true,
                            tension: 0.4,
                            pointRadius: 2,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (ctx) => `${(ctx.parsed.y ?? 0).toFixed(2)}`,
                            },
                          },
                        },
                        scales: {
                          x: {
                            ticks: { maxTicksLimit: 6 },
                          },
                        },
                      }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                    <div>
                      <p className="text-gray-500">Mín</p>
                      <p className="font-medium">{Math.min(...data.values).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Promedio</p>
                      <p className="font-medium">
                        {(data.values.reduce((a, b) => a + b, 0) / data.values.length).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Máx</p>
                      <p className="font-medium">{Math.max(...data.values).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
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
    </PermissionGuard>
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
