"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiPackage,
  FiMapPin,
  FiDownload,
} from "react-icons/fi";
import toast from "react-hot-toast";
import {
  Card,
  Button,
  Table,
  Tabs,
  Modal,
  ConfirmModal,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { PermissionGuard } from "@/components/PermissionGuard";
import {
  useItems,
  usePlaces,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useCreatePlace,
  useUpdatePlace,
  useDeletePlace,
  useGeneratePlaceReport,
} from "@/lib/services/inventoryService";
import type { Item, Place, ItemCreateData, PlaceCreateData } from "@/types";

export default function InventarioPage() {
  const { data: items = [], isLoading: loadingItems } = useItems();
  const { data: places = [], isLoading: loadingPlaces } = usePlaces();

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const createPlace = useCreatePlace();
  const updatePlace = useUpdatePlace();
  const deletePlace = useDeletePlace();
  const generateReport = useGeneratePlaceReport();

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<number | null>(null);
  const [deletePlaceConfirm, setDeletePlaceConfirm] = useState<number | null>(null);

  const handleExportReport = async (placeId: number) => {
    try {
      await generateReport.mutateAsync(placeId);
      toast.success("Reporte generado exitosamente");
    } catch {
      toast.error("Error al generar el reporte");
    }
  };

  const itemColumns = [
    { key: "name", header: "Nombre" },
    {
      key: "quantity",
      header: "Cantidad",
      render: (item: Item) => `${item.quantity} ${item.measurement || item.unit || ""}`,
    },
    {
      key: "place",
      header: "Ubicación",
      render: (item: Item) => {
        const place = places.find((p) => p.id === item.place);
        return place?.name || "-";
      },
    },
    {
      key: "description",
      header: "Descripción",
      render: (item: Item) =>
        item.description?.substring(0, 50) || "-",
    },
    {
      key: "actions",
      header: "Acciones",
      render: (item: Item) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            leftIcon={<FiEdit2 className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteItemConfirm(item.id)}
            leftIcon={<FiTrash2 className="w-4 h-4 text-red-500" />}
            className="w-full sm:w-auto"
            aria-label="Eliminar item"
            title="Eliminar"
          />
        </div>
      ),
    },
  ];

  const placeColumns = [
    { key: "name", header: "Nombre" },
    {
      key: "description",
      header: "Descripción",
      render: (place: Place) => place.description || "-",
    },
    {
      key: "items_count",
      header: "Items",
      render: (place: Place) => items.filter((i) => i.place === place.id).length,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (place: Place) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExportReport(place.id)}
            isLoading={generateReport.isPending}
            leftIcon={<FiDownload className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingPlace(place);
              setIsPlaceModalOpen(true);
            }}
            leftIcon={<FiEdit2 className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeletePlaceConfirm(place.id)}
            leftIcon={<FiTrash2 className="w-4 h-4 text-red-500" />}
            className="w-full sm:w-auto"
            aria-label="Eliminar ubicación"
            title="Eliminar"
          />
        </div>
      ),
    },
  ];

  const tabs = [
    {
      id: "items",
      label: `Items (${items.length})`,
      icon: <FiPackage className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
              leftIcon={<FiPlus className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Nuevo Item
            </Button>
          </div>
          <Table
            columns={itemColumns}
            data={items}
            keyExtractor={(item) => item.id}
            isLoading={loadingItems}
            emptyMessage="No hay items registrados"
          />
        </div>
      ),
    },
    {
      id: "places",
      label: `Ubicaciones (${places.length})`,
      icon: <FiMapPin className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingPlace(null);
                setIsPlaceModalOpen(true);
              }}
              leftIcon={<FiPlus className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Nueva Ubicación
            </Button>
          </div>
          <Table
            columns={placeColumns}
            data={places}
            keyExtractor={(place) => place.id}
            isLoading={loadingPlaces}
            emptyMessage="No hay ubicaciones registradas"
          />
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard permission="ViewInventory">
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <Tabs tabs={tabs} />
      </Card>

      {/* Item Modal */}
      <ItemFormModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        places={places}
        onCreate={async (data) => {
          await createItem.mutateAsync(data);
          toast.success("Item creado exitosamente");
          setIsItemModalOpen(false);
        }}
        onUpdate={async (id, data) => {
          await updateItem.mutateAsync({ id, data });
          toast.success("Item actualizado exitosamente");
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        isSubmitting={createItem.isPending || updateItem.isPending}
      />

      {/* Place Modal */}
      <PlaceFormModal
        isOpen={isPlaceModalOpen}
        onClose={() => {
          setIsPlaceModalOpen(false);
          setEditingPlace(null);
        }}
        place={editingPlace}
        onCreate={async (data) => {
          await createPlace.mutateAsync(data);
          toast.success("Ubicación creada exitosamente");
          setIsPlaceModalOpen(false);
        }}
        onUpdate={async (id, data) => {
          await updatePlace.mutateAsync({ id, data });
          toast.success("Ubicación actualizada exitosamente");
          setIsPlaceModalOpen(false);
          setEditingPlace(null);
        }}
        isSubmitting={createPlace.isPending || updatePlace.isPending}
      />

      {/* Delete Item Confirmation */}
      <ConfirmModal
        isOpen={deleteItemConfirm !== null}
        onClose={() => setDeleteItemConfirm(null)}
        onConfirm={async () => {
          if (deleteItemConfirm) {
            await deleteItem.mutateAsync(deleteItemConfirm);
            toast.success("Item eliminado exitosamente");
            setDeleteItemConfirm(null);
          }
        }}
        title="Eliminar Item"
        message="¿Estás seguro de que deseas eliminar este item del inventario?"
        confirmText="Eliminar"
        variant="danger"
        isLoading={deleteItem.isPending}
      />

      {/* Delete Place Confirmation */}
      <ConfirmModal
        isOpen={deletePlaceConfirm !== null}
        onClose={() => setDeletePlaceConfirm(null)}
        onConfirm={async () => {
          if (deletePlaceConfirm) {
            await deletePlace.mutateAsync(deletePlaceConfirm);
            toast.success("Ubicación eliminada exitosamente");
            setDeletePlaceConfirm(null);
          }
        }}
        title="Eliminar Ubicación"
        message="¿Estás seguro de que deseas eliminar esta ubicación? Los items asociados quedarán sin ubicación."
        confirmText="Eliminar"
        variant="danger"
        isLoading={deletePlace.isPending}
      />
    </div>
    </PermissionGuard>
  );
}

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  places: Place[];
  onCreate: (data: ItemCreateData) => Promise<void>;
  onUpdate: (id: number, data: Partial<ItemCreateData>) => Promise<void>;
  isSubmitting: boolean;
}

