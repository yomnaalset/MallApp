import { AdminNavbar } from "@/components/layout/admin-navbar";
import { AdminSidebar } from "@/components/manage/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router";

const AdminLayout = () => {

    return (<SidebarProvider>
        <div className="flex flex-col w-full">
            <AdminNavbar />
            <div className="p-8 flex h-full w-full">

                    <AdminSidebar />
                <div className="w-full">
                    <Outlet />
                </div>
            </div>
        </div>
    </SidebarProvider>);
}

export default AdminLayout;