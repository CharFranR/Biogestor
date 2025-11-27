from django.shortcuts import get_object_or_404, render
from django.http import FileResponse, HttpResponse
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from usuarios.permisos import PuedeVerCalibraciones
from usuarios.permisos import PuedeVerDashboard
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.decorators import api_view
from django.core.files.base import ContentFile
from .models import FillingStage, SensorReading, Report, ActuatorCommand, Alert, CalibrationRecord, PracticeSession
from .serializers import FillingStageSerializer, ReportSerializer, ActuatorCommandSerializer, AlertSerializer, CalibrationRecordSerializer, PracticeSessionSerializer
from datetime import datetime, timedelta
from django.utils import timezone
import pandas as pd
import io
import os
try:
    from reportlab.pdfgen import canvas
    # Estilos bonitos con Platypus
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import cm
except ImportError:
    canvas = None

class CreateFillingAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"detail": "Endpoint de llenados activo."}, status=status.HTTP_200_OK)

    def post(self, request):
        # Permitir valores por defecto mínimos para mejorar UX del frontend
        data = request.data.copy()
        # Si no se envía el número de llenado o es inválido, usar el siguiente correlativo
        try:
            num = int(data.get('number')) if data.get('number') not in [None, "", []] else None
        except Exception:
            num = None
        if not num or num <= 0:
            last = FillingStage.objects.order_by('-number').first()
            data['number'] = (last.number + 1) if last and last.number is not None else 1

        # Si no se especifican personas, registrar un marcador por defecto
        if not data.get('people'):
            data['people'] = 'Sin especificar'

        # Si no se envía fecha, usar la actual (solo fecha)
        if not data.get('date'):
            from datetime import datetime
            data['date'] = datetime.now().date().isoformat()

        serializer = FillingStageSerializer(data=data)
        if serializer.is_valid():
            filling = serializer.save()
            return Response({"id": filling.id, "detail": "Llenado registrado correctamente."}, status=status.HTTP_201_CREATED)
        return Response({"detail": "Datos inválidos", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class ListFillingsAPIView(APIView):
    """Lista las etapas (llenados), por defecto las últimas 20 y la activa primero."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = FillingStage.objects.all().order_by('-active', '-created_at')[:50]
        data = FillingStageSerializer(qs, many=True).data
        return Response({"results": data, "count": qs.count()})

class CloseCurrentFillingAPIView(APIView):
    """Cierra la etapa activa (si existe)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        stage = FillingStage.objects.filter(active=True).order_by('-created_at').first()
        if stage is None:
            return Response({"detail": "No hay etapa activa para cerrar."}, status=status.HTTP_404_NOT_FOUND)
        stage.active = False
        stage.save()
        return Response({"detail": f"Etapa #{stage.number} cerrada.", "stage_id": stage.id})

# Utilidad: construir PDF con mejor estética usando ReportLab Platypus
def build_pretty_report_pdf(*, stage, report_type_label: str, production_estimated: float, production_real: float, inferences_text: str, observations_text: str) -> bytes:
    if not canvas:
        # Si no hay reportlab, no podemos construir PDF bonito
        return b""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2*cm,
        rightMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
        title="Reporte Biogestor ULSA"
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='TitleCenter', parent=styles['Title'], alignment=1, textColor=colors.HexColor('#1b5e20')))
    styles.add(ParagraphStyle(name='SectionHeader', parent=styles['Heading4'], textColor=colors.HexColor('#2e7d32')))
    styles.add(ParagraphStyle(name='Meta', parent=styles['Normal'], textColor=colors.HexColor('#424242')))
    story = []

    # Título
    story.append(Paragraph('Sistema Biogestor ULSA', styles['TitleCenter']))
    story.append(Paragraph(report_type_label, styles['Meta']))
    story.append(Spacer(1, 12))

    # Tabla de resumen
    resumen_data = [
        ['Etapa', f"#{stage.number}"],
        ['Material', stage.material_type],
        ['Cantidad (kg)', f"{stage.material_amount_kg}"],
        ['Temperatura (°C)', f"{stage.temperature_c}"],
        ['Producción estimada (m3)', f"{production_estimated:.2f}"],
        ['Producción real (m3)', f"{production_real:.2f}"],
    ]
    tbl = Table(resumen_data, colWidths=[6*cm, 9*cm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f1f8e9')),
        ('TEXTCOLOR', (0,0), (0,-1), colors.HexColor('#2e7d32')),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#c8e6c9')),
        ('INNERGRID', (0,0), (-1,-1), 0.25, colors.HexColor('#c8e6c9')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 16))

    # Inferencias
    story.append(Paragraph('Inferencias', styles['SectionHeader']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(inferences_text or '-', styles['Normal']))
    story.append(Spacer(1, 14))

    # Comentarios
    story.append(Paragraph('Comentarios', styles['SectionHeader']))
    story.append(Spacer(1, 6))
    story.append(Paragraph(observations_text or '-', styles['Normal']))
    story.append(Spacer(1, 14))

    # Pie de página simple (fecha)
    ts = datetime.now().strftime('%Y-%m-%d %H:%M')
    story.append(Paragraph(f"Generado: {ts}", styles['Meta']))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
# Endpoint para descargar archivos de reportes
def download_report_file(request, report_id, filetype):
    report = get_object_or_404(Report, id=report_id)
    file_field = None
    content_type = 'application/octet-stream'
    if filetype == 'pdf':
        file_field = report.file_pdf
        content_type = 'application/pdf'
    elif filetype == 'excel':
        file_field = report.file_excel
        content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    elif filetype == 'csv':
        file_field = report.file_csv
        content_type = 'text/csv'
    if not file_field:
        return Response({'detail': 'Archivo no disponible.'}, status=404)
    inline = str(request.GET.get('inline', '')).lower() in ('1', 'true', 'yes')
    response = FileResponse(
        file_field.open(),
        content_type=content_type,
        as_attachment=not inline,
        filename=file_field.name.split('/')[-1]
    )
    return response

from django.shortcuts import render
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.decorators import api_view
from django.http import HttpResponse
from django.core.files.base import ContentFile
from .models import FillingStage, SensorReading, Report
from datetime import datetime, timedelta
import pandas as pd
import io
try:
    from reportlab.pdfgen import canvas
except ImportError:
    canvas = None

# Nuevo endpoint: historial de reportes
from .serializers import ReportSerializer

class ReportHistoryAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        reports = Report.objects.all().order_by('-created_at')
        serializer = ReportSerializer(reports, many=True)
        return Response({'history': serializer.data})

class StatsAPIView(APIView):
    """Devuelve métricas reales para el dashboard.

    - etapas_activas: número de etapas (llenados) activas
    - reportes_generados: total de reportes en el sistema
    - lecturas_hoy: total de lecturas de sensores registradas hoy (informativo)
    """
    permission_classes = [IsAuthenticated, PuedeVerDashboard]

    def get(self, request):
        today = timezone.now().date()
        etapas_activas = FillingStage.objects.filter(active=True).count()
        reportes_generados = Report.objects.count()
        lecturas_hoy = SensorReading.objects.filter(timestamp__date=today).count()
        return Response({
            "etapas_activas": etapas_activas,
            "reportes_generados": reportes_generados,
            "lecturas_hoy": lecturas_hoy,
        })

class PredictEfficiencyAPIView(APIView):
    """Predicción simple de eficiencia basada en series esperada vs. real.
    Retorna A (potencial), eficiencia acumulada (real/estimado) y series recortadas.
    """
    permission_classes = [IsAuthenticated, PuedeVerDashboard]

    def get(self, request):
        stage = FillingStage.objects.filter(active=True).order_by('-created_at').first()
        if not stage:
            return Response({"detail": "No hay etapa activa"}, status=404)

        prod = CurrentProductionAPIView().get(request).data  # reusar cálculo
        expected_cum = prod.get('expected', {}).get('cumulative_biogas_m3', []) or []
        actual_cum = prod.get('actual', {}).get('cumulative_biogas_m3', []) or []
        if not expected_cum:
            return Response({"detail": "Serie esperada vacía"}, status=400)
        # Eficiencia como razón del último valor disponible
        eff = 0.0
        try:
            eff = float(actual_cum[-1]) / float(expected_cum[min(len(expected_cum)-1, len(actual_cum)-1)]) if actual_cum else 0.0
        except Exception:
            eff = 0.0
        return Response({
            "efficiency_ratio": eff,
            "stage": stage.id,
            "expected_cumulative": expected_cum,
            "actual_cumulative": actual_cum,
        })

class CurrentProductionAPIView(APIView):
    permission_classes = [IsAuthenticated, PuedeVerDashboard]

    def get(self, request):
        stage = FillingStage.objects.filter(active=True).order_by('-created_at').first()
        if stage is None:
            return Response({"detail": "No hay etapa activa"}, status=status.HTTP_404_NOT_FOUND)

        series = estimate_timeseries_for_material(
            material_type=stage.material_type,
            vs_kg_per_day=stage.material_amount_kg,
            reactor_volume_m3=None,
            temperature_c=stage.temperature_c,
        )

        start_time = stage.created_at
        end_time = datetime.now()
        readings = SensorReading.objects.filter(stage=stage, timestamp__gte=start_time, timestamp__lte=end_time).order_by('timestamp')

        daily_map = {}
        last_total_gas = None
        last_ts = None

        for r in readings:
            ts = r.timestamp
            payload = r.raw_payload or {}
            delta = 0.0

            if isinstance(payload, dict) and 'gas_total_m3' in payload:
                try:
                    total = float(payload.get('gas_total_m3') or 0.0)
                    if last_total_gas is not None:
                        delta = max(0.0, total - last_total_gas)
                    last_total_gas = total
                except Exception:
                    pass
            elif isinstance(payload, dict) and ('caudal_gas' in payload or 'caudal_gas_lmin' in payload or 'gas_flow_lmin' in payload):
                try:
                    if 'caudal_gas' in payload:
                        rate = float(payload.get('caudal_gas') or 0.0)  # m3/h
                    else:
                        lmin = float(payload.get('caudal_gas_lmin') or payload.get('gas_flow_lmin') or 0.0)
                        rate = lmin * 0.06  # L/min -> m3/h
                    if last_ts is not None:
                        dt_hours = max(0.0, (ts - last_ts).total_seconds() / 3600.0)
                        delta = max(0.0, rate * dt_hours)
                except Exception:
                    pass
            elif r.gas_flow is not None:
                try:
                    delta = max(0.0, float(r.gas_flow))
                except Exception:
                    pass

            last_ts = ts
            day_key = ts.date().isoformat()
            if delta > 0:
                daily_map[day_key] = daily_map.get(day_key, 0.0) + delta

        days_actual = []
        daily_actual = []
        cumulative_actual = []
        cum = 0.0
        day_cursor = start_time.date()
        today = datetime.now().date()
        while day_cursor <= today:
            key = day_cursor.isoformat()
            val = daily_map.get(key, 0.0)
            days_since_start = (day_cursor - start_time.date()).days
            days_actual.append(float(days_since_start))
            daily_actual.append(val)
            cum += val
            cumulative_actual.append(cum)
            day_cursor = day_cursor + timedelta(days=1)

        return Response({
            "stage": {
                "id": stage.id,
                "number": stage.number,
                "date": stage.date.isoformat(),
                "material_type": stage.material_type,
                "material_amount_kg": stage.material_amount_kg,
                "temperature_c": stage.temperature_c,
            },
            "expected": series,
            "actual": {
                "days": days_actual,
                "daily_biogas_m3": daily_actual,
                "cumulative_biogas_m3": cumulative_actual,
            }
        })
class CurrentReportAPIView(APIView):
    permission_classes = [IsAuthenticated, PuedeVerDashboard]
    parser_classes = [FormParser, MultiPartParser]

    def get(self, request, format=None):
        """
        Returns current vs expected production report as PDF or Excel.
        Query params: format=pdf|excel
        """
        stage = FillingStage.objects.filter(active=True).order_by('-created_at').first()
        if stage is None:
            return Response({"detail": "No hay etapa activa"}, status=status.HTTP_404_NOT_FOUND)

        # Get expected and actual series (reuse logic from CurrentProductionAPIView)
        series = estimate_timeseries_for_material(
            material_type=stage.material_type,
            vs_kg_per_day=stage.material_amount_kg,
            reactor_volume_m3=None,
            temperature_c=stage.temperature_c,
        )
        start_time = stage.created_at
        end_time = datetime.now()
        readings = SensorReading.objects.filter(stage=stage, timestamp__gte=start_time, timestamp__lte=end_time).order_by('timestamp')
        daily_map = {}
        last_total_gas = None
        last_ts = None
        for r in readings:
            ts = r.timestamp
            payload = r.raw_payload or {}
            delta = 0.0
            if isinstance(payload, dict) and 'gas_total_m3' in payload:
                try:
                    total = float(payload.get('gas_total_m3') or 0.0)
                    if last_total_gas is not None:
                        delta = max(0.0, total - last_total_gas)
                    last_total_gas = total
                except Exception:
                    pass
            elif isinstance(payload, dict) and ('caudal_gas' in payload or 'caudal_gas_lmin' in payload or 'gas_flow_lmin' in payload):
                try:
                    if 'caudal_gas' in payload:
                        rate = float(payload.get('caudal_gas') or 0.0)
                    else:
                        lmin = float(payload.get('caudal_gas_lmin') or payload.get('gas_flow_lmin') or 0.0)
                        rate = lmin * 0.06
                    if last_ts is not None:
                        dt_hours = max(0.0, (ts - last_ts).total_seconds() / 3600.0)
                        delta = max(0.0, rate * dt_hours)
                except Exception:
                    pass
            elif r.gas_flow is not None:
                try:
                    delta = max(0.0, float(r.gas_flow))
                except Exception:
                    pass
            last_ts = ts
            day_key = ts.date().isoformat()
            if delta > 0:
                daily_map[day_key] = daily_map.get(day_key, 0.0) + delta
        days_actual = []
        daily_actual = []
        cumulative_actual = []
        cum = 0.0
        day_cursor = start_time.date()
        today = datetime.now().date()
        while day_cursor <= today:
            key = day_cursor.isoformat()
            val = daily_map.get(key, 0.0)
            days_since_start = (day_cursor - start_time.date()).days
            days_actual.append(float(days_since_start))
            daily_actual.append(val)
            cum += val
            cumulative_actual.append(cum)
            day_cursor = day_cursor + timedelta(days=1)

        # Prepare DataFrame for report
        df = pd.DataFrame({
            'Día': days_actual,
            'Fecha': pd.date_range(start=start_time.date(), periods=len(days_actual)),
            'Producción Esperada (m3)': series.get('daily_biogas_m3', [0]*len(days_actual)),
            'Producción Real (m3)': daily_actual,
            'Acumulado Real (m3)': cumulative_actual,
        })

        report_format = request.query_params.get('format', 'pdf').lower()
        if report_format == 'excel':
            output = io.BytesIO()
            # Usar engine por defecto de pandas (openpyxl normalmente)
            with pd.ExcelWriter(output) as writer:
                df.to_excel(writer, index=False, sheet_name='Reporte')
            output.seek(0)
            response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename="reporte_actual_vs_esperado.xlsx"'
            return response
        elif report_format == 'pdf' and canvas:
            output = io.BytesIO()
            c = canvas.Canvas(output)
            c.setFont("Helvetica", 14)
            c.drawString(50, 800, f"Reporte de Producción Actual vs Esperada - Llenado #{stage.number}")
            c.setFont("Helvetica", 10)
            y = 780
            for i, row in df.iterrows():
                c.drawString(50, y, f"Día {int(row['Día'])} | Fecha: {row['Fecha'].date()} | Esperada: {row['Producción Esperada (m3)']:.2f} | Real: {row['Producción Real (m3)']:.2f} | Acumulado: {row['Acumulado Real (m3)']:.2f}")
                y -= 16
                if y < 50:
                    c.showPage()
                    y = 800
            c.save()
            output.seek(0)
            response = HttpResponse(output.read(), content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="reporte_actual_vs_esperado.pdf"'
            return response
        else:
            return Response({"detail": "Formato de reporte no soportado o PDF no disponible."}, status=status.HTTP_400_BAD_REQUEST)


from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated

class CreateReportAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        stage_id = data.get('stage_id')
        report_type = data.get('report_type', 'normal')
        try:
            # 1) Resolver etapa
            if stage_id:
                stage = FillingStage.objects.get(id=stage_id)
            else:
                stage = FillingStage.objects.filter(active=True).order_by('-created_at').first()
                if not stage:
                    return Response({"detail": "No hay etapa activa para asociar el reporte."}, status=status.HTTP_400_BAD_REQUEST)

            # 2) Calcular series esperada y real (reutilizando lógica de CurrentProductionAPIView)
            series = estimate_timeseries_for_material(
                material_type=stage.material_type,
                vs_kg_per_day=stage.material_amount_kg,
                reactor_volume_m3=None,
                temperature_c=stage.temperature_c,
            )

            start_time = stage.created_at
            end_time = datetime.now()
            readings = SensorReading.objects.filter(stage=stage, timestamp__gte=start_time, timestamp__lte=end_time).order_by('timestamp')

            daily_map = {}
            last_total_gas = None
            last_ts = None
            for r in readings:
                ts = r.timestamp
                payload = r.raw_payload or {}
                delta = 0.0
                if isinstance(payload, dict) and 'gas_total_m3' in payload:
                    try:
                        total = float(payload.get('gas_total_m3') or 0.0)
                        if last_total_gas is not None:
                            delta = max(0.0, total - last_total_gas)
                        last_total_gas = total
                    except Exception:
                        pass
                elif isinstance(payload, dict) and ('caudal_gas' in payload or 'caudal_gas_lmin' in payload or 'gas_flow_lmin' in payload):
                    try:
                        if 'caudal_gas' in payload:
                            rate = float(payload.get('caudal_gas') or 0.0)
                        else:
                            lmin = float(payload.get('caudal_gas_lmin') or payload.get('gas_flow_lmin') or 0.0)
                            rate = lmin * 0.06
                        if last_ts is not None:
                            dt_hours = max(0.0, (ts - last_ts).total_seconds() / 3600.0)
                            delta = max(0.0, rate * dt_hours)
                    except Exception:
                        pass
                elif r.gas_flow is not None:
                    try:
                        delta = max(0.0, float(r.gas_flow))
                    except Exception:
                        pass

                last_ts = ts
                if delta > 0:
                    key = ts.date().isoformat()
                    daily_map[key] = daily_map.get(key, 0.0) + delta

            # Proyección a vectores
            days_actual = []
            daily_actual = []
            cumulative_actual = []
            cum = 0.0
            day_cursor = start_time.date()
            today = datetime.now().date()
            while day_cursor <= today:
                key = day_cursor.isoformat()
                val = daily_map.get(key, 0.0)
                days_since_start = (day_cursor - start_time.date()).days
                days_actual.append(float(days_since_start))
                daily_actual.append(val)
                cum += val
                cumulative_actual.append(cum)
                day_cursor = day_cursor + timedelta(days=1)

            # 3) Producciones estimada y real
            import pandas as pd
            expected_daily = series.get('daily_biogas_m3', [0.0] * len(days_actual))
            # Igualar longitudes por seguridad
            if len(expected_daily) < len(days_actual):
                expected_daily = expected_daily + [0.0] * (len(days_actual) - len(expected_daily))
            elif len(expected_daily) > len(days_actual):
                expected_daily = expected_daily[:len(days_actual)]

            production_estimated = float(pd.Series(expected_daily).sum()) if len(expected_daily) else 0.0
            production_real = float(pd.Series(daily_actual).sum()) if len(daily_actual) else 0.0

            # 4) Inferencias en base a datos (simple comparativa %)
            diff = production_real - production_estimated
            perc = (diff / production_estimated * 100.0) if production_estimated > 0 else 0.0
            trend = "por encima" if diff > 0 else ("por debajo" if diff < 0 else "igual a")
            inferences_text = data.get('inferences') or (
                f"La producción real ({production_real:.2f} m3) está {trend} de la estimada ({production_estimated:.2f} m3) en {abs(perc):.1f}%."
            )

            observations_text = data.get('observations', '')

            # 5) Crear el objeto Report
            report = Report.objects.create(
                user=request.user if request.user.is_authenticated else None,
                stage=stage,
                report_type=report_type,
                observations=observations_text,
                inferences=inferences_text,
                production_estimated=production_estimated,
                production_real=production_real,
            )

            # 6) Construir DataFrame formal con series para Excel
            df = pd.DataFrame({
                'Día': days_actual,
                'Fecha': pd.date_range(start=start_time.date(), periods=len(days_actual)) if days_actual else pd.Series([], dtype='datetime64[ns]'),
                'Producción Esperada (m3/día)': expected_daily,
                'Producción Real (m3/día)': daily_actual,
                'Acumulado Real (m3)': cumulative_actual,
            })
            df['Acumulado Esperado (m3)'] = pd.Series(expected_daily).cumsum() if len(expected_daily) else 0.0

            # 7) Generar Excel con portada y hoja de datos
            excel_buffer = io.BytesIO()
            # Usar engine por defecto de pandas; reduce dependencias
            with pd.ExcelWriter(excel_buffer) as writer:
                # Hoja Portada
                cover = pd.DataFrame({
                    'Campo': ['Sistema', 'Tipo de reporte', 'Etapa', 'Material', 'Cantidad (kg)', 'Temperatura (°C)', 'Producción estimada (m3)', 'Producción real (m3)', 'Inferencias', 'Comentarios'],
                    'Valor': [
                        'Sistema Biogestor ULSA',
                        'Reporte regular' if report_type == 'normal' else 'Reporte final de producción',
                        f"#{stage.number}",
                        stage.material_type,
                        stage.material_amount_kg,
                        stage.temperature_c,
                        round(production_estimated, 2),
                        round(production_real, 2),
                        inferences_text,
                        observations_text,
                    ]
                })
                cover.to_excel(writer, index=False, sheet_name='Resumen')

                # Hoja Datos
                df.to_excel(writer, index=False, sheet_name='Datos')

            excel_buffer.seek(0)
            report.file_excel.save(f"reporte_{report.id}.xlsx", ContentFile(excel_buffer.read()))

            # 8) CSV de datos crudos
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            report.file_csv.save(f"reporte_{report.id}.csv", ContentFile(csv_buffer.getvalue().encode('utf-8')))

            # 9) PDF con mejor estética
            if canvas:
                report_type_label = 'Reporte regular' if report_type == 'normal' else 'Reporte final de producción'
                pdf_bytes = build_pretty_report_pdf(
                    stage=stage,
                    report_type_label=report_type_label,
                    production_estimated=production_estimated,
                    production_real=production_real,
                    inferences_text=inferences_text,
                    observations_text=observations_text,
                )
                if pdf_bytes:
                    report.file_pdf.save(f"reporte_{report.id}.pdf", ContentFile(pdf_bytes))

            # 10) Si es final, cerrar etapa sólo si se solicitó
            if report_type == 'final':
                stage.active = False
                stage.save()

            report.save()

            pdf_url = f"/api/dashboard/report/download/{report.id}/pdf/" if report.file_pdf else None
            excel_url = f"/api/dashboard/report/download/{report.id}/excel/" if report.file_excel else None
            csv_url = f"/api/dashboard/report/download/{report.id}/csv/" if report.file_csv else None

            return Response({
                "id": report.id,
                "stage_active": stage.active,
                "pdf_url": pdf_url,
                "excel_url": excel_url,
                "csv_url": csv_url,
                "detail": "Reporte generado correctamente."
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": f"Error creando reporte: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        # If execution continues (shouldn't normally), provide production timeseries as fallback
        series = estimate_timeseries_for_material(
            material_type=stage.material_type,
            vs_kg_per_day=stage.material_amount_kg,
            reactor_volume_m3=None,
            temperature_c=stage.temperature_c,
        )

        start_time = stage.created_at
        end_time = datetime.now()
        readings = SensorReading.objects.filter(stage=stage, timestamp__gte=start_time, timestamp__lte=end_time).order_by('timestamp')

        daily_map = {}
        last_total_gas = None
        last_ts = None

        for r in readings:
            ts = r.timestamp
            payload = r.raw_payload or {}
            delta = 0.0

            # Preferencia 1: acumulado total reportado por sensor
            if isinstance(payload, dict) and 'gas_total_m3' in payload:
                try:
                    total = float(payload.get('gas_total_m3') or 0.0)
                    if last_total_gas is not None:
                        delta = max(0.0, total - last_total_gas)
                    last_total_gas = total
                except Exception:
                    pass
            # Preferencia 2: caudal (m3/h) a integrar por dt
            elif isinstance(payload, dict) and ('caudal_gas' in payload or 'caudal_gas_lmin' in payload or 'gas_flow_lmin' in payload):
                try:
                    if 'caudal_gas' in payload:
                        rate = float(payload.get('caudal_gas') or 0.0)  # m3/h
                    else:
                        # Convertir L/min a m3/h: (L/min) * (1 m3/1000 L) * 60 min/h = L/min * 0.06
                        lmin = float(payload.get('caudal_gas_lmin') or payload.get('gas_flow_lmin') or 0.0)
                        rate = lmin * 0.06
                    if last_ts is not None:
                        dt_hours = max(0.0, (ts - last_ts).total_seconds() / 3600.0)
                        delta = max(0.0, rate * dt_hours)
                except Exception:
                    pass
            # Preferencia 3: tratar gas_flow del modelo como incremento directo
            elif r.gas_flow is not None:
                try:
                    delta = max(0.0, float(r.gas_flow))
                except Exception:
                    pass

            last_ts = ts

            day_key = ts.date().isoformat()
            if delta > 0:
                daily_map[day_key] = daily_map.get(day_key, 0.0) + delta

        # Proyectar a vector desde inicio
        days_actual = []
        daily_actual = []
        cumulative_actual = []
        cum = 0.0
        day_cursor = start_time.date()
        today = datetime.now().date()
        while day_cursor <= today:
            key = day_cursor.isoformat()
            val = daily_map.get(key, 0.0)
            days_since_start = (day_cursor - start_time.date()).days
            days_actual.append(float(days_since_start))
            daily_actual.append(val)
            cum += val
            cumulative_actual.append(cum)
            day_cursor = day_cursor + timedelta(days=1)

        return Response({
            "stage": {
                "id": stage.id,
                "number": stage.number,
                "date": stage.date.isoformat(),
                "material_type": stage.material_type,
                "material_amount_kg": stage.material_amount_kg,
                "temperature_c": stage.temperature_c,
            },
            "expected": series,
            "actual": {
                "days": days_actual,
                "daily_biogas_m3": daily_actual,
                "cumulative_biogas_m3": cumulative_actual,
            }
        })

def dashboard_view(request):
    return render(request, 'dashboard/dashboard.html')


class RegenerateReportAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, report_id: int):
        try:
            report = get_object_or_404(Report, id=report_id)
            stage = report.stage
            report_type = report.report_type

            # Recalcular series como en CreateReportAPIView
            series = estimate_timeseries_for_material(
                material_type=stage.material_type,
                vs_kg_per_day=stage.material_amount_kg,
                reactor_volume_m3=None,
                temperature_c=stage.temperature_c,
            )
            start_time = stage.created_at
            end_time = datetime.now()
            readings = SensorReading.objects.filter(stage=stage, timestamp__gte=start_time, timestamp__lte=end_time).order_by('timestamp')

            daily_map = {}
            last_total_gas = None
            last_ts = None
            for r in readings:
                ts = r.timestamp
                payload = r.raw_payload or {}
                delta = 0.0
                if isinstance(payload, dict) and 'gas_total_m3' in payload:
                    try:
                        total = float(payload.get('gas_total_m3') or 0.0)
                        if last_total_gas is not None:
                            delta = max(0.0, total - last_total_gas)
                        last_total_gas = total
                    except Exception:
                        pass
                elif isinstance(payload, dict) and ('caudal_gas' in payload or 'caudal_gas_lmin' in payload or 'gas_flow_lmin' in payload):
                    try:
                        if 'caudal_gas' in payload:
                            rate = float(payload.get('caudal_gas') or 0.0)
                        else:
                            lmin = float(payload.get('caudal_gas_lmin') or payload.get('gas_flow_lmin') or 0.0)
                            rate = lmin * 0.06
                        if last_ts is not None:
                            dt_hours = max(0.0, (ts - last_ts).total_seconds() / 3600.0)
                            delta = max(0.0, rate * dt_hours)
                    except Exception:
                        pass
                elif r.gas_flow is not None:
                    try:
                        delta = max(0.0, float(r.gas_flow))
                    except Exception:
                        pass

                last_ts = ts
                if delta > 0:
                    key = ts.date().isoformat()
                    daily_map[key] = daily_map.get(key, 0.0) + delta

            days_actual = []
            daily_actual = []
            cumulative_actual = []
            cum = 0.0
            day_cursor = start_time.date()
            today = datetime.now().date()
            while day_cursor <= today:
                key = day_cursor.isoformat()
                val = daily_map.get(key, 0.0)
                days_since_start = (day_cursor - start_time.date()).days
                days_actual.append(float(days_since_start))
                daily_actual.append(val)
                cum += val
                cumulative_actual.append(cum)
                day_cursor = day_cursor + timedelta(days=1)

            import pandas as pd
            expected_daily = series.get('daily_biogas_m3', [0.0] * len(days_actual))
            if len(expected_daily) < len(days_actual):
                expected_daily = expected_daily + [0.0] * (len(days_actual) - len(expected_daily))
            elif len(expected_daily) > len(days_actual):
                expected_daily = expected_daily[:len(days_actual)]

            production_estimated = float(pd.Series(expected_daily).sum()) if len(expected_daily) else 0.0
            production_real = float(pd.Series(daily_actual).sum()) if len(daily_actual) else 0.0

            # Si no hay inferencias u observaciones, genera de nuevo
            diff = production_real - production_estimated
            perc = (diff / production_estimated * 100.0) if production_estimated > 0 else 0.0
            trend = "por encima" if diff > 0 else ("por debajo" if diff < 0 else "igual a")
            inferences_text = report.inferences or (
                f"La producción real ({production_real:.2f} m3) está {trend} de la estimada ({production_estimated:.2f} m3) en {abs(perc):.1f}%."
            )
            observations_text = report.observations or ''

            # Actualizar campos principales
            report.production_estimated = production_estimated
            report.production_real = production_real
            report.inferences = inferences_text
            report.save()

            # DataFrame de datos
            df = pd.DataFrame({
                'Día': days_actual,
                'Fecha': pd.date_range(start=start_time.date(), periods=len(days_actual)) if days_actual else pd.Series([], dtype='datetime64[ns]'),
                'Producción Esperada (m3/día)': expected_daily,
                'Producción Real (m3/día)': daily_actual,
                'Acumulado Real (m3)': cumulative_actual,
            })
            df['Acumulado Esperado (m3)'] = pd.Series(expected_daily).cumsum() if len(expected_daily) else 0.0

            # Sobrescribir Excel
            excel_buffer = io.BytesIO()
            with pd.ExcelWriter(excel_buffer) as writer:
                cover = pd.DataFrame({
                    'Campo': ['Sistema', 'Tipo de reporte', 'Etapa', 'Material', 'Cantidad (kg)', 'Temperatura (°C)', 'Producción estimada (m3)', 'Producción real (m3)', 'Inferencias', 'Comentarios'],
                    'Valor': [
                        'Sistema Biogestor ULSA',
                        'Reporte regular' if report_type == 'normal' else 'Reporte final de producción',
                        f"#{stage.number}",
                        stage.material_type,
                        stage.material_amount_kg,
                        stage.temperature_c,
                        round(production_estimated, 2),
                        round(production_real, 2),
                        inferences_text,
                        observations_text,
                    ]
                })
                cover.to_excel(writer, index=False, sheet_name='Resumen')
                df.to_excel(writer, index=False, sheet_name='Datos')
            excel_buffer.seek(0)
            report.file_excel.save(f"reporte_{report.id}.xlsx", ContentFile(excel_buffer.read()))

            # Sobrescribir CSV
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            report.file_csv.save(f"reporte_{report.id}.csv", ContentFile(csv_buffer.getvalue().encode('utf-8')))

            # Sobrescribir PDF con mejor estética
            if canvas:
                report_type_label = 'Reporte regular' if report_type == 'normal' else 'Reporte final de producción'
                pdf_bytes = build_pretty_report_pdf(
                    stage=stage,
                    report_type_label=report_type_label,
                    production_estimated=production_estimated,
                    production_real=production_real,
                    inferences_text=inferences_text,
                    observations_text=observations_text,
                )
                if pdf_bytes:
                    report.file_pdf.save(f"reporte_{report.id}.pdf", ContentFile(pdf_bytes))

            pdf_url = f"/api/dashboard/report/download/{report.id}/pdf/" if report.file_pdf else None
            excel_url = f"/api/dashboard/report/download/{report.id}/excel/" if report.file_excel else None
            csv_url = f"/api/dashboard/report/download/{report.id}/csv/" if report.file_csv else None

            return Response({
                "id": report.id,
                "pdf_url": pdf_url,
                "excel_url": excel_url,
                "csv_url": csv_url,
                "detail": "Reporte regenerado correctamente."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"Error regenerando reporte: {e}"}, status=status.HTTP_400_BAD_REQUEST)


class ReportByRangeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Genera un reporte para un rango de fechas [start_date, end_date].
        body: { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }
        """
        try:
            start_date = request.data.get('start_date')
            end_date = request.data.get('end_date')
            if not start_date or not end_date:
                return Response({"detail": "start_date y end_date son requeridos"}, status=400)
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date) + timedelta(days=1) - timedelta(seconds=1)

            readings = SensorReading.objects.filter(timestamp__gte=start_dt, timestamp__lte=end_dt).order_by('timestamp')
            if not readings.exists():
                return Response({"detail": "No hay lecturas en el rango"}, status=404)

            # Agregar por día acumulado (usamos heurística de gas_total_m3/caudal como en otros endpoints)
            daily_map = {}
            last_total_gas = None
            last_ts = None
            for r in readings:
                ts = r.timestamp
                payload = r.raw_payload or {}
                delta = 0.0
                try:
                    if isinstance(payload, dict) and 'gas_total_m3' in payload:
                        total = float(payload.get('gas_total_m3') or 0.0)
                        if last_total_gas is not None:
                            delta = max(0.0, total - last_total_gas)
                        last_total_gas = total
                    elif isinstance(payload, dict) and ('caudal_gas' in payload or 'caudal_gas_lmin' in payload or 'gas_flow_lmin' in payload):
                        if 'caudal_gas' in payload:
                            rate = float(payload.get('caudal_gas') or 0.0)
                        else:
                            lmin = float(payload.get('caudal_gas_lmin') or payload.get('gas_flow_lmin') or 0.0)
                            rate = lmin * 0.06
                        if last_ts is not None:
                            dt_hours = max(0.0, (ts - last_ts).total_seconds() / 3600.0)
                            delta = max(0.0, rate * dt_hours)
                    elif r.gas_flow is not None:
                        delta = max(0.0, float(r.gas_flow))
                except Exception:
                    pass
                last_ts = ts
                if delta > 0:
                    day_key = ts.date().isoformat()
                    daily_map[day_key] = daily_map.get(day_key, 0.0) + delta

            # DataFrame
            df = pd.DataFrame({
                'Fecha': list(daily_map.keys()),
                'Producción Real (m3/día)': list(daily_map.values()),
            })

            # Export options
            fmt = request.query_params.get('format', 'excel')
            if fmt == 'csv':
                csv_buffer = io.StringIO()
                df.to_csv(csv_buffer, index=False)
                return HttpResponse(csv_buffer.getvalue(), content_type='text/csv', headers={
                    'Content-Disposition': 'attachment; filename="reporte_rango.csv"'
                })
            else:
                output = io.BytesIO()
                with pd.ExcelWriter(output) as writer:
                    df.to_excel(writer, index=False, sheet_name='ResumenRango')
                output.seek(0)
                return HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers={
                    'Content-Disposition': 'attachment; filename="reporte_rango.xlsx"'
                })
        except Exception as e:
            return Response({"detail": f"Error generando reporte por rango: {e}"}, status=400)


class ActuatorCommandAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Publica comando a MQTT y persiste el registro."""
        serializer = ActuatorCommandSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        cmd: ActuatorCommand = serializer.save(status='PENDING')
        # Publicar en MQTT
        try:
            import paho.mqtt.client as mqtt
            broker_host = os.getenv("MQTT_BROKER_HOST", "mosquitto")
            broker_port = int(os.getenv("MQTT_BROKER_PORT", "1883"))
            topic = os.getenv("MQTT_CONTROL_TOPIC", "control/actuators")
            payload = {
                'device': cmd.device,
                'target': cmd.target,
                'action': cmd.action,
                'value': cmd.value,
                'extra': cmd.payload,
            }
            client = mqtt.Client()
            client.connect(broker_host, broker_port, 60)
            client.loop_start()
            import json
            client.publish(topic, json.dumps(payload))
            client.loop_stop()
            cmd.status = 'SENT'
            cmd.response_message = f"Publicado en {topic}"
            cmd.save()
            return Response(ActuatorCommandSerializer(cmd).data, status=201)
        except Exception as e:
            cmd.status = 'ERROR'
            cmd.response_message = str(e)
            cmd.save()
            return Response({"detail": f"Error enviando comando: {e}"}, status=500)


class AlertsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        alerts = Alert.objects.filter(resolved=False).order_by('-created_at')[:100]
        return Response(AlertSerializer(alerts, many=True).data)

    def post(self, request):
        serializer = AlertSerializer(data=request.data)
        if serializer.is_valid():
            alert = serializer.save()
            return Response(AlertSerializer(alert).data, status=201)
        return Response(serializer.errors, status=400)


class ResolveAlertAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, alert_id: int):
        alert = Alert.objects.filter(id=alert_id).first()
        if not alert:
            return Response({"detail": "Alerta no encontrada"}, status=404)
        alert.resolved = True
        alert.save()
        return Response({"detail": "Alerta resuelta"})


class CalibrationAPIView(APIView):
    permission_classes = [IsAuthenticated, PuedeVerCalibraciones]

    def get(self, request):
        items = CalibrationRecord.objects.all().order_by('-date', '-created_at')[:500]
        return Response(CalibrationRecordSerializer(items, many=True).data)

    def post(self, request):
        serializer = CalibrationRecordSerializer(data=request.data)
        if serializer.is_valid():
            item = serializer.save()
            return Response(CalibrationRecordSerializer(item).data, status=201)
        return Response(serializer.errors, status=400)


class CalibrationExportAPIView(APIView):
    permission_classes = [IsAuthenticated, PuedeVerCalibraciones]

    def get(self, request):
        items = CalibrationRecord.objects.all().order_by('-date')
        df = pd.DataFrame([
            {
                'Sensor': i.sensor_name,
                'Fecha': i.date.isoformat(),
                'Notas': i.notes,
            } for i in items
        ])
        output = io.BytesIO()
        with pd.ExcelWriter(output) as writer:
            df.to_excel(writer, index=False, sheet_name='Calibraciones')
        output.seek(0)
        return HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers={
            'Content-Disposition': 'attachment; filename="calibraciones.xlsx"'
        })


class PracticeStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        active = PracticeSession.objects.filter(ended_at__isnull=True).order_by('-started_at').first()
        last = PracticeSession.objects.order_by('-started_at').first()
        return Response({
            'active': PracticeSessionSerializer(active).data if active else None,
            'last': PracticeSessionSerializer(last).data if last else None,
        })


class PracticeStartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        active = PracticeSession.objects.filter(ended_at__isnull=True).exists()
        if active:
            return Response({"detail": "Ya existe una práctica activa"}, status=400)
        sess = PracticeSession.objects.create(started_by=request.user if request.user.is_authenticated else None)
        return Response(PracticeSessionSerializer(sess).data, status=201)


class PracticeStopAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        sess = PracticeSession.objects.filter(ended_at__isnull=True).order_by('-started_at').first()
        if not sess:
            return Response({"detail": "No hay práctica activa"}, status=404)
        sess.ended_by = request.user if request.user.is_authenticated else None
        sess.ended_at = timezone.now()
        sess.save()

        # Construir reporte (excel/csv) para el intervalo de práctica
        start_dt = sess.started_at
        end_dt = sess.ended_at
        readings = SensorReading.objects.filter(timestamp__gte=start_dt, timestamp__lte=end_dt).order_by('timestamp')
        daily_map = {}
        last_total_gas = None
        last_ts = None
        for r in readings:
            ts = r.timestamp
            payload = r.raw_payload or {}
            delta = 0.0
            try:
                if isinstance(payload, dict) and 'gas_total_m3' in payload:
                    total = float(payload.get('gas_total_m3') or 0.0)
                    if last_total_gas is not None:
                        delta = max(0.0, total - last_total_gas)
                    last_total_gas = total
                elif isinstance(payload, dict) and ('caudal_gas' in payload or 'caudal_gas_lmin' in payload or 'gas_flow_lmin' in payload):
                    if 'caudal_gas' in payload:
                        rate = float(payload.get('caudal_gas') or 0.0)
                    else:
                        lmin = float(payload.get('caudal_gas_lmin') or payload.get('gas_flow_lmin') or 0.0)
                        rate = lmin * 0.06
                    if last_ts is not None:
                        dt_hours = max(0.0, (ts - last_ts).total_seconds() / 3600.0)
                        delta = max(0.0, rate * dt_hours)
                elif r.gas_flow is not None:
                    delta = max(0.0, float(r.gas_flow))
            except Exception:
                pass
            last_ts = ts
            if delta > 0:
                day_key = ts.date().isoformat()
                daily_map[day_key] = daily_map.get(day_key, 0.0) + delta

        df = pd.DataFrame({
            'Fecha': list(daily_map.keys()),
            'Producción Real (m3/día)': list(daily_map.values()),
        })

        fmt = request.query_params.get('format', 'excel')
        if fmt == 'csv':
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            return HttpResponse(csv_buffer.getvalue(), content_type='text/csv', headers={
                'Content-Disposition': f'attachment; filename="reporte_practica_{sess.id}.csv"'
            })
        else:
            output = io.BytesIO()
            with pd.ExcelWriter(output) as writer:
                # Portada
                cover = pd.DataFrame({
                    'Campo': ['Tipo', 'Inicio', 'Fin', 'Duración (min)'],
                    'Valor': [
                        'Reporte de práctica',
                        start_dt.astimezone(timezone.get_current_timezone()).strftime('%Y-%m-%d %H:%M'),
                        end_dt.astimezone(timezone.get_current_timezone()).strftime('%Y-%m-%d %H:%M'),
                        round((end_dt - start_dt).total_seconds() / 60.0, 1),
                    ]
                })
                cover.to_excel(writer, index=False, sheet_name='Resumen')
                df.to_excel(writer, index=False, sheet_name='Datos')
            output.seek(0)
            return HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers={
                'Content-Disposition': f'attachment; filename="reporte_practica_{sess.id}.xlsx"'
            })