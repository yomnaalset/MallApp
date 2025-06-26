/* eslint-disable react/prop-types */
'use client'
import { useState } from "react";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { OrderService } from "@/services/order.service";
import { ORDER_STATUS_ENUM } from "@/lib/constants";

const OrderDetailsDialog = ({ order, children, callback }) => {

    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleClick = () => {

        const status = order.status === ORDER_STATUS_ENUM.PENDING
            ? ORDER_STATUS_ENUM.IN_PROGRESS
            : ORDER_STATUS_ENUM.DELIVERED;

        startTransition(async () => {
            try {
                await OrderService.updateOrderStatus({ id: order.id, status });
                if (callback)
                    callback();

            } catch {
                toast({
                    variant: 'destructive',
                    description: "Something went wrong"
                });
            }
        });
    }

    return (<AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
            {children}
        </AlertDialogTrigger>
        <AlertDialogContent>

            <AlertDialogHeader className="mb-0">
                <AlertDialogTitle className="text-sm flex-between">
                    <p>{order.payment_id}</p>
                    <p>Total: {order.total_amount}</p>

                </AlertDialogTitle>
            </AlertDialogHeader>

            <Table className="mt-0">
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        <TableHead>NAME</TableHead>
                        <TableHead>QTY</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {order?.order_items?.map((src) => (
                        <TableRow key={src.product_id}>
                            <TableCell>
                                <img src={src.product_image} width={30} height={30} />
                            </TableCell>
                            <TableCell>{src.product_name}</TableCell>
                            <TableCell>{src.quantity}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                    size="sm"
                    disabled={isPending || ORDER_STATUS_ENUM.DELIVERED === order.status}
                    className="ml-2"
                    onClick={handleClick}
                >
                    {isPending ? 'Processing...' :
                        order.status === ORDER_STATUS_ENUM.PENDING ?
                            'Mark as In Progress'
                            : 'Mark as Delivered'
                    }
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>);
}

export default OrderDetailsDialog;