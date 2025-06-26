from django.urls import path, include
from MallAPI.urls.user_urls import urlpatterns as user_urls
from MallAPI.urls.store_urls import urlpatterns as store_urls
from MallAPI.urls.customer_urls import urlpatterns as customer_urls
from MallAPI.urls.payment_urls import urlpatterns as payment_urls
from MallAPI.urls.delivery_urls import urlpatterns as delivery_urls
from MallAPI.urls.Loyalty_urls import urlpatterns as loyalty_urls
from MallAPI.urls.discount_urls import urlpatterns as discount_urls

urlpatterns = [
    path('user/', include(user_urls)),
    path('store/', include(store_urls)),
    path('customer/', include(customer_urls)),
    path('payment/', include(payment_urls)),
    path('delivery/', include(delivery_urls)),
    path('loyalty/', include(loyalty_urls)),
    path('discount/', include(discount_urls)),
]
    