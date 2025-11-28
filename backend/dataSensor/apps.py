from django.apps import AppConfig
import os


class DatasensorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dataSensor'
    
    def ready(self):
        # No iniciar el hilo durante tests
        if os.environ.get('PYTEST_CURRENT_TEST'):
            return
        try:
            from .views import start_save_data_thread
            start_save_data_thread()
        except Exception:
            # Evitar que errores en arranque del hilo afecten el boot de Django
            pass
