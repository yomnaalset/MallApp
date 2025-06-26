import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DeliveryReturnsTable from "@/components/order/DeliveryReturnsTable";
import { useAuth } from "@/providers/auth-provider";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const DeliveryReturnsPage = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated or not a delivery user
    if (!isAuthenticated || role !== 'DELIVERY') {
      navigate('/login');
    }
  }, [isAuthenticated, role, navigate]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6 gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/delivery/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Return Requests</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Managing Returns</CardTitle>
          <CardDescription>
            Process customer return requests by following these steps:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">1. Start Return Pickup</h3>
            <p className="text-sm text-muted-foreground">
              When you're ready to collect the returned items, click "Start Return Pickup" to indicate you're processing the return.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">2. Complete Return</h3>
            <p className="text-sm text-muted-foreground">
              After you've collected the returned items, click "Complete Return" to finalize the return process.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Note</h3>
            <p className="text-sm text-muted-foreground">
              Completed returns will automatically be removed from the customer's orders list.
            </p>
          </div>
        </CardContent>
      </Card>

      <DeliveryReturnsTable />
    </div>
  );
};

export default DeliveryReturnsPage; 