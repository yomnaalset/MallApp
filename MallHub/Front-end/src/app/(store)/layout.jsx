import { Outlet } from "react-router";
import Navbar from "@/components/layout/navbar";

export default function StoreLayout() {
    return (
        < >
            <Navbar />
            <Outlet />
        </>
    );
}
