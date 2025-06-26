import LoadingPage from "@/app/loading";
import ProductForm from "@/components/manage/product-form";
import { AdminService } from "@/services/admin.service";
import { useEffect, useState } from "react";

const CreateProductPage = () => {

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const init = async () => {
            try {
                const response = await AdminService.getAllCategories();
                setCategories(response || []);
            }
            catch (ex) {
                console.error('Error fetching categories:', ex);
                setCategories([]);
            }
            finally {
                setLoading(false);
            }
        }
        init().then();
    }, []);

    if (loading)
        return <LoadingPage />

    return (<>
        <h2 className="h2-bold">Create Product</h2>
        <div className="my-6">
            <ProductForm product={undefined} categories={categories} />
        </div>
    </>);
}

export default CreateProductPage;