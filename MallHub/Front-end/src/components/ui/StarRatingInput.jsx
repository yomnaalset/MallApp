import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const StarRatingInput = ({
    count = 5,
    rating = 0,
    onRatingChange,
    size = 6, // Corresponds to h-6 w-6 in Tailwind
    color = "text-yellow-400",
    hoverColor = "text-yellow-500",
    disabled = false,
    className
}) => {
    const [hoverRating, setHoverRating] = React.useState(0);

    const handleMouseEnter = (index) => {
        if (disabled) return;
        setHoverRating(index);
    };

    const handleMouseLeave = () => {
        if (disabled) return;
        setHoverRating(0);
    };

    const handleClick = (index) => {
        if (disabled) return;
        onRatingChange(index);
    };

    const stars = Array(count).fill(0);
    const starSizeClass = `h-${size} w-${size}`;

    return (
        <div className={cn("flex items-center space-x-1", className)}>
            {stars.map((_, i) => {
                const ratingValue = i + 1;
                const isFilled = ratingValue <= (hoverRating || rating);

                return (
                    <Star
                        key={i}
                        className={cn(
                            starSizeClass,
                            isFilled ? color : "text-gray-300 dark:text-gray-600",
                            !disabled && `cursor-pointer ${hoverColor}`,
                            disabled && "cursor-not-allowed opacity-70"
                        )}
                        fill={isFilled ? "currentColor" : "none"}
                        onMouseEnter={() => handleMouseEnter(ratingValue)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleClick(ratingValue)}
                        aria-label={`Rate ${ratingValue} out of ${count}`}
                    />
                );
            })}
        </div>
    );
};

export default StarRatingInput; 