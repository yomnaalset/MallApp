import React, { useState, useEffect } from 'react';
import { getCustomerReturns } from '../../services/delivery-service';
import { Spinner, Card, Badge } from '../ui';
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

const CustomerReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await getCustomerReturns();
      
      if (response.status === 'success') {
        setReturns(response.returns || []);
      } else if (response.status === 'info') {
        setReturns([]);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchReturns();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (returns.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">You have not made any return requests</p>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">My Return Requests</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        {returns.map((returnOrder) => (
          <Card key={returnOrder.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-sm text-gray-500">Order #</span>
                <h3 className="text-lg font-medium">{returnOrder.delivery_order_id}</h3>
              </div>
              <Badge color={getStatusBadgeColor(returnOrder.status)}>
                {getStatusLabel(returnOrder.status)}
              </Badge>
            </div>
            
            <div className="mb-3">
              <span className="text-sm text-gray-500">Date Requested</span>
              <p>{returnOrder.created_at_formatted}</p>
            </div>
            
            <div className="mb-3">
              <span className="text-sm text-gray-500">Reason</span>
              <p className="text-sm mt-1">{returnOrder.reason}</p>
            </div>
            
            {returnOrder.status === 'REJECTED' && (
              <div className="bg-red-50 p-3 rounded-md">
                <p className="text-sm text-red-700">
                  Your return request has been rejected. Please contact customer support for more information.
                </p>
              </div>
            )}
            
            {returnOrder.status === 'APPROVED' && !returnOrder.delivery_user && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  Your return has been approved and will be assigned to a delivery driver soon.
                </p>
              </div>
            )}
            
            {returnOrder.status === 'IN_PROGRESS' && (
              <div className="bg-purple-50 p-3 rounded-md">
                <p className="text-sm text-purple-700">
                  A delivery driver is on the way to collect your return.
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomerReturns; 