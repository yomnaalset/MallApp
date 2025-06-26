import { useAuth } from "@/providers/auth-provider";
import { RouterProvider } from "react-router-dom";
import router from "./index.jsx";

const AppRouter = () => {

    const auth = useAuth();

    const _router = router(auth);

    return (<>
        <RouterProvider router={_router} />
    </>);
}




export default AppRouter;