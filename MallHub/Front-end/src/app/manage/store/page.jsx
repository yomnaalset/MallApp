import { Button } from "@/components/ui/button";
import { AdminService } from "@/services/admin.service";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Pagination from "@/components/shared/pagination";
import DeleteDialog from "@/components/shared/delete-dialog";
import { formatError } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { paginationDefaultValues } from "@/lib/constants";

const AdminStoresPage = () => {

    const { toast } = useToast();

    const [data, setData] = useState([]);

    const [pagination, setPagination] = useState({
        ...paginationDefaultValues
    })

    useEffect(() => {
        const init = async () => {
            const x = await AdminService.getMyStore();
            setData([x]);
        }
        init().then();
    }, [pagination]);

    const onPageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }))
    }

    const onDelete = async (id) => {
        try {
            await AdminService.deleteStore(id)
            setData([])
        }
        catch (ex) {
            const error = formatError(ex);
            toast({
                ...error,
                variant: 'destructive'
            })
        }
    }


    return (<div className="space-y-2">
        <div className="flex-between mb-4">
            <div className="flex items-center gap-3">
                <h1 className="h2-bold">Stores</h1>
            </div>
            {data?.length === 0 && <Button asChild variant={`default`}>
                <Link to={`/manage/stores/create`}>
                    Create Store
                </Link>
            </Button>}
        </div>
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>NAME</TableHead>
                        <TableHead className="w-[100px]">ACTIONS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data?.map((src) => (
                        <TableRow key={src.id}>
                            <TableCell>{src.name}</TableCell>
                            <TableCell className="flex gap-1">
                                <Button asChild variant={`outline`}>
                                    <Link to={`/manage/stores/${src.id}`}>
                                        Edit
                                    </Link>
                                </Button>
                                <DeleteDialog id={src.id} action={onDelete} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        {data?.pagination?.total_pages > 1 && <Pagination page={pagination.current_page} totalPages={data?.pagination?.total_pages} onChange={onPageChange} />}

    </div>);
}

export default AdminStoresPage;