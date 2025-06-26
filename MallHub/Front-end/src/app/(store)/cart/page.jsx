import LoadingPage from "@/app/loading";
import { CartService } from "@/services/cart.service";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Loader } from "lucide-react";
import AddToCartButton from "@/components/product/add-to-cart";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import CreditCardForm from "@/components/checkout/card-input";
import { OrderService } from "@/services/order.service";
import loyaltyService from "@/services/loyalty-service";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema } from "@/lib/validators";

const CartPage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({});
    const [originalCartData, setOriginalCartData] = useState(null);
    const [pointsPreview, setPointsPreview] = useState(null);
    const [discountCode, setDiscountCode] = useState('');
    const [discountApplied, setDiscountApplied] = useState(null);
    const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
    const [fetch, setFetch] = useState(0);
    const { toast } = useToast();

    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                const cartData = await CartService.viewCart();
                setData(cartData);
                setOriginalCartData(cartData);
            } catch (ex) {
                console.log(ex);
            } finally {
                setLoading(false);
            }
        }
        init().then();
    }, [fetch]);

    // Fetch points preview when cart loads
    useEffect(() => {
        if (data?.id) {
            const fetchPointsPreview = async () => {
                try {
                    const response = await loyaltyService.getPointsPreview(data.id);
                    setPointsPreview(response.data);
                } catch (error) {
                    console.error("Error fetching points preview", error);
                }
            };
            fetchPointsPreview();
        }
    }, [data?.id, fetch]);

    const form = useForm({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            card_number: "",  // Valid test card
            expiry_month: "",
            expiry_year: "",
            cvv: ""
        }
    });

    const { isSubmitting } = form.formState;

    const onSubmit = async (values) => {
        try {
            const paymentPayload = {
                ...values,
                discount_code: discountApplied ? discountApplied.discount_code : null
            };
            await OrderService.Pay(paymentPayload);
            setFetch(prev => !prev);
            toast({
                title: "Success",
                description: "Order is created",               
            });
            navigate('/orders');
        } catch {
            toast({
                variant: "destructive",
                description: "Something went wrong"
            });
        }
    };

    // Apply discount code
    const applyDiscount = async () => {
        if (!discountCode.trim()) return;
        
        setIsApplyingDiscount(true);
        try {
            const response = await loyaltyService.applyDiscountCode(discountCode, data.id);
            setDiscountApplied(response.data);
            
            toast({
                title: "Success",
                description: `Discount of ${response.data.discount_percentage}% applied`
            });
        } catch (error) {
            toast({
                variant: "destructive",
                description: "Invalid discount code"
            });
        } finally {
            setIsApplyingDiscount(false);
        }
    };

    if (loading)
        return <LoadingPage />;

    return (<div className="wrapper">
        <h1 className="py-4 h2-bold">Shopping Cart</h1>

        <div className="grid md:grid-cols-4 md:gap-8">
            <div className="overflow-x-auto md:col-span-3">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-center">Quantity</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.items?.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <Link to={`/products/${item.product.id}`} className="flex items-center" >
                                        <img src={item.product.image_url} alt={item.product.name} width={50} height={50} />
                                        <span className="px-2">{item.product.name}</span>
                                    </Link>
                                </TableCell>
                                <TableCell className='flex-center gap-2'>
                                    <AddToCartButton 
                                        itemId={item?.id} 
                                        key={item?.id} 
                                        qty={item.quantity} 
                                        id={item?.product.id} 
                                        onChange={(e) => setFetch(e)} 
                                        quantityLocked={item.is_prize_redemption}
                                    />
                                </TableCell>
                                <TableCell className='text-right'>
                                    {item.discounted_price ? (
                                        <div>
                                            <span className="text-gray-500 line-through mr-2">
                                                ${parseFloat(item.product.price).toFixed(2)}
                                            </span>
                                            <span className="text-green-600 font-medium">
                                                ${parseFloat(item.discounted_price).toFixed(2)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span>${parseFloat(item.product.price).toFixed(2)}</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {!data || data?.items?.length === 0 &&
                    <div className="mt-5">
                        Cart is empty. <Link to="/" >Go Shopping</Link>
                    </div>
                }
            </div>

            {data?.items?.length !== 0 &&
                <Card className="h-fit">
                    <CardContent className='p-4 gap-4'>
                        {/* Discount Code Field */}
                        <div className="mb-4">
                            <h3 className="text-sm font-medium mb-2">Apply Discount Code</h3>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Enter code" 
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                />
                                <Button 
                                    variant="secondary" 
                                    onClick={applyDiscount}
                                    disabled={isApplyingDiscount || !discountCode.trim()}
                                >
                                    {isApplyingDiscount ? <Loader className="h-4 w-4 animate-spin" /> : 'Apply'}
                                </Button>
                            </div>
                            
                            {/* Discount Applied Message */}
                            {discountApplied && (
                                <div className="mt-2 text-sm text-green-600">
                                    Discount applied: {discountApplied.discount_percentage}% off
                                </div>
                            )}
                        </div>
                        
                        <div className='pb-3 text-lg flex-between'>
                            <span className="font-bold">
                                Total: $
                                {/* Display discounted total if available, otherwise original */}
                                {discountApplied 
                                    ? parseFloat(discountApplied.final_amount).toFixed(2) 
                                    : parseFloat(originalCartData?.total || 0).toFixed(2)}
                            </span>
                        </div>
                        
                        {/* Loyalty Points Preview */}
                        {pointsPreview && pointsPreview.total_points > 0 && (
                            <div className="text-sm mt-2 mb-4 text-green-600 font-medium">
                                You will earn {pointsPreview.total_points} points from this purchase
                            </div>
                        )}

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                                <CreditCardForm form={form} />
                                <Button
                                    type="submit"
                                    className='w-full mt-4'
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader className='animate-spin w-4 h-4' />
                                    ) : (
                                        <ArrowRight className='w-4 h-4' />
                                    )}
                                    Checkout
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            }
        </div>
    </div>);
};

export default CartPage;