from django.urls import path
from MallAPI.views.discount_views import (
    DiscountCodeListCreateView,
    DiscountCodeDetailView,
    ValidateDiscountCodeView,
    ActiveDiscountCodesView
)

urlpatterns = [
    path('discount-codes/', DiscountCodeListCreateView.as_view(), name='discount-code-list-create'),
    path('discount-codes/active/', ActiveDiscountCodesView.as_view(), name='active-discount-codes'),
    path('discount-codes/<int:pk>/', DiscountCodeDetailView.as_view(), name='discount-code-detail'),
    path('discount-codes/validate/', ValidateDiscountCodeView.as_view(), name='validate-discount-code'),
] 