from django.urls import path
from MallAPI.views.payment_views import PaymentProcessView, OrderStatusView, PaymentPreviewView

urlpatterns = [
    path('process/', PaymentProcessView.as_view(), name='process-payment'),
    path('order-status/', OrderStatusView.as_view(), name='order-status'),
    path('preview/', PaymentPreviewView.as_view(), name='payment-preview'),
]
