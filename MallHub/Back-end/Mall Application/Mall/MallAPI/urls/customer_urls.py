from django.urls import path
from MallAPI.views.customer_views import (
    CategoryListView,
    StoresByCategoryView,
    CustomerSearchView,
    CustomerProfileView
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='customer-categories'),
    path('categories/<int:category_id>/stores/', StoresByCategoryView.as_view(), name='category-stores'),
    path('search/', CustomerSearchView.as_view(), name='customer-search'),
    path('profile/', CustomerProfileView.as_view(), name='customer-profile'),
]