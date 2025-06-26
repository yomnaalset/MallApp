from django.urls import path
from MallAPI.views.cart_views import CartView, CartBillView

urlpatterns = [
    # Base cart operations
    path('', CartView.as_view(), name='cart'),  # GET (view cart), POST (add to cart), DELETE (remove/clear)
    path('bill/', CartBillView.as_view(), name='cart-bill'),  # GET (view cart bill)
]
