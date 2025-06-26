"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getFavorites, removeFavorite } from '@/services/product.service'; // Assuming service file path
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HeartOff } from 'lucide-react';
import ProductImage from '@/components/product/ProductImage'; // Reusable image component

// Simple card to display favorite product info
const FavoriteProductCard = ({ favorite, onRemove }) => {
    const { product } = favorite;

    if (!product) return null; // Should not happen if backend serializer works

    return (
        <div className="border rounded-lg p-4 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow bg-card">
            <Link to={`/products/${product.id}`} className="contents">
                <ProductImage src={product.image_url} alt={product.name} className="w-full h-40 object-contain mb-3" />
                <h3 className="font-semibold text-center text-md mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">${parseFloat(product.price).toFixed(2)}</p>
            </Link>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onRemove(product.id)}
                className="mt-auto w-full"
            >
                <HeartOff className="mr-2 h-4 w-4 text-red-500" /> Remove
            </Button>
        </div>
    );
};


export default function FavoritesPage() {
    const { isAuthenticated } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFavorites = useCallback(async () => {
        if (!isAuthenticated) {
            setError("Please log in to view your favorites.");
            setIsLoading(false);
            setFavorites([]); // Clear favorites if not logged in
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await getFavorites();
            // Assuming the response directly contains the list of favorites
            setFavorites(response.data || []);
        } catch (err) {
            console.error("Error fetching favorites:", err);
            setError("Failed to load favorites.");
            toast.error("Could not load your favorites.");
            setFavorites([]); // Clear on error
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const handleRemoveFavorite = async (productId) => {
        // Optimistic UI update (optional)
        // const previousFavorites = favorites;
        // setFavorites(prev => prev.filter(fav => fav.product.id !== productId));

        try {
            await removeFavorite(productId);
            toast.success("Removed from favorites!");
            // Refetch after successful removal to ensure consistency
            fetchFavorites();
        } catch (err) {
            console.error("Error removing favorite:", err);
            toast.error("Failed to remove favorite.");
            // Revert optimistic update if needed
            // setFavorites(previousFavorites);
        }
    };

    if (!isAuthenticated) {
         return (
             <div className="container mx-auto p-4 text-center">
                 <p className="mb-4">Please <Link to="/login" className="text-primary underline">log in</Link> to view your favorites.</p>
             </div>
         );
     }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">My Favorites</h1>

            {isLoading && <p>Loading favorites...</p>}
            {error && <p className="text-red-600">Error: {error}</p>}

            {!isLoading && !error && favorites.length === 0 && (
                <p>You haven't added any products to your favorites yet.</p>
            )}

            {!isLoading && !error && favorites.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {favorites.map((fav) => (
                        <FavoriteProductCard key={fav.id} favorite={fav} onRemove={handleRemoveFavorite} />
                    ))}
                </div>
            )}
        </div>
    );
} 