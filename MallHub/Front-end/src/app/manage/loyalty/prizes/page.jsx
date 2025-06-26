import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import loyaltyService from "@/services/loyalty-service";
import { AdminService } from "@/services/admin.service";
import { Gift, PercentIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  points_required: z.string().min(1, "Points required is required"),
  store_id: z.string().optional(), // Made store_id optional for admin users
  is_product: z.boolean().default(false),
  product: z.string().optional(),
  product_name: z.string().optional(),
  product_description: z.string().optional(),
  product_image: z.any().optional(), // For file uploads
  discount_percentage: z.string().optional(),
});

export default function LoyaltyPrizesPage() {
  const [stores, setStores] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [diamondPointsValue, setDiamondPointsValue] = useState(5000);
  const [isEditingDiamondPoints, setIsEditingDiamondPoints] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      points_required: "",
      is_product: false,
      product: "",
      discount_percentage: "",
    }
  });

  const editForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      points_required: "",
      is_product: false,
      product: "",
      discount_percentage: "",
    }
  });

  // Form for diamond points
  const diamondPointsForm = useForm({
    defaultValues: {
      points_value: "5000"
    }
  });

  const watchIsProduct = form.watch("is_product");
  const watchEditIsProduct = editForm.watch("is_product");

  const fetchStores = async () => {
    try {
      // We still need to fetch products for product-type prizes
      fetchProducts();
      // Fetch all prizes directly
      fetchPrizes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    }
  };

  const fetchPrizes = async () => {
    setIsLoading(true);
    try {
      // For admin users, fetch all prizes
      const response = await loyaltyService.getAllPrizes();
      setPrizes(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch prizes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch products from the store
  const fetchProducts = async () => {
    try {
      // Since we're creating gift products, we don't actually need real products
      // and there's a permission issue with the API
      setProducts([
        { id: "1", name: "Product 1" },
        { id: "2", name: "Product 2" },
        { id: "3", name: "Product 3" },
        { id: "4", name: "Product 4" },
        { id: "5", name: "Product 5" },
      ]);
      
      /* 
      // Commented out due to permission issues
      const productsData = await AdminService.getPaginatedProducts({ page: 1, per_page: 100 });
      setProducts(productsData);
      */
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
      // Fallback mock data
      setProducts([
        { id: "1", name: "Product 1" },
        { id: "2", name: "Product 2" },
        { id: "3", name: "Product 3" },
      ]);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchGlobalSettings();
    // Fetch prizes on initial load
    fetchPrizes();
  }, []);

  // Fetch products when needed (when creating/editing product prize)
  useEffect(() => {
    if (watchIsProduct || watchEditIsProduct) {
      fetchProducts();
    }
  }, [watchIsProduct, watchEditIsProduct]);

  // Fetch global settings from backend
  const fetchGlobalSettings = async () => {
    try {
      const response = await loyaltyService.getGlobalSettings();
      if (response.data && response.data.diamond_points_value) {
        setDiamondPointsValue(response.data.diamond_points_value);
        // Update the form default value
        diamondPointsForm.setValue("points_value", response.data.diamond_points_value.toString());
      }
    } catch (error) {
      // If there's an error, we'll keep the default value
      console.error("Error fetching global settings:", error);
    }
  };

  // Store selection has been removed for admin users
  // Admin users now see all prizes regardless of store

  const onCreateSubmit = async (data) => {
    try {
      // Format data for API
      const formattedData = {
        name: data.name,
        description: data.description,
        points_required: parseInt(data.points_required),
        is_product: data.is_product,
      };

      // Only include store_id if we're in store manager view and have a selected store
      if (selectedStore) {
        formattedData.store_id = selectedStore;
      }

      if (data.is_product) {
        // Always use gift product fields now
        formattedData.product_name = data.product_name;
        formattedData.product_description = data.product_description;
        
        // Handle product image if provided
        if (data.product_image) {
          formattedData.product_image = data.product_image;
        }
      } else {
        formattedData.discount_percentage = parseInt(data.discount_percentage);
      }

      await loyaltyService.createPrize(formattedData);
      toast({ title: "Success", description: "Prize created successfully" });
      setIsCreateModalOpen(false);
      form.reset();
      fetchPrizes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create prize",
        variant: "destructive"
      });
    }
  };

  const openEditModal = (prize) => {
    setSelectedPrize(prize);
    editForm.reset({
      name: prize.name,
      description: prize.description || "",
      points_required: prize.points_required.toString(),
      is_product: prize.is_product,
      product: prize.product ? prize.product.toString() : "",
      discount_percentage: prize.discount_percentage ? prize.discount_percentage.toString() : "",
      product_name: prize.product_name || "",
      product_description: prize.product_description || "",
    });
    setIsEditModalOpen(true);
  };

  const onEditSubmit = async (data) => {
    try {
      // Format data for API
      const formattedData = {
        name: data.name,
        description: data.description,
        points_required: parseInt(data.points_required),
        is_product: data.is_product,
      };
      
      // Preserve the original store association if it exists
      if (selectedPrize && selectedPrize.store) {
        formattedData.store_id = selectedPrize.store;
      }

      if (data.is_product) {
        // Always use gift product fields now
        formattedData.product_name = data.product_name;
        formattedData.product_description = data.product_description;
        
        // Handle product image if provided
        if (data.product_image) {
          formattedData.product_image = data.product_image;
        }
      } else {
        formattedData.discount_percentage = parseInt(data.discount_percentage);
      }

      await loyaltyService.updatePrize(selectedPrize.id, formattedData);
      toast({ title: "Success", description: "Prize updated successfully" });
      setIsEditModalOpen(false);
      editForm.reset();
      fetchPrizes(selectedStore);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update prize",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (prizeId) => {
    if (!confirm("Are you sure you want to delete this prize?")) return;
    
    try {
      await loyaltyService.deletePrize(prizeId);
      toast({ title: "Success", description: "Prize deleted successfully" });
      fetchPrizes(selectedStore);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prize",
        variant: "destructive"
      });
    }
  };

  // Function to update diamond points value
  const updateDiamondPointsValue = async (data) => {
    const pointsValue = parseInt(data.points_value);
    
    try {
      // Update the global settings in the backend
      await loyaltyService.updateGlobalSettings(pointsValue);
      
      setDiamondPointsValue(pointsValue);
      toast({ 
        title: "Success", 
        description: `Diamond points value updated to ${pointsValue} points per diamond` 
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update diamond points value",
        variant: "destructive"
      });
    }
    
    setIsEditingDiamondPoints(false);
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Loyalty Prizes Management</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create Prize</Button>
      </div>

      {/* Diamond Points Value Setting Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium mb-1">Diamond Points Value</h3>
              <p className="text-sm text-gray-500">
                Each diamond is worth {diamondPointsValue} points across all stores
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Changing this value will update all existing diamonds across all stores
              </p>
            </div>
            {isEditingDiamondPoints ? (
              <Form {...diamondPointsForm}>
                <form 
                  onSubmit={diamondPointsForm.handleSubmit(updateDiamondPointsValue)}
                  className="flex items-center space-x-2"
                >
                  <FormField
                    control={diamondPointsForm.control}
                    name="points_value"
                    render={({ field }) => (
                      <FormItem className="m-0">
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Points per diamond" 
                            className="w-32" 
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="sm">Save</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditingDiamondPoints(false)}
                  >
                    Cancel
                  </Button>
                </form>
              </Form>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  diamondPointsForm.setValue("points_value", diamondPointsValue.toString());
                  setIsEditingDiamondPoints(true);
                }}
              >
                Edit Value
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Store selection removed - admin users see all prizes */}

      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Points Required</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prizes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No prizes found</TableCell>
              </TableRow>
            ) : (
              prizes.map((prize) => (
                <TableRow key={prize.id}>
                  <TableCell>{prize.name}</TableCell>
                  <TableCell>
                    {prize.is_product ? (
                      <span className="flex items-center">
                        <Gift className="h-4 w-4 mr-1" /> Product
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <PercentIcon className="h-4 w-4 mr-1" /> Discount
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{prize.points_required}</TableCell>
                  <TableCell>
                    {prize.is_product ? (
                      prize.product ? (
                        <span>Existing Product</span>
                      ) : prize.product_name ? (
                        <span>Gift: {prize.product_name}</span>
                      ) : (
                      <span>Gift Product</span>
                      )
                    ) : (
                      <span>{prize.discount_percentage}% Discount</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openEditModal(prize)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(prize.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Create Prize Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Prize</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prize Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter prize name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="points_required"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points Required</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Points required" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_product"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>This prize is a product</FormLabel>
                  </FormItem>
                )}
              />
              
              {watchIsProduct ? (
                <>
                  {/* Gift product creation fields only - no product selection */}
                  <FormField
                    control={form.control}
                    name="product_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gift Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="product_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gift Product Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter product description" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                <FormField
                  control={form.control}
                    name="product_image"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gift Product Image</FormLabel>
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                field.onChange(file);
                              }
                            }}
                          />
                        </FormControl>
                    </FormItem>
                  )}
                />
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="discount_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Percentage</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Discount percentage" 
                          min="1" 
                          max="100"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button type="submit">Create Prize</Button>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Prize Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Prize</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prize Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter prize name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="points_required"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points Required</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Points required" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="is_product"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>This prize is a product</FormLabel>
                  </FormItem>
                )}
              />
              
              {watchEditIsProduct ? (
                <>
                  {/* Gift product editing fields only - no product selection */}
                  <FormField
                    control={editForm.control}
                    name="product_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gift Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="product_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gift Product Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter product description" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                <FormField
                  control={editForm.control}
                    name="product_image"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Gift Product Image</FormLabel>
                        <FormControl>
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                field.onChange(file);
                              }
                            }}
                          />
                        </FormControl>
                        {selectedPrize?.product_image && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">Current image will be kept unless you upload a new one</p>
                          </div>
                        )}
                    </FormItem>
                  )}
                />
                </>
              ) : (
                <FormField
                  control={editForm.control}
                  name="discount_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Percentage</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Discount percentage" 
                          min="1" 
                          max="100"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button type="submit">Update Prize</Button>
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