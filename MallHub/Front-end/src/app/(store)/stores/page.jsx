import { StoreService } from "@/services/store.service";
import { useEffect, useState } from "react";
import Loader from "@/components/shared/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import StoreCard from "@/components/store/store-card";

const defaultInput = {
    pagination: {
        total_items: 0,
        total_pages: 0,
        current_page: 0,
        per_page: 0,
        has_next: false,
        has_previous: false,
    },
    stores: []
}

const StoresPage = () => {

    const [data, setData] = useState(defaultInput);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 10,
        q: ''
    });
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const handleSearchChange = useDebounce((e) => {
        setPagination(prev => ({ ...prev, page: 1, q: e.target.value }));
        setData(defaultInput); // Reset data when search changes
    }, 400);


    const next = async () => {
        if (data.pagination?.has_next) {
            setIsLoadingMore(true);
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
        }
    }

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                const response = await StoreService.getPaginatedStores({ ...pagination });
                
                if (isLoadingMore) {
                    // Append stores when loading more
                    setData(prev => ({ 
                        ...response,
                        stores: [...prev.stores, ...response.stores] 
                    }));
                } else {
                    // Replace stores entirely when it's a new search
                    setData(response);
                }
            } catch (ex) {
                console.log(ex);
            } finally {
                setLoading(false);
                setIsLoadingMore(false);
            }
        }
        
        init();
    }, [pagination]);

    return (<>
        <div className="flex-1">
            <section id="search" className="padding py-4 bg-[#f8f9fa]">
                <div className="wrapper">
                    <div className="text-2xl font-bold mb-5">Search for your favorite store!</div>
                    <Input placeholder="Search for store..." className="bg-background" onChange={handleSearchChange} />
                </div>
            </section>


            <section id="products" className="w-full wrapper">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {data.stores?.map((store, index) => (
                        <StoreCard key={store.id || index} {...store} />
                    ))}
                </div>

                {loading && <div className="w-full flex justify-center mt-5">
                    <Loader />
                </div>}
                
                {data.pagination?.has_next &&
                    <div className="flex items-center justify-center mt-8">
                        <Button onClick={next} disabled={loading}>
                            {isLoadingMore ? "Loading..." : "Load More"}
                        </Button>
                    </div>
                }
            </section>
        </div>
    </>);
}

export default StoresPage;