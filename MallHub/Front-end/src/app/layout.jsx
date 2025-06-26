import { Toaster } from "@/components/ui/toaster"
import { Outlet } from "react-router";

export default function RootLayout() {
  return (
    <div
      className={`flex flex-col`}
    >
      <Toaster />
      <Outlet />
    </div>
  );
}
