import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROLES_ENUM } from "@/lib/constants";
import { useAuth } from "@/providers/auth-provider";
import { UserCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router";

export default function UserButton() {

    const auth = useAuth();
    const isAuthenticated = auth.isAuthenticated;
    const navigate = useNavigate();
    const logout = () => {
        navigate('/')
        auth.logout();
    }

    if (isAuthenticated)
        return (<>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="px-2">
                        <UserCircle2 size={30} /> {auth.name}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                        <Link to={"/profile"}>Profile</Link>
                    </DropdownMenuItem>
                    {[ROLES_ENUM.ADMIN, ROLES_ENUM.STORE_MANAGER].includes(auth.role) &&
                        <DropdownMenuItem DropdownMenuItem asChild>
                            <Link to={"/manage"}>Manage</Link>
                        </DropdownMenuItem>
                    }
                    {[ROLES_ENUM.DELIVERY].includes(auth.role) &&
                        <>
                            <DropdownMenuItem DropdownMenuItem asChild>
                                <Link to={"/manage/orders"}>Orders</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem DropdownMenuItem asChild>
                                <Link to={"/delivery/returns"}>Return Requests</Link>
                            </DropdownMenuItem>
                        </>
                    }
                    {[ROLES_ENUM.CUSTOMER].includes(auth.role) &&
                        <DropdownMenuItem DropdownMenuItem asChild>
                            <Link to={"/orders"}>Orders</Link>
                        </DropdownMenuItem>
                    }
                    <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu >
        </>)

    return (<>
        <span className="text-[0.7rem] text-gray-400">Welcome Guest!</span>
        <div className="flex items-center gap-1 text-xs">
            <Link to={"/auth/login"}>Login</Link>
            <span>|</span>
            <Link to={"/auth/register"}>Register</Link>
        </div>
    </>
    )
}
