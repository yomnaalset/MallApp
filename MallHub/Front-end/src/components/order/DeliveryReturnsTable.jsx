import React, { useState, useEffect } from 'react';
import { getDeliveryReturns, updateReturnStatus } from '../../services/delivery-service';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import LoadingPage from '@/app/loading';
import { Spinner } from '@/components/ui/spinner';

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
    case 'PENDING': return 'Pending';
    case 'APPROVED': return 'Approved';
    case 'REJECTED': return 'Rejected';
    case 'IN_PROGRESS': return 'In Progress';
    case 'COMPLETED': return 'Completed';
    default: return status;
  }
};

const ReturnActionButtons = ({ returnOrder, onStatusUpdate, isUpdating }) => {
  const { status, id } = returnOrder;
  
  if (status === 'APPROVED') {
    return (
      <Button
        variant="default"
        size="sm"
        disabled={isUpdating}
        onClick={() => onStatusUpdate(id, 'IN_PROGRESS')}
      >
        {isUpdating ? 'Processing...' : 'Start Return Pickup'}
      </Button>
    );
  }
  
  if (status === 'IN_PROGRESS') {
    return (
      <Button
        variant="success"
        size="sm"
        disabled={isUpdating}
        onClick={() => onStatusUpdate(id, 'COMPLETED')}
      >
        {isUpdating ? 'Processing...' : 'Complete Return'}
      </Button>
    );
  }
  
  return null;
};

const DeliveryReturnsTable = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const { toast } = useToast();
  
  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await getDeliveryReturns();
      
      if (response.status === 'success') {
        setReturns(response.returns || []);
      } else if (response.status === 'info') {
        setReturns([]);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to load return orders'
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchReturns();
  }, []);
  
  const handleStatusUpdate = async (returnId, newStatus) => {
    try {
      setUpdatingId(returnId);
      await updateReturnStatus(returnId, newStatus);
      toast({
        description: `Return status updated to ${getStatusLabel(newStatus)}`
      });
      fetchReturns();
    } catch (error) {
      console.error('Error updating return status:', error);
      toast({
        variant: 'destructive',
        description: error.response?.data?.Details || 'Failed to update return status'
      });
    } finally {
      setUpdatingId(null);
    }
  };
  
  if (loading) {
    return <LoadingPage />;
  }
  
  if (returns.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No return orders assigned to you</p>
      </Card>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {returns.map((returnOrder) => (
            <TableRow key={returnOrder.id}>
              <TableCell className="font-medium">
                #{returnOrder.delivery_order_id}
              </TableCell>
              <TableCell>
                {returnOrder.customer_name}
                <div className="text-xs text-muted-foreground">{returnOrder.customer_address}</div>
              </TableCell>
              <TableCell>
                {returnOrder.created_at_formatted}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeColor(returnOrder.status)}>
                  {getStatusLabel(returnOrder.status)}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {returnOrder.reason}
              </TableCell>
              <TableCell>
                <ReturnActionButtons 
                  returnOrder={returnOrder}
                  onStatusUpdate={handleStatusUpdate}
                  isUpdating={updatingId === returnOrder.id}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DeliveryReturnsTable; 