import StoreForm from "@/components/manage/store-form";
import { AdminService } from "@/services/admin.service";
import { useEffect, useState } from "react";

const CreateStorePage = () => {

    const [data, setData] = useState({
        categories: [],
        sections: []
    })

    useEffect(() => {
        const init = async () => {
            try {
                const [categoriesResponse, sectionsResponse] = await Promise.all([
                    AdminService.getAllCategories(),
                    AdminService.getAllSection()
                ]);
                setData({
                    categories: categoriesResponse || [],
                    sections: sectionsResponse || []
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }

        init().then();
    }, [])

    return (<>
        <h2 className="h2-bold">Create Store</h2>
        <div className="my-6">
            <StoreForm type="create" categories={data.categories} sections={data.sections} />
        </div>
    </>);
}

export default CreateStorePage;