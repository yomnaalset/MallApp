from django.urls import path
from MallAPI.views.user_views import (
    RegisterView, LoginView, PasswordResetRequestView, 
    PasswordResetView, UserProfileView, CustomerAccountView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/<uidb64>/<token>/', PasswordResetView.as_view(), name='password_reset_confirm'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('account/', CustomerAccountView.as_view(), name='customer_account'),
]
