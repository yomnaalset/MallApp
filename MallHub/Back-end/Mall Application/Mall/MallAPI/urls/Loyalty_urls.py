from django.urls import path
from MallAPI.views.Loyalty_views import (
    AdminDiamondView,
    AdminPrizeView,
    CustomerPointsView,
    CustomerPrizeView,
    CustomerRedemptionHistoryView,
    CheckoutPointsPreviewView,
    ApplyDiscountView,
    PointsConversionView,
    GlobalLoyaltySettingView
)

urlpatterns = [
    # Admin endpoints
    path('admin/settings/', GlobalLoyaltySettingView.as_view(), name='global-loyalty-settings'),
    path('admin/diamonds/', AdminDiamondView.as_view(), name='admin-diamonds-list'),
    path('admin/diamonds/<int:diamond_id>/', AdminDiamondView.as_view(), name='admin-diamonds-detail'),
    path('admin/prizes/', AdminPrizeView.as_view(), name='admin-prizes-list'),
    path('admin/prizes/<int:prize_id>/', AdminPrizeView.as_view(), name='admin-prizes-detail'),
    path('admin/store/<int:store_id>/prizes/', AdminPrizeView.as_view(), name='admin-store-prizes'),
    
    # Customer endpoints
    path('points/', CustomerPointsView.as_view(), name='customer-points'),
    path('prizes/', CustomerPrizeView.as_view(), name='customer-prizes'),
    path('redemptions/', CustomerRedemptionHistoryView.as_view(), name='customer-redemptions'),
    
    # New endpoints
    path('checkout/points-preview/', CheckoutPointsPreviewView.as_view(), name='checkout-points-preview'),
    path('checkout/apply-discount/', ApplyDiscountView.as_view(), name='apply-discount'),
    path('points-conversion/', PointsConversionView.as_view(), name='points-conversion'),
    path('points-conversion/<int:store_id>/', PointsConversionView.as_view(), name='store-points-conversion'),
]