import { Link, NavLink } from "react-router-dom";
// import { NAV_ITEMS } from "../../routes"; // Removed incorrect import
import { useAuth } from "@/providers/auth-provider";
import CartButton from "./cart-button";
import UserButton from "./user-button";
import { Button } from "@/components/ui/button";
import { Heart, Award } from "lucide-react";

export default function Navbar() {

    const { isAuthenticated, role } = useAuth();

    return (
        <header className="bg-background sticky top-0 z-40 border-b">
            <div className="max-container flex h-16 items-center justify-between padding">
                {/* Left Side: Logo + Nav Links */}
                <div className="flex items-center space-x-6">
                    <Link to="/">
                        <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0">
                            MallHub
                        </h2>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-4">
                        <NavLink
                            className={({ isActive }) =>
                                `text-muted-foreground ${isActive ? 'text-primary' : ''} hover:text-primary`
                            }
                            to="/"
                            end // Ensure active state only for exact match on home
                        >
                            Products
                        </NavLink>
                        <NavLink
                            className={({ isActive }) =>
                                `text-muted-foreground ${isActive ? 'text-primary' : ''} hover:text-primary`
                            }
                            to="/stores" // Assuming a /stores route exists or will be added
                        >
                            Stores
                        </NavLink>
                        {isAuthenticated && role === 'CUSTOMER' && (
                            <NavLink
                                className={({ isActive }) =>
                                    `text-muted-foreground ${isActive ? 'text-primary' : ''} hover:text-primary`
                                }
                                to="/rewards"
                            >
                                Rewards
                            </NavLink>
                        )}
                        {/* Add other main nav links here if needed */}
                    </nav>
                </div>

                {/* Right Side: Icons */}
                <div className="flex items-center space-x-2">
                    {isAuthenticated && role === 'CUSTOMER' && (
                        <>
                            <Button asChild variant="ghost" size="icon">
                                <Link to="/favorites" aria-label="View Favorites">
                                    <Heart className="h-5 w-5" />
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon">
                                <Link to="/rewards" aria-label="View Rewards">
                                    <Award className="h-5 w-5" />
                                </Link>
                            </Button>
                        </>
                    )}
                    <CartButton />
                    <UserButton />
                    {/* TODO: Add mobile menu button here? */}
                </div>
            </div>
        </header>
    )
}
