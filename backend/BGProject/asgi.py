import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# Configure settings BEFORE importing any modules that access Django models/apps
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BGProject.settings')

# First initialize Django apps (calls django.setup())
django_asgi_app = get_asgi_application()

# Now it's safe to import modules that may import models
from dataSensor import routing as dataSensor_routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            dataSensor_routing.websocket_urlpatterns
        )
    ),
})