import { useEffect, useState } from "react"
import { Gift, Award, Loader, ShoppingCart, Ticket, Copy } from "lucide-react"
import Container from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import loyaltyService from "@/services/loyalty-service"

export default function RewardsPage() {
  const [pointsBalance, setPointsBalance] = useState(null)
  const [pointsHistory, setPointsHistory] = useState([])
  const [availablePrizes, setAvailablePrizes] = useState([])
  const [diamondValue, setDiamondValue] = useState(3000) // Default value
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use the dedicated customer method to get diamond value
        try {
          const diamondValueData = await loyaltyService.getDiamondValue();
          console.log("Diamond value data:", diamondValueData);
          if (diamondValueData && diamondValueData.diamond_points_value) {
            setDiamondValue(diamondValueData.diamond_points_value);
          }
        } catch (err) {
          console.error("Error getting diamond value:", err);
          // Keep default value
        }
        
        const [balanceRes, historyRes, prizesRes] = await Promise.all([
          loyaltyService.getPointsBalance(),
          loyaltyService.getPointsHistory(),
          loyaltyService.getAvailablePrizes()
        ])
        
        console.log("Points balance:", balanceRes.data)
        console.log("Available prizes:", prizesRes.data)
        
        setPointsBalance(balanceRes.data?.total_points || 0)
        setPointsHistory(historyRes.data)
        setAvailablePrizes(Array.isArray(prizesRes.data) ? prizesRes.data : [])
      } catch (error) {
        console.error('Failed to fetch loyalty data:', error)
        toast({
          title: "Error",
          description: "Failed to load rewards data. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [toast])

  const handleRedeemPrize = async (prizeId) => {
    setRedeeming(prizeId)
    const prizeToCheck = availablePrizes.find(p => p.id === prizeId);
    if (prizeToCheck?.redeemed_by_user) {
        toast({ title: "Already Redeemed", description: "You have already redeemed this prize.", variant: "destructive" });
        setRedeeming(null);
        return;
    }

    try {
      const response = await loyaltyService.redeemPrize(prizeId)
      console.log("Redemption response:", response.data)
      
      // Refresh data after redeeming
      const [balanceRes, prizesRes] = await Promise.all([
        loyaltyService.getPointsBalance(),
        loyaltyService.getAvailablePrizes()
      ])
      
      setPointsBalance(balanceRes.data?.total_points || 0)
      setAvailablePrizes(prizesRes.data)
      
      const prize = availablePrizes.find(p => p.id === prizeId)
      let successMessage = "You have successfully redeemed your prize."
      
      // Customize message based on prize type
      if (prize) {
        if (prize.is_product) {
          successMessage = "Product has been added to your cart!"
        } else if (prize.discount_percentage) {
          // Show the prize name as the discount code and add a copy button
          successMessage = (
            <div className="flex items-center justify-between">
              <span>Your discount code is: <strong className="font-mono">{prize.name}</strong></span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-auto px-1 py-0.5 text-xs"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(prize.name);
                    toast({ title: "Copied!", description: "Discount code copied to clipboard." });
                  } catch (err) {
                    console.error('Failed to copy text: ', err);
                    toast({ title: "Copy Failed", description: "Could not copy code.", variant: "destructive" });
                  }
                }}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          );
        }
      }
      
      toast({
        title: "Success!",
        description: successMessage,
      })
    } catch (error) {
      toast({
        title: "Failed to redeem",
        description: error.response?.data?.Details || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRedeeming(null)
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center min-h-[600px]">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading your rewards information...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-3xl font-bold tracking-tight">Rewards & Awards</h1>
        <p className="text-muted-foreground mt-2">
          Redeem your points for exclusive rewards and special offers.
        </p>

        {/* Points Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="col-span-3 md:col-span-2">
            <CardHeader>
              <CardTitle>Your Points Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{pointsBalance || 0} Points</h2>
                  <p className="text-muted-foreground">Current Balance</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Diamond Value</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="flex items-center">
                        <span className="mr-2 text-xl">💎</span>
                        <span>1 Diamond</span>
                      </TableCell>
                      <TableCell className="text-right">{diamondValue} points</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3 md:col-span-1">
            <CardHeader>
              <CardTitle>How to Earn More</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Gift className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span className="text-sm">Make purchases to earn 1 point for every $10 spent</span>
                </li>
                <li className="flex items-start">
                  <Gift className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span className="text-sm">Write product reviews to earn bonus points</span>
                </li>
                <li className="flex items-start">
                  <Gift className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span className="text-sm">Refer friends to earn 500 points per referral</span>
                </li>
                <li className="flex items-start">
                  <Gift className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                  <span className="text-sm">Complete your profile to earn 200 points</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Available Rewards */}
        <h2 className="text-2xl font-bold mt-12 mb-6">Available Rewards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePrizes.length > 0 ? (
            availablePrizes.map((prize) => (
              <Card key={prize.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{prize.name}</CardTitle>
                    {prize.is_product ? (
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    ) : (
                      <Ticket className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">{prize.description}</p>
                  <div className="mt-4 flex items-center text-lg font-semibold">
                    <Award className="h-5 w-5 text-primary mr-2" />
                    {prize.points_required} points
                  </div>
                  {prize.is_product && (
                    <div className="mt-2 text-sm text-green-600">
                      Redeem to add this product to your cart!
                    </div>
                  )}
                  {!prize.is_product && prize.discount_percentage && (
                    <div className="mt-2 text-sm text-blue-600">
                      {prize.discount_percentage}% discount on your purchase!
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <div className="w-full text-center text-sm mb-1 h-5">
                    {prize.redeemed_by_user ? (
                      <span className="text-blue-600 font-medium">Already Redeemed</span>
                    ) : (pointsBalance || 0) >= prize.points_required ? (
                      <span className="text-green-600">You have enough points!</span>
                    ) : (
                      <span className="text-amber-600">Need {prize.points_required - (pointsBalance || 0)} more points</span>
                    )}
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={prize.redeemed_by_user || (pointsBalance || 0) < prize.points_required || redeeming === prize.id}
                    onClick={() => handleRedeemPrize(prize.id)}
                  >
                    {redeeming === prize.id ? (
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Gift className="h-4 w-4 mr-2" />
                    )}
                    Redeem
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-10 border rounded-lg">
              <Gift className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No rewards available at the moment. Check back soon!</p>
            </div>
          )}
        </div>

        {/* Points History */}
        <h2 className="text-2xl font-bold mt-12 mb-6">Points History</h2>
        <Card className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pointsHistory.length > 0 ? (
                pointsHistory.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className={transaction.points > 0 ? "text-green-600" : "text-red-600"}>
                      {transaction.points > 0 ? `+${transaction.points}` : transaction.points}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No transactions found. Start shopping to earn points!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </Container>
  )
} 