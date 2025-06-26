from django.urls import path
from MallAPI.views.store_views import (
    StoreListView, UserStoreListView, ProductCreateView, 
    StoreCreateView, CategoryView, SearchView, SectionView, 
    StoreUpdateView, StoreDeleteView, CategoryFilterView, 
    StoreProductsView, AllCategoriesView, ProductUpdateView, 
    ProductDeleteView, StoreDetailView, ProductDetailView, 
    StoresByCategoryView, StoreProductDetailView, StoresPaginatedView,
    AllSectionsView, AllProductsView, StoreManageView, StorePaginatedProductsView,
    ProductCommentListCreateView, ProductCommentDetailView,
    ProductInteractionView, ProductInteractionStatsView,
    CommentInteractionView,
    ProductRatingSubmitView,
    ProductRatingDeleteView,
    FavoriteListView,
    FavoriteAddRemoveView,
    StoreDiscountView
)

urlpatterns = [
    # Store related URLs
    path('stores/', StoreListView.as_view(), name='store_list'),
    path('stores/<int:store_id>/', StoreDetailView.as_view(), name='store-detail'),
    path('my-stores/', UserStoreListView.as_view(), name='user_store_list'),
    path('my-store/', StoreManageView.as_view(), name='my_store'),  # New endpoint for getting own store
    path('create-store/', StoreCreateView.as_view(), name='store_create'),
    path('update-store/', StoreUpdateView.as_view(), name='store_update'),
    path('delete-store/', StoreDeleteView.as_view(), name='store_delete'),
    
    # Store discount URLs
    path('my-store/discount/', StoreDiscountView.as_view(), name='store_discount'),
    
    # Product related URLs
    path('products/<int:product_id>/', ProductDetailView.as_view(), name='product_detail'),
    path('create-product/', ProductCreateView.as_view(), name='product_create'),
    path('my-store/products/', StoreProductsView.as_view(), name='store_products'),
    path('products/<int:product_id>/update/', ProductUpdateView.as_view(), name='product_update'),
    path('products/<int:product_id>/delete/', ProductDeleteView.as_view(), name='product_delete'),
    
    # Category related URLs
    path('categories/', CategoryView.as_view(), name='category_list_create'),  # GET (admin's categories) and POST
    path('categories/all/', AllCategoriesView.as_view(), name='all-categories'),  # GET (public categories)
    path('categories/<int:category_id>/', CategoryView.as_view(), name='category_detail'),  # GET single category
    path('categories/<int:category_id>/update/', CategoryView.as_view(), name='category_update'),  # PUT
    path('categories/<int:category_id>/delete/', CategoryView.as_view(), name='category_delete'),  # DELETE
    path('category-filter/', CategoryFilterView.as_view(), name='category_filter'),  # Filter stores by category
    path('categories/<int:category_id>/stores/', StoresByCategoryView.as_view(), name='stores_by_category'),
    path('stores/<int:store_id>/products/<int:product_id>/', StoreProductDetailView.as_view(), name='store_product_detail'),
    path('stores/<int:store_id>/products/paginated/', StorePaginatedProductsView.as_view(), name='store-products-paginated'),
    
    # Section related URLs
    path('sections/', SectionView.as_view(), name='section_list_create'),
    path('sections/<int:section_id>/', SectionView.as_view(), name='section_update_delete'),
    path('all-sections/', AllSectionsView.as_view(), name='all-sections'),  # New URL for paginated sections
    
    # Comment related URLs
    path('products/<int:product_id>/comments/', ProductCommentListCreateView.as_view(), name='product_comment_list_create'),
    path('products/<int:product_id>/comments/<int:comment_id>/', ProductCommentDetailView.as_view(), name='product_comment_detail'),
    path('products/<int:product_id>/comments/<int:comment_id>/interactions/', CommentInteractionView.as_view(), name='comment_interaction'),

    # Interaction related URLs
    path('products/<int:product_id>/interactions/', ProductInteractionView.as_view(), name='product_interaction'), # POST for like/dislike, DELETE for unlike/undislike
    path('products/<int:product_id>/interactions/stats/', ProductInteractionStatsView.as_view(), name='product_interaction_stats'), # GET stats

    # Product Rating related URLs
    path('products/<int:product_id>/ratings/', ProductRatingSubmitView.as_view(), name='product_rating_submit'), # POST/PUT
    path('products/<int:product_id>/ratings/delete/', ProductRatingDeleteView.as_view(), name='product_rating_delete'), # DELETE

    # Favorite related URLs
    path('favorites/', FavoriteListView.as_view(), name='favorite_list'), # GET list
    path('favorites/<int:product_id>/', FavoriteAddRemoveView.as_view(), name='favorite_add_remove'), # POST to add, DELETE to remove

    # Other URLs
    path('search/', SearchView.as_view(), name='search'),
    path('stores-paginated/', StoresPaginatedView.as_view(), name='stores_paginated'),
    path('products/all/', AllProductsView.as_view(), name='all-products'),
]
