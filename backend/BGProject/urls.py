from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection


def healthz(_request):
    """Health check básico: verifica que el proceso responde y la DB está accesible."""
    db_ok = True
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
    except Exception:
        db_ok = False
    return JsonResponse({"status": "ok", "database": db_ok})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('usuarios.urls')),
    path('api/',include('inventario.urls')),
    path('api/', include('BatchModel.urls')),
    path('api/', include('calibrations.urls')),
    path('api/', include('dataSensor.urls')),
]   

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
