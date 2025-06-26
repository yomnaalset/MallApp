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


const AdminCategoriesPage = () => {

    const [data, setData] = useState({
        categories: [],
    });

    const [pagination, setPagination] = useState({
        ...paginationDefaultValues
    })

    const { toast } = useToast();

    useEffect(() => {
        const init = async () => {
            const request = await AdminService.getPaginatedCategories({ ...pagination });
            setData(request);
        }
        init().then();
    }, [pagination]);

    const onPageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }))
    }

    const onDelete = async (id) => {
        try {
            await AdminService.deleteCategory(id)
            setPagination(prev => ({ ...prev }))
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
                <h1 className="h2-bold">Categories</h1>
            </div>
            <div className="flex gap-x-2">
                <Button asChild variant={`default`}>
                    <Link to={`/manage/categories/create`}>
                        Create Category
                    </Link>
                </Button>
            </div>
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
                    {data?.categories?.map((category) => (
                        <TableRow key={category.id}>
                            <TableCell>{category.name}</TableCell>
                            <TableCell className="flex gap-1">
                                <Button asChild variant={`outline`}>
                                    <Link to={`/manage/categories/${category.id}`}>
                                        Edit
                                    </Link>
                                </Button>
                                <DeleteDialog id={category.id} action={onDelete} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        {data?.pagination?.total_pages > 1 && <Pagination page={pagination.current_page} totalPages={data?.pagination?.total_pages} onChange={onPageChange} />}
    </div>);
}

export default AdminCategoriesPage;