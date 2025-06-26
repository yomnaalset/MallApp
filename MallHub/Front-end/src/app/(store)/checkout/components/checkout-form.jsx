import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { DiamondIcon, Check, Loader2 } from "lucide-react"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { formatPrice, calculateTotal } from "@/lib/utils"
import { OrderService } from "@/services/order.service"
import loyaltyService from "@/services/loyalty-service"
import CreditCardForm from "@/components/checkout/card-input"

export function CheckoutForm() {
  const { cart, clearCart } = useCart()
  const { toast } = useToast()
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [applyPoints, setApplyPoints] = useState(false)
  const [discountCode, setDiscountCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [potentialPoints, setPotentialPoints] = useState(0)
  const [diamondValue, setDiamondValue] = useState(0)
  const [totalDiamonds, setTotalDiamonds] = useState(0)
  const [storesWithDiamonds, setStoresWithDiamonds] = useState(0)
  
  // Fetch user's loyalty points and payment preview
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get loyalty points
        const pointsRes = await loyaltyService.getPointsBalance()
        const points = pointsRes.data.reduce((total, store) => total + store.points, 0)
        setLoyaltyPoints(points || 0)
        
        // Get diamond value
        const diamondRes = await loyaltyService.getDiamondValue()
        setDiamondValue(diamondRes.diamond_points_value || 3020)
        
        // Get payment preview
        const previewRes = await axios.get('/payment/preview/')
        if (previewRes.data && previewRes.data.loyalty_points) {
          setPotentialPoints(previewRes.data.loyalty_points.potential_points || 0)
          setTotalDiamonds(previewRes.data.loyalty_points.total_diamonds || 0)
          
          // Get store count
          if (previewRes.data.stores) {
            setStoresWithDiamonds(previewRes.data.stores.length)
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }
    
    if (cart.items.length > 0) {
      fetchData()
    }
  }, [cart.items])

  const handleApplyDiscount = async () => {
    if (!discountCode) return
    
    setIsApplyingDiscount(true)
    try {
      const response = await axios.post('/payment/preview/', { discount_code: discountCode })
      
      if (response.data && response.data.discount_applied) {
        setDiscount(response.data.discount_percentage)
        toast({
          title: "Discount applied",
          description: `${response.data.discount_percentage}% discount has been applied to your order.`,
        })
      } else {
        toast({
          title: "Invalid discount code",
          description: "The discount code you entered is invalid or expired.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error applying discount",
        description: error.response?.data?.message || "There was an error applying your discount code.",
        variant: "destructive",
      })
    } finally {
      setIsApplyingDiscount(false)
    }
  }
  
  const pointsDiscount = applyPoints ? Math.min(calculateTotal(cart) * 0.01 * Math.floor(loyaltyPoints / 100), calculateTotal(cart) * 0.2) : 0
  
  const totalWithDiscounts = calculateTotal(cart) - (calculateTotal(cart) * (discount / 100)) - pointsDiscount

  const form = useForm({
    resolver: zodResolver(z.object({
      card_number: z.string().min(16).max(16),
      expiry_month: z.string(),
      expiry_year: z.string(),
      cvv: z.string().min(3).max(3),
    }))
  })

  const handleSubmit = async (data) => {
    setPaymentLoading(true)
    try {
      const response = await OrderService.Pay(data)
      
      if (response.data.status === "success") {
        toast({
          title: "Payment successful",
          description: `Your order has been placed successfully! ${response.data.loyalty_points?.earned > 0 ? `You earned ${response.data.loyalty_points.earned} points!` : ''}`,
        })
        clearCart()
      }
    } catch (error) {
      toast({
        title: "Payment failed",
        description: error.response?.data?.message || "There was an error processing your payment.",
        variant: "destructive",
      })
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Order Summary</h2>
            <div className="mt-4 space-y-2">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
              
              <div className="flex flex-col space-y-2 pt-4">
                <div className="flex">
                  <input 
                    type="text" 
                    placeholder="Discount code" 
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="ml-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                    onClick={handleApplyDiscount}
                    disabled={isApplyingDiscount || !discountCode}
                  >
                    {isApplyingDiscount ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
                
                {loyaltyPoints >= 100 && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="usePoints"
                      checked={applyPoints}
                      onChange={() => setApplyPoints(!applyPoints)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="usePoints" className="text-sm">
                      Use {Math.floor(loyaltyPoints / 100) * 100} points for up to 20% discount
                    </label>
                  </div>
                )}
                
                <div className="flex items-center justify-between border-t pt-2">
                  <p className="text-sm font-medium">Subtotal</p>
                  <p className="text-sm font-medium">{formatPrice(calculateTotal(cart))}</p>
                </div>
                
                {discount > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Discount ({discount}%)</p>
                    <p className="text-sm font-medium text-green-600">
                      -{formatPrice(calculateTotal(cart) * (discount / 100))}
                    </p>
                  </div>
                )}
                
                {pointsDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Points Discount</p>
                    <p className="text-sm font-medium text-green-600">
                      -{formatPrice(pointsDiscount)}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between border-t pt-2">
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-sm font-medium">{formatPrice(totalWithDiscounts)}</p>
                </div>
                
                {totalDiamonds > 0 && (
                <div className="flex items-center text-sm text-muted-foreground mt-2">
                  <DiamondIcon className="h-4 w-4 mr-1 text-primary" />
                    <span>You'll earn {potentialPoints} points with this purchase! ({totalDiamonds} {totalDiamonds === 1 ? 'diamond' : 'diamonds'} × {diamondValue} points)</span>
                </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border p-4">
            <h2 className="font-medium mb-4">Payment Details</h2>
            <CreditCardForm form={form} />
          </div>
        </div>
        
        <Button type="submit" className="w-full" disabled={paymentLoading}>
          {paymentLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay {formatPrice(totalWithDiscounts)}</>
          )}
        </Button>
      </form>
    </Form>
  )
} 