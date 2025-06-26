import React from 'react';

const ProductImage = ({ src, alt, className = 'w-full max-w-md h-auto object-cover rounded-lg shadow-md' }) => {
    // Basic image component with fallback/styling
    const handleError = (e) => {
        // Optional: Set a fallback image source if the provided src fails
        // e.target.src = '/path/to/fallback-image.png';
        console.error("Image failed to load:", src);
    };

    return (
        <img
            src={src || '/items/placeholder.png'} // Provide a default placeholder if src is null/undefined
            alt={alt || 'Product Image'}
            className={className}
            onError={handleError}
            loading="lazy" // Add lazy loading
        />
    );
};

export default ProductImage; 