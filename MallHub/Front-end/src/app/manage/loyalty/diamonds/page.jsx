import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import loyaltyService from "@/services/loyalty-service";
import { Diamond } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  store_id: z.string().min(1, "Store is required"),
  quantity: z.string().min(1, "Quantity is required")
});

const updateFormSchema = z.object({
  quantity: z.string().min(1, "Quantity is required")
});

export default function LoyaltyDiamondsPage() {
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDiamond, setSelectedDiamond] = useState(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      store_id: "",
      quantity: "1"
    }
  });

  const updateForm = useForm({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      quantity: ""
    }
  });

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const response = await loyaltyService.getAllStoresWithDiamonds();
      setStores(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch stores",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const onAssignSubmit = async (data) => {
    try {
      await loyaltyService.assignDiamonds(
        data.store_id,
        undefined, // Don't pass points_value, use global setting
        parseInt(data.quantity)
      );
      toast({ title: "Success", description: "Diamonds assigned successfully" });
      setIsAssignModalOpen(false);
      form.reset();
      fetchStores();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign diamonds",
        variant: "destructive"
      });
    }
  };

  const onEditSubmit = async (data) => {
    try {
      await loyaltyService.updateDiamond(
        selectedDiamond.id,
        undefined, // We don't update points_value here
        parseInt(data.quantity)
      );
      toast({ title: "Success", description: "Diamond updated successfully" });
      setIsEditModalOpen(false);
      updateForm.reset();
      fetchStores();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update diamond",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (diamondId) => {
    if (!confirm("Are you sure you want to delete this diamond?")) return;
    
    try {
      await loyaltyService.deleteDiamond(diamondId);
      toast({ title: "Success", description: "Diamond deleted successfully" });
      fetchStores();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete diamond",
        variant: "destructive"
      });
    }
  };

  const openEditModal = (store) => {
    setSelectedDiamond(store.diamonds[0]);
    updateForm.setValue("quantity", store.diamonds[0].quantity.toString());
    setIsEditModalOpen(true);
  };

  // Filter stores without diamonds for assign modal
  const storesWithoutDiamonds = stores.filter(store => !store.diamonds || store.diamonds.length === 0);

  // Function to render diamond icons
  const renderDiamondIcons = (quantity) => {
    if (!quantity || quantity <= 0) return null;
    
    const icons = [];
    for (let i = 0; i < quantity; i++) {
      icons.push(
        <span key={i} className="text-xl">💎</span>
      );
    }
    return icons;
  };

  // Debug function to check what's coming from the API
  const logDiamondData = (store) => {
    if (store.diamonds && store.diamonds.length > 0) {
      console.log("Diamond data:", {
        store: store.name,
        quantity: store.diamonds[0].quantity,
        points: store.diamonds[0].points_value
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Loyalty Diamonds Management</h1>
        <Button onClick={() => setIsAssignModalOpen(true)}>Assign Diamonds</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => {
            // Log diamond data for debugging
            logDiamondData(store);
            
            return (
            <Card key={store.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {store.logo_url && (
                      <img
                        src={store.logo_url}
                        alt={store.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-medium">{store.name}</h3>
                      {store.categories && store.categories.length > 0 && (
                        <span className="text-sm text-gray-500">
                          {store.categories.map(category => category).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {store.diamonds && store.diamonds.length > 0 ? (
                  <div className="mt-4 p-2 border rounded bg-gray-50">
                    <div className="flex flex-col space-y-2">
                      <div className="flex flex-wrap gap-2 p-2 justify-center">
                        {store.diamonds[0].quantity && store.diamonds[0].quantity > 0 ? 
                          renderDiamondIcons(store.diamonds[0].quantity) : 
                          <span className="text-gray-400">No diamonds displayed</span>
                        }
                      </div>
                      <div className="flex items-center justify-between border-t pt-2">
                        <div>
                          {/* Removed points per diamond display */}
                        </div>
                        <div className="space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openEditModal(store)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDelete(store.diamonds[0].id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-2 border rounded bg-gray-50 text-gray-500 text-center">
                    No diamonds assigned
                  </div>
                )}
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      {/* Assign Diamond Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Diamonds to Store</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAssignSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="store_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a store" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {storesWithoutDiamonds.map((store) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Diamonds</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Number of diamonds" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Save</Button>
                <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Diamond Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Diamonds</DialogTitle>
          </DialogHeader>
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Diamonds</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Number of diamonds" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Update</Button>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 