import React, { useState, useEffect } from 'react';
import StarRatingInput from '@/components/ui/StarRatingInput';
import ProductRatingDisplay from '@/components/ui/ProductRatingDisplay';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { submitOrUpdateRating, deleteRating } from '@/services/product.service';
import { toast } from 'react-toastify';
import { Trash2 } from 'lucide-react';

const ProductRatingSection = ({ productId, initialAverageRating, initialUserRating, onRatingChange }) => {
    const { isAuthenticated, role } = useAuth();
    const [userRating, setUserRating] = useState(initialUserRating || 0);
    const [averageRating, setAverageRating] = useState(initialAverageRating || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update local state if initial props change (e.g., after parent refetch)
    useEffect(() => {
        setUserRating(initialUserRating || 0);
        setAverageRating(initialAverageRating || 0);
    }, [initialUserRating, initialAverageRating]);

    const canRate = isAuthenticated && role === 'CUSTOMER';

    const handleRatingSubmit = async (newRating) => {
        if (!canRate || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const response = await submitOrUpdateRating(productId, newRating);
            if (response.data.status === 'success') {
                toast.success(response.data.message || 'Rating submitted!');
                // Trigger parent refetch
                if (onRatingChange) {
                    onRatingChange();
                }
            } else {
                toast.error(response.data.message || 'Failed to submit rating.');
            }
        } catch (error) {
            console.error("Error submitting rating:", error);
            toast.error(error.response?.data?.message || 'Error submitting rating.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRating = async () => {
        if (!canRate || !userRating || isSubmitting) return;
        if (!window.confirm("Are you sure you want to delete your rating?")) return;

        setIsSubmitting(true);
        try {
            const response = await deleteRating(productId);
            // Check status for delete (usually 204 No Content)
            if (response.status === 204) {
                toast.success("Rating deleted!");
                 // Trigger parent refetch
                if (onRatingChange) {
                    onRatingChange();
                }
            } else {
                // Handle potential errors even on non-204 success if applicable
                toast.error(response.data?.message || 'Failed to delete rating.');
            }
        } catch (error) {
            console.error("Error deleting rating:", error);
            toast.error(error.response?.data?.message || 'Error deleting rating.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-3">
            <div>
                <ProductRatingDisplay rating={averageRating} />
            </div>

            {isAuthenticated && role !== 'CUSTOMER' && (
                 <p className="text-sm text-muted-foreground">Only customers can rate products.</p>
            )}

            {!isAuthenticated && (
                 <p className="text-sm text-muted-foreground">Log in as a customer to rate this product.</p>
            )}

            {canRate && (
                <div>
                    <h4 className="text-sm font-medium mb-1">Your Rating:</h4>
                    <div className="flex items-center space-x-2">
                        <StarRatingInput
                            rating={userRating}
                            onRatingChange={handleRatingSubmit}
                            disabled={isSubmitting}
                        />
                        {userRating > 0 && (
                             <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={handleDeleteRating}
                                disabled={isSubmitting}
                                aria-label="Delete your rating"
                                className="p-1 h-auto text-red-500 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    {isSubmitting && <p className='text-xs text-muted-foreground'>Processing...</p>}
                </div>
            )}
        </div>
    );
};

export default ProductRatingSection; 