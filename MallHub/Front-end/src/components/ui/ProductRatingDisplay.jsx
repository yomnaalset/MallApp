import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProductRatingDisplay = ({
    rating = 0,
    maxRating = 5,
    size = 5, // h-5 w-5
    color = "text-yellow-400",
    className
}) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
    const starSizeClass = `h-${size} w-${size}`;

    return (
        <div className={cn("flex items-center space-x-1", className)}>
            {rating > 0 && (
                <span className="mr-2 text-sm font-medium text-muted-foreground">
                    {rating.toFixed(1)} / {maxRating}
                </span>
            )}
            {[...Array(fullStars)].map((_, i) => (
                <Star key={`full-${i}`} className={cn(starSizeClass, color)} fill="currentColor" />
            ))}
            {[...Array(emptyStars)].map((_, i) => (
                <Star key={`empty-${i}`} className={cn(starSizeClass, "text-gray-300 dark:text-gray-600")} fill="none" />
            ))}
        </div>
    );
};

export default ProductRatingDisplay;