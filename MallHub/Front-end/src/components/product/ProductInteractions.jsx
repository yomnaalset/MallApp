import React, { useState, useEffect, useCallback } from 'react';
import {
    getProductInteractionStats,
    setProductInteraction,
    removeProductInteraction
} from '@/services/product.service'; // Assuming the service file path
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider'; // To check if user is logged in
import { toast } from 'react-toastify';

const ProductInteractions = ({ productId }) => {
    const { isAuthenticated, name: currentUsername } = useAuth(); // Get auth status and username
    const [stats, setStats] = useState({ likes_count: 0, dislikes_count: 0 });
    const [userInteraction, setUserInteraction] = useState(null); // 'LIKE', 'DISLIKE', or null
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchStats = useCallback(async () => {
        if (!productId) return;
        setIsLoading(true);
        try {
            const response = await getProductInteractionStats(productId);
            if (response.data.status === 'success') {
                setStats({
                    likes_count: response.data.likes_count,
                    dislikes_count: response.data.dislikes_count,
                });
                setUserInteraction(response.data.user_interaction);
            } else {
                 toast.error('Failed to load interaction stats.');
            }
        } catch (error) {
            console.error("Error fetching interaction stats:", error);
            toast.error('Error fetching interaction stats.');
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleInteraction = async (interactionType) => {
        if (!isAuthenticated) {
            toast.info('Please log in to interact.');
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            if (userInteraction === interactionType) {
                // User clicked the same button again (unlike/undislike)
                await removeProductInteraction(productId);
                toast.success('Interaction removed.');
            } else {
                // User liked/disliked or changed interaction
                await setProductInteraction(productId, interactionType);
                toast.success(`Product ${interactionType.toLowerCase()}d!`);
            }
            // Refresh stats after interaction
            await fetchStats();
        } catch (error) {
            console.error(`Error setting interaction (${interactionType}):`, error);
            const errorMsg = error.response?.data?.message || `Failed to ${interactionType.toLowerCase()} the product.`;
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center space-x-4 my-4">
            <Button
                variant={userInteraction === 'LIKE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleInteraction('LIKE')}
                disabled={isLoading || isSubmitting || !isAuthenticated}
                aria-label="Like product"
            >
                <ThumbsUp className={`mr-2 h-4 w-4 ${userInteraction === 'LIKE' ? 'text-white' : ''}`} />
                {stats.likes_count}
            </Button>
            <Button
                variant={userInteraction === 'DISLIKE' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleInteraction('DISLIKE')}
                disabled={isLoading || isSubmitting || !isAuthenticated}
                aria-label="Dislike product"
            >
                <ThumbsDown className={`mr-2 h-4 w-4 ${userInteraction === 'DISLIKE' ? 'text-white' : ''}`} />
                {stats.dislikes_count}
            </Button>
            {isLoading && <span className="text-sm text-muted-foreground">Loading...</span>}
        </div>
    );
};

export default ProductInteractions; 