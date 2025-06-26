import LoadingPage from "@/app/loading";
import CategoryForm from "@/components/manage/category-form";
import { useToast } from "@/hooks/use-toast";
import { formatError } from "@/lib/utils";
import { AdminService } from "@/services/admin.service";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';

const UpdateCategoryPage = () => {

    const { id } = useParams(); // Access the `id` parameter from the URL
    const [category, setCategory] = useState();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [error, setError] = useState()

    const { toast } = useToast();

    useEffect(() => {
        const init = async () => {
            try {
                const data = await AdminService.getCategory(id);
                setCategory(data.category);
            } catch (ex) {
                const error = formatError(ex);
                setError(error)
                toast({
                    ...error
                })
            } finally {
                setLoading(false);
            }
        };
        init().then();
    }, [id])


    if (loading)
        return <LoadingPage />

    if (error?.status === 404)
        return navigate('/not-found')

    return (<>
        <h2 className="h2-bold">Update Category</h2>
        <div className="my-6">
            <CategoryForm category={category} />
        </div>
    </>);
}


export default UpdateCategoryPage;