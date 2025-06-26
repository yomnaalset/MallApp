import { useEffect, useState } from "react";
import ProductForm from "@/components/manage/product-form";
import LoadingPage from "@/app/loading";
import { useToast } from "@/hooks/use-toast";
import { formatError } from "@/lib/utils";
import { AdminService } from "@/services/admin.service";
import { useParams } from 'react-router-dom';

const UpdateProductPage = () => {

    const { id } = useParams();
    const [categories, setCategories] = useState();
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState();
    

    const { toast } = useToast();

    useEffect(() => {
        const init = async () => {
            try {
                const [product, categories] = await Promise.all([
                    await AdminService.getProduct(id),
                    await AdminService.getAllCategories(),
                ]);                
                setCategories(categories);
                setProduct(product)
            } catch (ex) {
                const error = formatError(ex);
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

    return (<>
        <h2 className="h2-bold">Update Product</h2>
        <div className="my-6">
            <ProductForm product={product} categories={categories} />
        </div>
    </>);
}

export default UpdateProductPage;