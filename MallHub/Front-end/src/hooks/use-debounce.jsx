import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom useDebounce hook that accepts a callback function
 * @param {Function} callback - The function to debounce
 * @param {number} delay - The delay in milliseconds (default: 300ms)
 * @returns {Function} - The debounced function
 */
const useDebounce = (callback, delay = 300) => {
    // Ref to store the timeout ID
    const timeoutRef = useRef(null);

    // Cleanup function to clear the timeout
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Debounced function
    const debouncedCallback = useCallback(
        (...args) => {
            // Clear the previous timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Set a new timeout
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    );

    return debouncedCallback;
};

export { useDebounce };