import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Heart } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { addFavorite, removeFavorite } from '@/services/product.service';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';
import AddToCartButton from './add-to-cart';
import { Badge } from "@/components/ui/badge";

export default function ProductCard({ 
    id, 
    name, 
    price, 
    image_url, 
    store_name, 
    store_logo, 
    store_diamonds, 
    is_favorited, 
    is_pre_order, 
    discounted_price,
    onFavoriteToggle 
}) {
    const { isAuthenticated, role } = useAuth();
    const [isFavoritedState, setIsFavoritedState] = useState(is_favorited);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quantity, setQuantity] = useState(0);

    const canFavorite = isAuthenticated && role === 'CUSTOMER';
    const hasDiscount = discounted_price && parseFloat(discounted_price) < parseFloat(price);

    const handleFavoriteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!canFavorite || isSubmitting) {
            if (!isAuthenticated) toast.info("Please log in to add favorites.");
            return;
        }

        setIsSubmitting(true);
        const previousState = isFavoritedState;
        setIsFavoritedState(!previousState);

        try {
            if (previousState) {
                await removeFavorite(id);
                toast.success("Removed from favorites!");
            } else {
                await addFavorite(id);
                toast.success("Added to favorites!");
            }
            if (onFavoriteToggle) {
                onFavoriteToggle(id, !previousState);
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
            toast.error("Failed to update favorites.");
            setIsFavoritedState(previousState);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCartUpdate = (newQuantity) => {
        setQuantity(newQuantity);
    };

    const diamondCount = store_diamonds?.length ? store_diamonds.reduce((sum, diamond) => sum + diamond.quantity, 0) : 0;

    return (
        <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow relative group">
            {/* Status badges positioned right below the image */}
            <div className="absolute top-10 right-0 z-10 flex flex-col gap-1">
                {hasDiscount && (
                    <Badge className="bg-red-500 text-white hover:bg-red-600 px-2 rounded-l-md rounded-r-none">
                        SALE
                    </Badge>
                )}
                {is_pre_order && (
                    <Badge className="bg-blue-500 text-white hover:bg-blue-600 px-2 rounded-l-md rounded-r-none">
                        PRE-ORDER
                    </Badge>
                )}
            </div>
            
            {canFavorite && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFavoriteClick}
                    disabled={isSubmitting}
                    className={cn(
                        "absolute top-2 right-2 z-10 h-8 w-8 p-1 rounded-full bg-background/70 hover:bg-background",
                        isFavoritedState ? "text-red-500" : "text-muted-foreground"
                    )}
                    aria-label={isFavoritedState ? "Remove from favorites" : "Add to favorites"}
                >
                    <Heart className={cn("h-5 w-5", isFavoritedState && "fill-current")} />
                </Button>
            )}

            <Link to={`/products/${id}`} className="block">
                <CardHeader className="p-0">
                    <div className="flex items-center justify-between px-4 pt-3 pb-1 pr-10">
                        <div className='flex items-center gap-2'>
                            {store_logo && <img src={store_logo} alt={`${store_name} logo`} className="h-6 w-6 object-contain rounded-full" />}
                            <span className="text-xs font-medium text-muted-foreground">{store_name || 'Store'}</span>
                        </div>
                        {diamondCount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-blue-500">
                                <span role="img" aria-label="diamond">💎</span>
                                {diamondCount}
                            </div>
                        )}
                    </div>
                    
                    <img src={image_url || '/items/placeholder.png'} alt={name} className="w-full h-48 object-contain group-hover:opacity-90 transition-opacity" />
                </CardHeader>
                <CardContent className="p-4 pt-2 grid gap-1">
                    <h3 className="font-semibold text-md mb-1 truncate group-hover:text-primary">{name}</h3>
                    <div className="flex flex-col mb-2">
                        {discounted_price ? (
                            <div className="flex items-center gap-2">
                                <p className="text-sm line-through text-muted-foreground">${parseFloat(price).toFixed(2)}</p>
                                <p className="text-sm font-medium text-green-600">${parseFloat(discounted_price).toFixed(2)}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">${parseFloat(price).toFixed(2)}</p>
                        )}
                    </div>
                    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        <AddToCartButton id={id} qty={quantity} onChange={handleCartUpdate} is_pre_order={is_pre_order} />
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}

