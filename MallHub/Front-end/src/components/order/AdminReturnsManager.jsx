import React, { useState, useEffect } from 'react';
import { 
  getAdminReturns, 
  updateAdminReturnStatus,
  assignReturnsToDeliveryUsers
} from '../../services/delivery-service';
import { Button, Spinner, Card, Badge, Select } from '../ui';
import { toast } from 'react-hot-toast';

const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'PENDING': return 'yellow';
    case 'APPROVED': return 'blue';
    case 'REJECTED': return 'red';
    case 'IN_PROGRESS': return 'purple';
    case 'COMPLETED': return 'green';
    default: return 'gray';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'PENDING': return 'Pending Review';
    case 'APPROVED': return 'Approved';
    case 'REJECTED': return 'Rejected';
    case 'IN_PROGRESS': return 'Return in Progress';
    case 'COMPLETED': return 'Return Completed';
    default: return status;
  }
};

const AdminReturnsManager = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryUsers, setDeliveryUsers] = useState([]);
  const [selectedDeliveryUser, setSelectedDeliveryUser] = useState({});
  const [autoAssigning, setAutoAssigning] = useState(false);
  
  // Mock delivery users - in a real app, fetch these from an API
  useEffect(() => {
    // This would be replaced with an API call to get delivery users
    setDeliveryUsers([
      { id: 1, name: 'John Delivery' },
      { id: 2, name: 'Jane Delivery' },
      { id: 3, name: 'Bob Delivery' }
    ]);
  }, []);
  
  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await getAdminReturns(statusFilter);
      
      if (response.status === 'success') {
        setReturns(response.returns || []);
      } else if (response.status === 'info') {
        setReturns([]);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Failed to load return orders');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchReturns();
  }, [statusFilter]);
  
  const handleStatusUpdate = async (returnId, newStatus, deliveryUserId = null) => {
    try {
      setUpdatingId(returnId);
      await updateAdminReturnStatus(returnId, newStatus, deliveryUserId);
      toast.success(`Return status updated to ${getStatusLabel(newStatus)}`);
      fetchReturns();
      
      // Clear selected delivery user for this return
      setSelectedDeliveryUser({
        ...selectedDeliveryUser,
        [returnId]: ''
      });
    } catch (error) {
      console.error('Error updating return status:', error);
      toast.error(error.response?.data?.Details || 'Failed to update return status');
    } finally {
      setUpdatingId(null);
    }
  };
  
  const handleAutoAssign = async () => {
    try {
      setAutoAssigning(true);
      const response = await assignReturnsToDeliveryUsers();
      
      if (response.status === 'success') {
        toast.success(response.message);
        fetchReturns();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error auto-assigning returns:', error);
      toast.error('Failed to auto-assign returns to delivery users');
    } finally {
      setAutoAssigning(false);
    }
  };
  
  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Return Orders Management</h2>
        
        <div className="flex items-center space-x-4">
          <Select
            value={statusFilter}
            onChange={handleFilterChange}
            className="w-40"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </Select>
          
          <Button
            variant="primary"
            onClick={handleAutoAssign}
            disabled={autoAssigning}
          >
            {autoAssigning ? <Spinner size="sm" className="mr-2" /> : null}
            Auto-Assign Returns
          </Button>
        </div>
      </div>
      
      {returns.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No return orders found</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Return ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {returns.map((returnOrder) => (
                <tr key={returnOrder.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{returnOrder.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{returnOrder.delivery_order_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {returnOrder.customer_name}
                    <div className="text-xs text-gray-400">{returnOrder.customer_address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {returnOrder.created_at_formatted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={getStatusBadgeColor(returnOrder.status)}>
                      {getStatusLabel(returnOrder.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {returnOrder.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {returnOrder.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <Button
                          variant="success"
                          size="sm"
                          disabled={updatingId === returnOrder.id}
                          onClick={() => handleStatusUpdate(returnOrder.id, 'APPROVED')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={updatingId === returnOrder.id}
                          onClick={() => handleStatusUpdate(returnOrder.id, 'REJECTED')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {returnOrder.status === 'APPROVED' && !returnOrder.delivery_user && (
                      <div className="flex space-x-2">
                        <Select
                          value={selectedDeliveryUser[returnOrder.id] || ''}
                          onChange={(e) => setSelectedDeliveryUser({
                            ...selectedDeliveryUser,
                            [returnOrder.id]: e.target.value
                          })}
                          className="w-40"
                        >
                          <option value="">Select Driver</option>
                          {deliveryUsers.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </Select>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!selectedDeliveryUser[returnOrder.id] || updatingId === returnOrder.id}
                          onClick={() => handleStatusUpdate(
                            returnOrder.id, 
                            'APPROVED', 
                            selectedDeliveryUser[returnOrder.id]
                          )}
                        >
                          Assign
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminReturnsManager; 