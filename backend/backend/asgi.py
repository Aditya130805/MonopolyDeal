import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from backend.game import routing

print(routing.websocket_urlpatterns)

# Tells Django which settings file to use for the project. In this case, it’s referring to the settings.py file in the backend/backend directory.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')

# Defines the main application and how it should route incoming requests. distinguishes between different types of protocols and routes them to appropriate handlers.
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(  # Ensures that user authentication is properly handled for WebSocket connections
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})
