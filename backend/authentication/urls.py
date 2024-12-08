from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView, 
    UserDetailView, 
    PasswordUpdateView, 
    DeleteAccountView,
    PasswordVerifyView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user_detail'),
    path('me/password/', PasswordUpdateView.as_view(), name='password_update'),
    path('me/password/verify/', PasswordVerifyView.as_view(), name='password_verify'),
    path('me/delete/', DeleteAccountView.as_view(), name='delete_account'),
]
