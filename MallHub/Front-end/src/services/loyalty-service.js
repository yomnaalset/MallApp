import axios from "./axios";

const loyaltyService = {
    // Customer-facing endpoints
    getPointsBalance: async () => {
        try {
            console.log("Calling getPointsBalance API");
            const response = await axios.get('/api/loyalty/points/');
            console.log("Raw API response:", response);
            console.log("Data received from API:", response.data);

            return response;
        } catch (error) {
            console.error("Error in getPointsBalance:", error);
            return { data: null };
        }
    },
    
    getPointsHistory: async () => {
        return await axios.get('/api/loyalty/redemptions/');
    },
    
    getAvailablePrizes: async () => {
        return await axios.get('/api/loyalty/prizes/');
    },
    
    redeemPrize: async (prizeId) => {
        return await axios.post(`/api/loyalty/prizes/`, {
            prize_id: prizeId
        });
    },
    
    getPointsPreview: async (cartId) => {
        return await axios.get(`/api/loyalty/checkout/points-preview/?cart_id=${cartId}`);
    },
    
    applyDiscountCode: async (code, cartId) => {
        return await axios.post('/api/loyalty/checkout/apply-discount/', {
            discount_code: code,
            cart_id: cartId
        });
    },
    
    getPointsConversion: async () => {
        return await axios.get('/api/loyalty/points-conversion/');
    },
    
    // Customer-specific endpoint to get diamond value
    getDiamondValue: async () => {
        try {
            // First try the points conversion endpoint (accessible to all users)
            const response = await axios.get('/api/loyalty/points-conversion/');
            if (response.data) {
                if (Array.isArray(response.data) && response.data.length > 0) {
                    return { diamond_points_value: response.data[0].points_per_diamond };
                } else if (response.data.points_per_diamond) {
                    return { diamond_points_value: response.data.points_per_diamond };
                }
            }
            return { diamond_points_value: 3000 }; // Default fallback
        } catch (error) {
            console.error("Error fetching diamond value:", error);
            return { diamond_points_value: 3000 }; // Default fallback
        }
    },
    
    // Admin endpoints
    getPrizes: async () => {
        return await axios.get('/api/loyalty/admin/prizes/');
    },
    
    createPrize: async (data) => {
        // Use FormData for file uploads
        const formData = new FormData();
        
        // Add regular fields to FormData
        formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);
        formData.append('points_required', data.points_required);
        formData.append('is_product', data.is_product);
        
        if (data.store_id) {
            formData.append('store_id', data.store_id);
        }
        
        if (data.is_product) {
            if (data.product_name) formData.append('product_name', data.product_name);
            if (data.product_description) formData.append('product_description', data.product_description);
            
            // Handle file properly - no conversion needed for FormData
            if (data.product_image) {
                formData.append('product_image', data.product_image);
            }
        } else {
            if (data.discount_percentage) formData.append('discount_percentage', data.discount_percentage);
        }
        
        return await axios.post('/api/loyalty/admin/prizes/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    
    updatePrize: async (id, data) => {
        // Use FormData for file uploads
        const formData = new FormData();
        
        // Add regular fields to FormData
        formData.append('name', data.name);
        if (data.description) formData.append('description', data.description);
        formData.append('points_required', data.points_required);
        formData.append('is_product', data.is_product);
        
        if (data.store_id) {
            formData.append('store_id', data.store_id);
        }
        
        if (data.is_product) {
            if (data.product_name) formData.append('product_name', data.product_name);
            if (data.product_description) formData.append('product_description', data.product_description);
            
            // Handle file properly - no conversion needed for FormData
            if (data.product_image) {
                formData.append('product_image', data.product_image);
            }
        } else {
            if (data.discount_percentage) formData.append('discount_percentage', data.discount_percentage);
        }
        
        return await axios.put(`/api/loyalty/admin/prizes/${id}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    
    deletePrize: async (id) => {
        return await axios.delete(`/api/loyalty/admin/prizes/${id}/`);
    },
    
    // Global settings endpoints
    getGlobalSettings: async () => {
        return await axios.get('/api/loyalty/admin/settings/');
    },
    
    updateGlobalSettings: async (diamondPointsValue) => {
        return await axios.put('/api/loyalty/admin/settings/', {
            diamond_points_value: diamondPointsValue
        });
    },
    
    // Get all prizes for admin
    getAllPrizes: async () => {
        return await axios.get('/api/loyalty/admin/prizes/');
    },
    
    // Diamond management endpoints
    getAllStoresWithDiamonds: async () => {
        return await axios.get('/api/loyalty/admin/diamonds/');
    },
    
    assignDiamonds: async (storeId, pointsValue, quantity = 1) => {
        return await axios.post('/api/loyalty/admin/diamonds/', {
            store_id: storeId,
            quantity: quantity
        });
    },
    
    updateDiamond: async (diamondId, pointsValue, quantity) => {
        return await axios.put(`/api/loyalty/admin/diamonds/${diamondId}/`, { 
            quantity: quantity
        });
    },
    
    deleteDiamond: async (diamondId) => {
        return await axios.delete(`/api/loyalty/admin/diamonds/${diamondId}/`);
    }
};

export default loyaltyService; 