function ItemFormModal({
  isOpen,
  onClose,
  item,
  places,
  onCreate,
  onUpdate,
  isSubmitting,
}: ItemFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemCreateData>({
    defaultValues: item
      ? {
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          measurement: item.measurement || item.unit || "",
          place: item.place,
        }
      : {
          name: "",
          description: "",
          quantity: 1,
          measurement: "unidad",
          place: places[0]?.id || 0,
        },
  });

  const onSubmit = async (data: ItemCreateData) => {
    try {
      if (item) {
        await onUpdate(item.id, data);
      } else {
        await onCreate(data);
      }
      reset();
    } catch {
      toast.error("Error al guardar el item");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? "Editar Item" : "Nuevo Item"}
      size="md"
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
            {item ? "Guardar Cambios" : "Crear Item"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <Input
          label="Nombre"
          error={errors.name?.message}
          {...register("name", { required: "El nombre es requerido" })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Cantidad"
            type="number"
            step="0.01"
            error={errors.quantity?.message}
            {...register("quantity", {
              required: "La cantidad es requerida",
              min: { value: 0, message: "No puede ser negativo" },
              valueAsNumber: true,
            })}
          />

          <Input
            label="Unidad"
            placeholder="unidad, kg, L, etc."
            error={errors.measurement?.message}
            {...register("measurement", { required: "La unidad es requerida" })}
          />
        </div>

        <Select
          label="Ubicación"
          options={places.map((p) => ({ value: p.id, label: p.name }))}
          error={errors.place?.message}
          {...register("place", {
            required: "La ubicación es requerida",
            valueAsNumber: true,
          })}
        />

        <Textarea
          label="Descripción"
          placeholder="Descripción opcional del item..."
          rows={3}
          {...register("description")}
        />
      </form>
    </Modal>
  );
}

interface PlaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: Place | null;
  onCreate: (data: PlaceCreateData) => Promise<void>;
  onUpdate: (id: number, data: Partial<PlaceCreateData>) => Promise<void>;
  isSubmitting: boolean;
}

function PlaceFormModal({
  isOpen,
  onClose,
  place,
  onCreate,
  onUpdate,
  isSubmitting,
}: PlaceFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlaceCreateData>({
    defaultValues: place
      ? {
          name: place.name,
          description: place.description || "",
        }
      : {
          name: "",
          description: "",
        },
  });

  const onSubmit = async (data: PlaceCreateData) => {
    try {
      if (place) {
        await onUpdate(place.id, data);
      } else {
        await onCreate(data);
      }
      reset();
    } catch {
      toast.error("Error al guardar la ubicación");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={place ? "Editar Ubicación" : "Nueva Ubicación"}
      size="md"
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
            {place ? "Guardar Cambios" : "Crear Ubicación"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <Input
          label="Nombre"
          error={errors.name?.message}
          {...register("name", { required: "El nombre es requerido" })}
        />

        <Textarea
          label="Descripción"
          placeholder="Descripción de la ubicación..."
          rows={3}
          {...register("description")}
        />
      </form>
    </Modal>
  );
}
