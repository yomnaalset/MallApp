import api from './axios';

// Delivery Orders
export const getDeliveryOrders = async () => {
  const response = await api.get('/api/delivery/orders/');
  return response.data;
};

export const updateDeliveryStatus = async (deliveryId, status) => {
  const response = await api.put(`/api/delivery/orders/${deliveryId}/status/`, { status });
  return response.data;
};

export const getDeliveryHistory = async () => {
  const response = await api.get('/api/delivery/history/');
  return response.data;
};

// Return Orders for Customers
export const createReturnRequest = async (returnData) => {
  const response = await api.post('/api/delivery/customer/returns/', returnData);
  return response.data;
};

export const getCustomerReturns = async () => {
  const response = await api.get('/api/delivery/customer/returns/');
  return response.data;
};

export const getCustomerReturnDetails = async (returnId) => {
  const response = await api.get(`/api/delivery/customer/returns/${returnId}/`);
  return response.data;
};

// Return Orders for Delivery Users
export const getDeliveryReturns = async () => {
  const response = await api.get('/api/delivery/returns/');
  return response.data;
};

export const updateReturnStatus = async (returnId, status) => {
  const response = await api.put(`/api/delivery/returns/${returnId}/status/`, { status });
  return response.data;
};

// Return Orders for Admins
export const getAdminReturns = async (statusFilter = '') => {
  const url = statusFilter 
    ? `/api/delivery/admin/returns/?status=${statusFilter}`
    : '/api/delivery/admin/returns/';
  const response = await api.get(url);
  return response.data;
};

export const updateAdminReturnStatus = async (returnId, status, deliveryUserId = null) => {
  const data = { status };
  if (deliveryUserId) {
    data.delivery_user_id = deliveryUserId;
  }
  const response = await api.put(`/api/delivery/admin/returns/${returnId}/status/`, data);
  return response.data;
};

export const assignReturnsToDeliveryUsers = async () => {
  const response = await api.post('/api/delivery/admin/returns/assign/');
  return response.data;
}; 