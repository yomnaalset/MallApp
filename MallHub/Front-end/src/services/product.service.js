import api from './axios'; // Use the configured axios instance

const BASE_URL = '/api/store'; // Matches backend urls.py

// --- Comment Endpoints ---

export const getProductComments = (productId, page = 1, perPage = 10) => {
    return api.get(`${BASE_URL}/products/${productId}/comments/`, {
        params: { page, per_page: perPage }
    });
};

export const createProductComment = (productId, text, parentId = null) => {
    const payload = {
        product: productId,
        text: text,
    };
    if (parentId) {
        payload.parent = parentId;
    }
    return api.post(`${BASE_URL}/products/${productId}/comments/`, payload);
};

export const updateProductComment = (productId, commentId, text) => {
    return api.put(`${BASE_URL}/products/${productId}/comments/${commentId}/`, { text });
};

export const deleteProductComment = (productId, commentId) => {
    return api.delete(`${BASE_URL}/products/${productId}/comments/${commentId}/`);
};


// --- Interaction Endpoints ---

export const getProductInteractionStats = (productId) => {
    return api.get(`${BASE_URL}/products/${productId}/interactions/stats/`);
};

export const setProductInteraction = (productId, interactionType) => {
    // interactionType should be 'LIKE' or 'DISLIKE'
    return api.post(`${BASE_URL}/products/${productId}/interactions/`, { interaction_type: interactionType });
};

export const removeProductInteraction = (productId) => {
    return api.delete(`${BASE_URL}/products/${productId}/interactions/`);
};


// --- Comment Interaction Endpoints ---

export const likeComment = (productId, commentId) => {
    return api.post(`${BASE_URL}/products/${productId}/comments/${commentId}/interactions/`);
};

export const unlikeComment = (productId, commentId) => {
    return api.delete(`${BASE_URL}/products/${productId}/comments/${commentId}/interactions/`);
};


// --- Product Rating Endpoints ---

export const submitOrUpdateRating = (productId, rating) => {
    // Backend uses POST for create/update via update_or_create
    return api.post(`${BASE_URL}/products/${productId}/ratings/`, { rating });
};

export const deleteRating = (productId) => {
    return api.delete(`${BASE_URL}/products/${productId}/ratings/delete/`);
};


// --- Favorite Endpoints ---

export const getFavorites = () => {
    return api.get(`${BASE_URL}/favorites/`);
};

export const addFavorite = (productId) => {
    return api.post(`${BASE_URL}/favorites/${productId}/`);
};

export const removeFavorite = (productId) => {
    return api.delete(`${BASE_URL}/favorites/${productId}/`);
}; 