import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router";


export default function CartButton() {
    return (
        <>
            {/* <Link href={"/"} className={`${buttonVariants({ variant: 'default', size: 'icon' })} rounded-full`}>
                <ShoppingCart />
            </Link> */}
            <Button variant={"link"} size={"icon"} className="border rounded-full" asChild>
                <Link to={'/cart'}>
                    <ShoppingCart />
                </Link>
            </Button>
        </>
    )
}
