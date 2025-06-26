"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Loader2, DiamondIcon, Star, ShoppingBag, Award, Gift } from "lucide-react"
import { Container } from "@/components/container"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"

export default function LoyaltyPage() {
  const [loyaltyData, setLoyaltyData] = useState(null)
  const [transactionHistory, setTransactionHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      try {
        const [loyaltyResponse, transactionsResponse] = await Promise.all([
          axios.get('/api/loyalty/points'),
          axios.get('/api/loyalty/transactions')
        ])
        
        setLoyaltyData(loyaltyResponse.data)
        setTransactionHistory(transactionsResponse.data)
      } catch (error) {
        console.error('Failed to fetch loyalty data:', error)
        toast({
          title: "Error",
          description: "Failed to load loyalty data. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchLoyaltyData()
  }, [toast])

  // Calculate next tier requirements
  const getTierProgress = () => {
    if (!loyaltyData) return { tier: 'Loading...', progress: 0, nextTier: 'Loading...', pointsNeeded: 0 }
    
    const tiers = [
      { name: 'Bronze', threshold: 0 },
      { name: 'Silver', threshold: 1000 },
      { name: 'Gold', threshold: 5000 },
      { name: 'Platinum', threshold: 10000 },
      { name: 'Diamond', threshold: 25000 }
    ]
    
    const currentTierIndex = tiers.findIndex((tier, index, array) => {
      return loyaltyData.points >= tier.threshold && 
        (index === array.length - 1 || loyaltyData.points < array[index + 1].threshold)
    })
    
    const currentTier = tiers[currentTierIndex]
    const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null
    
    if (!nextTier) {
      return { 
        tier: currentTier.name, 
        progress: 100, 
        nextTier: 'Max Tier Reached', 
        pointsNeeded: 0 
      }
    }
    
    const pointsNeeded = nextTier.threshold - loyaltyData.points
    const progress = ((loyaltyData.points - currentTier.threshold) / 
      (nextTier.threshold - currentTier.threshold)) * 100
    
    return {
      tier: currentTier.name,
      progress: Math.round(progress),
      nextTier: nextTier.name,
      pointsNeeded
    }
  }

  const tierProgress = getTierProgress()

  // Benefits display data
  const tierBenefits = {
    'Bronze': [
      'Earn 1 point for every $10 spent',
      'Birthday gift: 100 points',
      'Access to members-only promotions'
    ],
    'Silver': [
      'Earn 1.5 points for every $10 spent',
      'Free shipping on orders over $50',
      'Birthday gift: 200 points',
      'Early access to sales'
    ],
    'Gold': [
      'Earn 2 points for every $10 spent',
      'Free shipping on all orders',
      'Birthday gift: 500 points',
      'Exclusive early access to new products'
    ],
    'Platinum': [
      'Earn 3 points for every $10 spent',
      'Free expedited shipping',
      'Birthday gift: 1000 points',
      'Personal shopping assistant'
    ],
    'Diamond': [
      'Earn 5 points for every $10 spent',
      'Free premium shipping',
      'Birthday gift: 2500 points',
      'VIP customer service',
      'Exclusive events and offers'
    ]
  }

  if (loading) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center min-h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading your loyalty information...</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-3xl font-bold tracking-tight">Loyalty Program</h1>
        <p className="text-muted-foreground mt-2">
          Earn points with every purchase and unlock exclusive benefits.
        </p>

        {/* Points Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="p-6 col-span-3 md:col-span-2">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <DiamondIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{loyaltyData?.points || 0} Points</h2>
                <p className="text-muted-foreground">Current Balance</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{tierProgress.tier} Tier</span>
                <span>{tierProgress.progress}% to {tierProgress.nextTier}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${tierProgress.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Earn {tierProgress.pointsNeeded} more points to reach {tierProgress.nextTier}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button variant="outline" className="w-full">
                How to Earn
              </Button>
              <Button variant="outline" className="w-full">
                Redeem Points
              </Button>
            </div>
          </Card>

          <Card className="p-6 col-span-3 md:col-span-1">
            <h3 className="font-semibold text-lg mb-4">Current Tier Benefits</h3>
            <ul className="space-y-3">
              {tierBenefits[tierProgress.tier]?.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <Star className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Ways to Earn */}
        <h2 className="text-2xl font-bold mt-12 mb-6">Ways to Earn Points</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <ShoppingBag className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg">Make a Purchase</h3>
            <p className="text-muted-foreground mt-2">
              Earn points with every purchase. {tierProgress.tier} members earn 
              {tierProgress.tier === 'Bronze' ? '1' : 
                tierProgress.tier === 'Silver' ? '1.5' : 
                tierProgress.tier === 'Gold' ? '2' : 
                tierProgress.tier === 'Platinum' ? '3' : '5'} points per $10 spent.
            </p>
          </Card>
          
          <Card className="p-6">
            <Award className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg">Write Reviews</h3>
            <p className="text-muted-foreground mt-2">
              Earn 50 points for each product review you write after purchasing.
            </p>
          </Card>
          
          <Card className="p-6">
            <Gift className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg">Birthday Bonus</h3>
            <p className="text-muted-foreground mt-2">
              Receive a special points bonus on your birthday. Amount varies by tier level.
            </p>
          </Card>
        </div>

        {/* Transaction History */}
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
              {transactionHistory.length > 0 ? (
                transactionHistory.map((transaction) => (
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