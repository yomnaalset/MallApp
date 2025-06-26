import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDeliveryOrders } from "@/services/delivery-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingPage from "@/app/loading";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/auth-provider";
import { useNavigate } from "react-router";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated or not a delivery user
    if (!isAuthenticated || role !== 'DELIVERY') {
      navigate('/login');
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getDeliveryOrders();
        if (response.status === 'success') {
          setOrders(response.orders || []);
        }
      } catch (error) {
        console.error('Error fetching delivery orders:', error);
        toast({
          variant: 'destructive',
          description: 'Failed to load delivery orders'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, role, navigate]);

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Delivery Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Active Deliveries</CardTitle>
            <CardDescription>Current orders awaiting delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {orders.filter(order => order.status !== 'DELIVERED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Return Requests</CardTitle>
            <CardDescription>Orders that need to be returned</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="text-3xl font-bold">
              {/* This would require another API call to get count */}
              {/* For now, just show a link to returns page */}
            </div>
            <Button asChild variant="outline">
              <Link to="/delivery/returns">View Return Requests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="completed">Completed Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {orders.filter(order => order.status !== 'DELIVERED').length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No active delivery orders at the moment.
              </CardContent>
            </Card>
          ) : (
            <DeliveryOrdersTable 
              orders={orders.filter(order => order.status !== 'DELIVERED')} 
              isActive={true}
            />
          )}
        </TabsContent>

        <TabsContent value="completed">
          {orders.filter(order => order.status === 'DELIVERED').length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No completed delivery orders.
              </CardContent>
            </Card>
          ) : (
            <DeliveryOrdersTable 
              orders={orders.filter(order => order.status === 'DELIVERED')} 
              isActive={false}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const DeliveryOrdersTable = ({ orders, isActive }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning">In Progress</Badge>;
      case 'DELIVERED':
        return <Badge variant="success">Delivered</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned At</TableHead>
            {!isActive && <TableHead>Delivered At</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">#{order.id}</TableCell>
              <TableCell>
                {order.customer_name}
                <div className="text-xs text-muted-foreground">{order.customer_address}</div>
              </TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell>{formatDateTime(order.assigned_at).dateTime}</TableCell>
              {!isActive && (
                <TableCell>{formatDateTime(order.delivered_at).dateTime}</TableCell>
              )}
              <TableCell>
                {isActive && (
                  <Button size="sm" asChild>
                    <Link to={`/delivery/orders/${order.id}`}>
                      Manage
                    </Link>
                  </Button>
                )}
                {!isActive && order.has_return && (
                  <Badge variant="outline">Has Return</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DeliveryDashboard; 