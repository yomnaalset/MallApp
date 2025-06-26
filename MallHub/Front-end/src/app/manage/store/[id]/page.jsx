import LoadingPage from "@/app/loading";
import StoreForm from "@/components/manage/store-form";
import { AdminService } from "@/services/admin.service";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

const UpdateStorePage = () => {

    const { id } = useParams();

    const [data, setData] = useState({
        categories: [],
        sections: []
    });

    const [store, setStore] = useState();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                const [categories, sections, store] = await Promise.all([
                    AdminService.getAllCategories(),
                    AdminService.getAllSection(),
                    AdminService.getStore(id)
                ]);

                setData({
                    categories: categories,
                    sections: sections
                })

                if (store?.store?.categories)
                    store.store.categories = store?.store?.categories?.[0]?.toString();

                setStore(store.store);
            } catch (ex) {
                console.log(ex);
            } finally {
                setLoading(false)
            }
        }
        init().then();
    }, [id])

    if (loading)
        return <LoadingPage />

    return (<>
        <h2 className="h2-bold">Update Store</h2>
        <div className="my-6">
            <StoreForm store={store} categories={data.categories} sections={data?.sections || []}  />
        </div>
    </>);
}

export default UpdateStorePage;