import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { createReturnRequest } from '../../services/delivery-service';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';

const ReturnOrderForm = ({ order, onSuccess, isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();
  
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      console.log('Order data for return:', order);
      
      const returnData = {
        delivery_order_id: order.id || order.order_id,
        reason: data.reason
      };
      
      console.log('Submitting return request with data:', returnData);
      
      await createReturnRequest(returnData);
      
      toast({
        description: 'Return request has been sent to the delivery manager. You will be notified once reviewed.'
      });
      reset();
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting return request:', error);
      console.error('Error response:', error.response?.data);
      toast({
        variant: 'destructive',
        description: error.response?.data?.Details || 'Failed to submit return request'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Return</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-md mb-4">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Return requests must be submitted within 48 hours of delivery.
            </p>
          </div>
          
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Return
            </label>
            <Textarea
              id="reason"
              placeholder="Please explain why you're returning this order..."
              {...register('reason', { 
                required: 'Reason is required',
                minLength: { value: 10, message: 'Please provide a more detailed reason' }
              })}
              error={errors.reason?.message}
              className="w-full"
            />
            {errors.reason && (
              <p className="text-sm text-red-500 mt-1">{errors.reason.message}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Return Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnOrderForm; 