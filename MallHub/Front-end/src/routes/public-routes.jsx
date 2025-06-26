/* eslint-disable react/no-children-prop */
import AdminLayout from "@/app/manage/layout";

import AuthLayout from "@/app/(auth)/layout";
import RootLayout from "@/app/layout";

import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";
import ForgotPassword from "@/components/ForgotPassword";
import ResetPassword from "@/components/ResetPassword";
import HomePage from "@/app/page";

// #region Category
import UpdateCategoryPage from "@/app/manage/categories/[id]/page";
import CreateCategoryPage from "@/app/manage/categories/create/page";
import AdminCategoriesPage from "@/app/manage/categories/page";
// #endregion

// #region Section
import UpdateSectionPage from "@/app/manage/sections/[id]/page";
import CreateSectionPage from "@/app/manage/sections/create/page";
import AdminSectionsPage from "@/app/manage/sections/page";
// #endregion 

// #region Product
import UpdateProductPage from "@/app/manage/products/[id]/page";
import CreateProductPage from "@/app/manage/products/create/page";
import AdminProductsPage from "@/app/manage/products/page";
// #endregion

// #region Store
import UpdateStorePage from "@/app/manage/store/[id]/page";
import CreateStorePage from "@/app/manage/store/create/page";
import AdminStoresPage from "@/app/manage/store/page";
// #endregion

// #region Loyalty
import LoyaltyDiamondsPage from "@/app/manage/loyalty/diamonds/page";
import LoyaltyPrizesPage from "@/app/manage/loyalty/prizes/page";
// #endregion

// #region Discount Codes
import DiscountCodesPage from "@/app/manage/discount-codes/page";
import CreateDiscountCodePage from "@/app/manage/discount-codes/create/page";
import EditDiscountCodePage from "@/app/manage/discount-codes/[id]/page";
// #endregion

// #region Delivery
import DeliveryDashboardPage from "@/app/delivery/dashboard/page";
import DeliveryReturnsPage from "@/app/delivery/returns/page";
// #endregion

import NotFoundPage from "@/app/not-found";
import { ROLES_ENUM } from "@/lib/constants";
import { Navigate, Outlet } from "react-router";
import ProductDetailsPage from "@/app/(store)/product/[id]/page";
import CartPage from "@/app/(store)/cart/page";
import OrdersPage from "@/app/(store)/orders/page";
import ManageOrdersPage from "@/app/manage/orders/page";
import ProfilePage from "@/app/profile/page";
import StoresPage from "@/app/(store)/stores/page";
import StoreProductsPage from "@/app/(store)/stores/[id]/products/page";
import StoreLayout from "@/app/(store)/layout";
import RewardsPage from "@/app/(store)/rewards/index";

const AuthRoutes = [
    {
        path: "auth",
        element: <AuthLayout />,
        children: [
            {
                path: "login",
                element: <LoginPage />,
            },
            {
                path: "register",
                element: <RegisterPage />,
            },
            {
                path: "forgot-password",
                element: <ForgotPassword />,
            },
            {
                path: "reset-password/:uidb64/:token",
                element: <ResetPassword />,
            }
        ],
    },
]

const StoreManagerRoutes = [
    {
        path: 'stores',
        children: [
            {
                index: true,
                element: <AdminStoresPage />
            },
            {
                path: "create",
                element: <CreateStorePage />,

            },
            {
                path: ":id",
                element: <UpdateStorePage />,
            }
        ]
    },
    {
        path: "products",
        children: [
            {
                index: true,
                element: <AdminProductsPage />
            },
            {
                path: "create",
                element: <CreateProductPage />,

            },
            {
                path: ":id",
                element: <UpdateProductPage />,
            }
        ]
    },
]

const AdminRoutes = [
    {
        path: "categories",
        children: [
            {
                index: true,
                element: <AdminCategoriesPage />
            },
            {
                path: "create",
                element: <CreateCategoryPage />,

            },
            {
                path: ":id",
                element: <UpdateCategoryPage />,
            }
        ]
    },
    {
        path: "sections",
        children: [
            {
                index: true,
                element: <AdminSectionsPage />
            },
            {
                path: "create",
                element: <CreateSectionPage />,

            },
            {
                path: ":id",
                element: <UpdateSectionPage />,
            }
        ]
    },
    {
        path: "discount-codes",
        children: [
            {
                index: true,
                element: <DiscountCodesPage />
            },
            {
                path: "create",
                element: <CreateDiscountCodePage />,
            },
            {
                path: ":id",
                element: <EditDiscountCodePage />,
            }
        ]
    },
    {
        path: "loyalty/diamonds",
        element: <LoyaltyDiamondsPage />
    },
    {
        path: "loyalty/prizes",
        element: <LoyaltyPrizesPage />
    }
]

const ManageRoutes = (auth) => [
    {
        path: "manage",
        element: <AdminLayout />,
        children: [
            ...(auth.role === ROLES_ENUM.STORE_MANAGER ? StoreManagerRoutes : []),
            ...(auth.role === ROLES_ENUM.ADMIN ? AdminRoutes : []),
        ]
    },
    (auth.role === ROLES_ENUM.DELIVERY ? { path: "manage/orders", element: <ManageOrdersPage /> } : {}),

]

const publicRoutes = (auth) => [
    {
        element: <StoreLayout />,
        children: [
            {
                path: "/",
                element: <HomePage />,
            },
            {
                path: "products/:id",
                element: <ProductDetailsPage />,
            },
            {
                path: "cart",
                element: auth.role === ROLES_ENUM.CUSTOMER ? <CartPage /> : <Navigate to={"/"} />,
            },
            {
                path: "orders",
                element: auth.role === ROLES_ENUM.CUSTOMER ? <OrdersPage /> : <Navigate to={"/"} />,
            },
            {
                path: "rewards",
                element: auth.role === ROLES_ENUM.CUSTOMER ? <RewardsPage /> : <Navigate to={"/"} />,
            },
            {
                path: "profile",
                element: auth.isAuthenticated ? <ProfilePage /> : <Navigate to={"/"} />,
            },
            {
                path: "stores",
                children: [
                    {
                        index: true,
                        element: <StoresPage />
                    },
                    {
                        path: ':id/products',
                        element: <StoreProductsPage />
                    }
                ]
            },
        ]
    }
]

// Add DeliveryRoutes definition
const DeliveryRoutes = (auth) => auth.role === ROLES_ENUM.DELIVERY ? [
    {
        path: "delivery",
        children: [
            {
                path: "dashboard",
                element: <DeliveryDashboardPage />
            },
            {
                path: "returns",
                element: <DeliveryReturnsPage />
            }
        ]
    }
] : [];

const allRoutes = (auth) => [
    {
        element: <RootLayout />,
        children: [

            {
                element: auth.isAuthenticated ? ManageRoutes(auth.role) : <Navigate to={"/"} />,
            },
            {
                element: !auth.isAuthenticated ? <Outlet /> : <Navigate to={"/"} />,
                children: [...AuthRoutes]
            },
            {
                element: auth.isAuthenticated ? <Outlet /> : <Navigate to={"/"} />,
                children: [...ManageRoutes(auth)]
            },
            ...publicRoutes(auth),
            ...DeliveryRoutes(auth)
        ],
    },
    {
        path: "not-found",
        element: <NotFoundPage />
    },
    {
        path: "*",
        element: <NotFoundPage />
    }
];

export default allRoutes;

