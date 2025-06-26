import LoadingPage from "@/app/loading";
import OrderStatus from "@/components/order/order-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_STATUS_ENUM } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { OrderService } from "@/services/order.service";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import OrderReturnButton from "@/components/order/OrderReturnButton";
import { useToast } from "@/hooks/use-toast";

const OrdersPage = () => {

    const [data, setData] = useState();
    const [loading, setLoading] = useState(false);
    const [orderReturned, setOrderReturned] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                const order = await OrderService.getCustomerOrder();
                console.log("Order data:", order);
                console.log("Return eligibility:", {
                  delivery_status: order?.delivery_status,
                  status: order?.status,
                  is_return_eligible: order?.is_return_eligible,
                  has_return: order?.has_return
                });
                setData(order)
            } catch (ex) {
                console.log(ex);
            } finally {
                setLoading(false);
            }
        }
        init().then();
    }, [])

    const refreshOrders = async () => {
        try {
            setLoading(true);
            const order = await OrderService.getCustomerOrder();
            setData(order);
        } catch (ex) {
            console.log(ex);
        } finally {
            setLoading(false);
        }
    };

    const handleReturnSuccess = () => {
        setData(null);
        setOrderReturned(true);
        toast({
            title: "Order Return Processed",
            description: "Your order has been removed from this page. The return request is being processed by the delivery manager.",
        });
    };

    if (loading)
        return <LoadingPage />

    return (<div className="wrapper mt-4 grid gap-y-5">
        <div>
            <h1 className="h3-bold">Orders</h1>
            {!data && !orderReturned && <div className="mt-2">
                No active orders. <Link to="/" >Go Shopping</Link>
            </div>}
            {!data && orderReturned && <div className="mt-2">
                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                    <p className="text-green-700">
                        Your return request has been submitted successfully. The order has been removed from this page.
                    </p>
                    <Link to="/" className="text-green-600 underline hover:text-green-800">Go Shopping</Link>
                </div>
            </div>}
        </div>

        {data &&
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>PAYMENT ID</TableHead>
                        <TableHead>STATUS</TableHead>
                        <TableHead>ASSIGNED AT</TableHead>
                        <TableHead>DELIVERED AT</TableHead>
                        <TableHead>ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>{data?.id || data?.order_id}</TableCell>
                        <TableCell>{data?.payment_id}</TableCell>
                        <TableCell><OrderStatus status={data?.status || data?.delivery_status} /></TableCell>
                        <TableCell>
                            {data?.assigned_at
                                ? formatDateTime(data?.assigned_at).dateTime
                                : <Badge variant={'destructive'}>Not Assigned</Badge>
                            }
                        </TableCell>
                        <TableCell>
                            {data?.delivered_at
                                ? formatDateTime(data?.delivered_at).dateTime
                                : '-'
                            }
                        </TableCell>
                        <TableCell>
                            {/* Show return button for DELIVERED orders, and temporarily for IN_PROGRESS orders (testing) */}
                            {((data?.status === 'DELIVERED' || data?.delivery_status === 'DELIVERED') || 
                              (data?.status === 'IN_PROGRESS' || data?.delivery_status === 'IN_PROGRESS')) && (
                                <OrderReturnButton 
                                    order={data} 
                                    onReturnSuccess={handleReturnSuccess}
                                />
                            )}
                        </TableCell>
                    </TableRow>

                </TableBody>
            </Table>

        }

    </div>);
}

export default OrdersPage;


