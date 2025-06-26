import LoadingPage from "@/app/loading";
import OrderDetailsDialog from "@/components/order/order-details-dialog";
import OrderStatus from "@/components/order/order-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { OrderService } from "@/services/order.service";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";

const ManageOrdersPage = () => {


    const [data, setData] = useState();
    const [loading, setLoading] = useState(false);
    const [fetch, setFetch] = useState(false)


    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                const order = await OrderService.getDeliveryOrder();
                setData(order);
            } catch (ex) {
                console.log(ex);
            } finally {
                setLoading(false);
            }
        }

        init().then();
    }, [fetch]);


    if (loading)
        return <LoadingPage />

    return (<div className="wrapper mt-4 grid gap-y-5">
        <div>
            <h1 className="h3-bold">Orders</h1>
            {!data && <div className="mt-2">
                No active orders.
            </div>}
        </div>



        {data?.length > 0 &&
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>PAYMENT ID</TableHead>
                        <TableHead>CUSTOMER</TableHead>
                        <TableHead>STATUS</TableHead>
                        <TableHead>ASSIGNED AT</TableHead>
                        <TableHead>DELIVERED AT</TableHead>
                        <TableHead>ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data?.map((src) => (
                        <TableRow key={src.id}>
                            <TableCell>{src?.id}</TableCell>
                            <TableCell>{src?.payment_id}</TableCell>
                            <TableCell>{src?.customer_name}</TableCell>
                            <TableCell><OrderStatus status={src?.status} /></TableCell>
                            <TableCell>
                                {src?.assigned_at
                                    ? formatDateTime(src?.assigned_at).dateTime
                                    : <Badge variant={'destructive'}>Not Assigned</Badge>
                                }
                            </TableCell>
                            <TableCell>
                                {src?.delivered_at
                                    ? <Badge>{formatDateTime(src?.delivered_at).dateTime}</Badge>
                                    : <>-</>
                                }
                            </TableCell>
                            <TableCell>
                                <OrderDetailsDialog order={src} callback={() => setFetch(prev => !prev)}>
                                    <Button size="icon">
                                        <Pencil />
                                    </Button>
                                </OrderDetailsDialog>
                            </TableCell>
                        </TableRow>
                    ))}

                </TableBody>
            </Table>

        }

    </div >);
}

export default ManageOrdersPage;