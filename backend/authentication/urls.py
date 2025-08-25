from django.urls import path
from .views import health_check, login, register, logout, user_profile

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('auth/login/', login, name='login'),
    path('auth/register/', register, name='register'),
    path('auth/logout/', logout, name='logout'),
    path('auth/profile/', user_profile, name='user-profile'),
]