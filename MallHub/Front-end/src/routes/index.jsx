import { createBrowserRouter } from "react-router-dom";
import allRoutes from "./public-routes";
// import PrivateRoutes from "./PrivateRoutes";
import NotFoundPage from "@/app/not-found";
import FavoritesPage from "@/app/(store)/favorites/page";
import { ROLES_ENUM } from "@/lib/constants";

const router = (auth) => createBrowserRouter([
    ...allRoutes(auth), // Public routes (e.g., login, signup)
    //   ...PrivateRoutes, // Private routes (e.g., dashboard, profile)
    {
        path: "/favorites",
        element: auth?.role === ROLES_ENUM.CUSTOMER ? <FavoritesPage /> : <NotFoundPage />,
    },
    { path: "*", element: <NotFoundPage /> }, // 404 page
]);

export default router;
