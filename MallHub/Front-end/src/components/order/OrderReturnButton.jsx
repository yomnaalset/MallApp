import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ReturnOrderForm from './ReturnOrderForm';

const OrderReturnButton = ({ order, onReturnSuccess }) => {
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  
  useEffect(() => {
    // Debug logs to see why button isn't showing
    console.log('Order data in return button:', order);
    console.log('Status check:', {
      hasOrder: !!order,
      isDelivered: order?.status === 'DELIVERED' || order?.delivery_status === 'DELIVERED',
      isInProgress: order?.status === 'IN_PROGRESS' || order?.delivery_status === 'IN_PROGRESS',
      isEligible: !!order?.is_return_eligible,
      hasReturn: !!order?.has_return
    });
  }, [order]);
  
  // Check if order has already been returned
  if (order?.has_return) {
    return (
      <div className="text-sm text-gray-500 mt-2">
        Return request already submitted
      </div>
    );
  }
  
  // TEMPORARILY: Show return button for IN_PROGRESS orders too (for testing)
  // Only show return button if order is delivered or in progress (for testing)
  const isDelivered = order?.status === 'DELIVERED' || order?.delivery_status === 'DELIVERED';
  const isInProgress = order?.status === 'IN_PROGRESS' || order?.delivery_status === 'IN_PROGRESS';
  
  if (!order || (!isDelivered && !isInProgress)) {
    return null;
  }
  
  // For IN_PROGRESS orders, show a test note
  if (isInProgress && !isDelivered) {
    return (
      <>
        <div className="text-xs text-blue-600 mb-2">
          ⚠️ Testing: Return button (normally only for delivered orders)
        </div>
        <Button 
          onClick={() => setIsReturnFormOpen(true)}
          variant="warning"
          className="mt-1"
          size="sm"
        >
          Test Return Order
        </Button>
        
        <ReturnOrderForm 
          order={order}
          isOpen={isReturnFormOpen}
          onClose={() => setIsReturnFormOpen(false)}
          onSuccess={onReturnSuccess}
        />
      </>
    );
  }
  
  // Check if return period has expired (48 hours) - only for delivered orders
  if (isDelivered && order?.is_return_eligible === false) {
    return (
      <div className="text-sm text-red-500 mt-2">
        Return period expired (48 hours)
      </div>
    );
  }

  return (
    <>
      <Button 
        onClick={() => setIsReturnFormOpen(true)}
        variant="warning"
        className="mt-3"
      >
        Return Order
      </Button>
      
      <ReturnOrderForm 
        order={order}
        isOpen={isReturnFormOpen}
        onClose={() => setIsReturnFormOpen(false)}
        onSuccess={onReturnSuccess}
      />
    </>
  );
};

export default OrderReturnButton; 