'use client'
import { useState } from "react";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

const DeleteDialog = ({ id, action }) => {

    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleDeleteClick = () => {
        startTransition(async () => {
            try {
                await action(id);
            } catch (ex) {
                toast({
                    variant: 'destructive',
                    description: "Something went wrong"
                });
            }
            setOpen(false);
        });
    }

    return (<AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
            <Button size={`sm`} variant={`destructive`} className="ml-2">Delete</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>
                    Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                    This action can&apos;t be undone
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    className="ml-2"
                    onClick={handleDeleteClick}
                >
                    {isPending ? 'Deleting...' : 'Delete'}
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>);
}

export default DeleteDialog;