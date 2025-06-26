from django.urls import path
from MallAPI.views.delivery_views import (
    DeliveryOrderView, 
    DeliveryHistoryView, 
    CustomerOrderReturnView, 
    CustomerReturnDetailView,
    DeliveryReturnOrdersView,
    AdminReturnOrdersView
)

urlpatterns = [
    # Delivery Order URLs
    path('orders/', DeliveryOrderView.as_view(), name='delivery-orders'),
    path('orders/<int:delivery_id>/status/', DeliveryOrderView.as_view(), name='update-delivery-status'),
    path('history/', DeliveryHistoryView.as_view(), name='delivery-history'),
    
    # Customer Return Order URLs
    path('customer/returns/', CustomerOrderReturnView.as_view(), name='customer-returns'),
    path('customer/returns/<int:return_id>/', CustomerReturnDetailView.as_view(), name='customer-return-detail'),
    
    # Delivery Return Order URLs
    path('returns/', DeliveryReturnOrdersView.as_view(), name='delivery-returns'),
    path('returns/<int:return_id>/status/', DeliveryReturnOrdersView.as_view(), name='update-return-status'),
    
    # Admin Return Order URLs
    path('admin/returns/', AdminReturnOrdersView.as_view(), name='admin-returns'),
    path('admin/returns/<int:return_id>/status/', AdminReturnOrdersView.as_view(), name='admin-update-return-status'),
    path('admin/returns/assign/', AdminReturnOrdersView.as_view(), name='admin-assign-returns'),
] 