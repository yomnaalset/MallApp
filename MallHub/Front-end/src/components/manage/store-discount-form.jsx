import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StoreService } from "@/services/store.service";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function StoreDiscountForm({ onDiscountChange }) {
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [currentDiscount, setCurrentDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentDiscount();
  }, []);

  const fetchCurrentDiscount = async () => {
    try {
      const response = await StoreService.getStoreDiscount();
      if (response.discount) {
        setCurrentDiscount(response.discount.percentage);
        setDiscountPercentage(response.discount.percentage);
      } else {
        setCurrentDiscount(0);
        setDiscountPercentage(0);
      }
    } catch (error) {
      console.error("Error fetching current discount:", error);
      toast({
        title: "Error",
        description: "Failed to fetch current discount information",
        variant: "destructive",
      });
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountPercentage || discountPercentage < 0 || discountPercentage > 100) {
      toast({
        title: "Invalid Input",
        description: "Discount percentage must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await StoreService.applyStoreDiscount(discountPercentage);
      if (result.discount) {
        setCurrentDiscount(result.discount.percentage);
      }
      
      toast({
        title: "Success",
        description: result.message || "Discount applied successfully",
      });
      
      if (onDiscountChange) {
        onDiscountChange(result.discount?.percentage || discountPercentage);
      }
    } catch (error) {
      console.error("Error applying discount:", error);
      toast({
        title: "Error",
        description: error.response?.data?.Details || "Failed to apply discount",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDiscount = async () => {
    setIsRemoving(true);
    try {
      const result = await StoreService.removeStoreDiscount();
      setCurrentDiscount(0);
      setDiscountPercentage(0);
      
      toast({
        title: "Success",
        description: result.message || "Discount removed successfully",
      });
      
      if (onDiscountChange) {
        onDiscountChange(0);
      }
    } catch (error) {
      console.error("Error removing discount:", error);
      toast({
        title: "Error",
        description: error.response?.data?.Details || "Failed to remove discount",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store-wide Discount</CardTitle>
        <CardDescription>
          Apply a discount percentage to all products in your store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="Discount percentage"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
              className="w-32"
            />
            <span>%</span>
            <Button 
              onClick={handleApplyDiscount} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply Discount"
              )}
            </Button>
            {currentDiscount > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleRemoveDiscount}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove Discount"
                )}
              </Button>
            )}
          </div>
          
          {currentDiscount > 0 && (
            <div className="text-sm bg-muted p-2 rounded">
              Current discount: <span className="font-bold">{currentDiscount}%</span> applied to all products
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 