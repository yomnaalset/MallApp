import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CartService } from "@/services/cart.service";
import { Loader, Plus, Minus } from "lucide-react";
import { useState, useTransition } from "react";
import { useNavigate } from "react-router";
import { ToastAction } from "../ui/toast";

const AddToCartButton = ({ id, qty = 0, itemId, onChange, disabled, quantityLocked, is_pre_order }) => {

    const { toast } = useToast();
    const navigate = useNavigate();
    const [isPending, startTransition] = useTransition();
    const [cartItemId, setCartItemId] = useState(itemId);

    const handleAdd = async () => {
        startTransition(async () => {
            try {
                const data = await CartService.addToCart({ product_id: id, quantity: 1 });
                const _cartItemId = data?.cart?.items?.find(x => x.product.id === id)?.id;

                setCartItemId(_cartItemId)
                onChange(qty + 1);

                let action = <></>

                if (window.location.pathname !== '/cart') {
                    action = <ToastAction
                        altText="Go To Cart"
                        className="bg-primary text-white hover:bg-gray-800"
                        onClick={() => navigate('/cart')}
                    >
                        Go To Cart
                    </ToastAction>
                }

                toast({
                    description: data.message,
                    action
                });
            } catch {
                toast({
                    description: 'Something went wrong',
                    variant: 'destructive'
                });
            }
        })
    }

    const handleRemove = async () => {
        if (qty === 0) return;
        startTransition(async () => {
            try {                
                await CartService.removeFromCart(cartItemId);
                onChange(qty - 1);
            } catch {
                toast({
                    description: 'Something went wrong',
                    variant: 'destructive'
                });
            }
        })
    }

    if (qty > 0) {
        return (<div className="flex items-center gap-x-2">
            <Button
                disabled={isPending || quantityLocked}
                variant='outline'
                type='button'
                onClick={handleRemove}
            >
                {isPending ? (
                    <Loader className='w-4 h-4  animate-spin' />
                ) : (
                    <Minus className='w-4 h-4' />
                )}
            </Button>
            <span>{qty}</span>
            <Button
                disabled={isPending || quantityLocked}
                variant='outline'
                type='button'
                onClick={handleAdd}
            >
                {isPending ? (
                    <Loader className='w-4 h-4  animate-spin' />
                ) : (
                    <Plus className='w-4 h-4' />
                )}
            </Button>
        </div>)
    }

    return (<>
        <Button 
            className="w-full" 
            onClick={handleAdd} 
            disabled={disabled}
            variant={is_pre_order ? "outline" : "default"}
        >
            {isPending ? (
                <Loader className="h-4 w-4 animate-spin" /> 
            ) : (
                <>
                    <Plus className="h-4 w-4 mr-1" />
                    {is_pre_order ? 'Pre-order Now' : 'Add To Cart'}
                </>
            )}
        </Button>
    </>);
}

export default AddToCartButton;