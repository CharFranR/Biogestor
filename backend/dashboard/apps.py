from django.apps import AppConfig


class DashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dashboard'
    
    def ready(self):
        """
        Importa signals cuando la aplicación está lista.
        
        Esto garantiza que los signals se registren correctamente
        y puedan responder a eventos del modelo.
        """
        import dashboard.signals  # noqa
