from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from MallAPI.urls.customer_urls import urlpatterns as customer_urls
from MallAPI.urls.store_urls import urlpatterns as store_urls
from MallAPI.urls.user_urls import urlpatterns as user_urls
from MallAPI.urls.cart_urls import urlpatterns as cart_urls
from MallAPI.urls.payment_urls import urlpatterns as payment_urls
from MallAPI.urls.discount_urls import urlpatterns as discount_urls
from MallAPI.views.store_views import AllCategoriesView

urlpatterns = [
    path('user/', include(user_urls)),  # Include your user URLs
    path('store/', include(store_urls)),
    path('customer/', include(customer_urls)),
    path('cart/', include(cart_urls)),
    path('payment/', include(payment_urls)),
    path('discount/', include(discount_urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

