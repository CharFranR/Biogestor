from rest_framework import serializers
from .models import Producto, Insumo, ProductoInsumo


class ProductoSerializer (serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'peso', 'tamaño', 'presentacion']


class InsumoSerializer (serializers.ModelSerializer):
    class Meta:
        model = Insumo
        fields = ['id', 'nombre', 'unidad_medida']


class ProductoInsumoSerializer(serializers.Serializer):
    producto = ProductoSerializer()
    insumos = serializers.ListField(child=serializers.DictField())

    class Meta:
        model = ProductoInsumo
        fields = ['id', 'producto', 'insumos']

    def create(self, datos_validados):
        # Extraer datos
        producto_data = datos_validados.pop("producto")
        insumos_data = datos_validados.pop("insumos", [])

        producto, created = Producto.objects.get_or_create(
            nombre=producto_data["nombre"],
            defaults={
                'peso': producto_data.get("peso", 0),
                'tamaño': producto_data.get("tamaño", ""),
                'presentacion': producto_data.get("presentacion", "")
            }
        )

        # Crear relaciones
        for item in insumos_data:
            insumo_info = item["insumo"]

            insumo, created = Insumo.objects.get_or_create(
                nombre=insumo_info["nombre"],
                defaults={
                    'unidad_medida': insumo_info.get("unidad_medida", "Unidades")
                }
            )

            ProductoInsumo.objects.create(
                producto=producto,
                insumo=insumo,
                cantidad=item.get("cantidad", 1),
                observaciones=item.get("observaciones", "")
            )

        return producto


# {
#     "producto": {
#         "nombre": "Café Premium",
#         "materia_prima": "Granos de café arábica",
#         "peso": "12.50",
#         "tamaño": "25",
#         "presentacion": "Bolsa"
#     },
#     "insumos": [
#         {
#             "insumo": {"nombre": "Azúcar", "unidad_medida": "kg"},
#             "cantidad": "5.00",
#             "observaciones": "para endulzar"
#         },
#         {
#             "insumo": {"nombre": "Leche", "unidad_medida": "L"},
#             "cantidad": "2.00",
#             "observaciones": "para sabor"
#         },
#         {
#             "insumo": {"nombre": "Canela", "unidad_medida": "g"},
#             "cantidad": "1.00",
#             "observaciones": "para aroma"
#         }
#     ]
# }
