import { ROLES_ENUM } from "@/lib/constants";
import { useAuth } from "@/providers/auth-provider";
import { Navigate, Outlet } from "react-router";

const StoreManagerLayout = () => {

    const { role } = useAuth();

    if (role !== ROLES_ENUM.STORE_MANAGER)
        return <Navigate to={"*"} />

    return (<Outlet />);
}

export default StoreManagerLayout;