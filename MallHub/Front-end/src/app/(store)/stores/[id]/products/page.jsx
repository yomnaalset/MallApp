import { Input } from "@/components/ui/input";
import { StoreService } from "@/services/store.service";
import { useParams } from "react-router";
import ProductCard from "@/components/product/product-card";
import Loader from "@/components/shared/loader";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";


const defaultInput = {
  current_page: 0,
  has_next: false,
  has_previous: false,
  per_page: 0,
  total_items: 0,
  total_pages: 0,
  items: []
}


const StoreProductsPage = () => {

  const { id } = useParams();

  const [data, setData] = useState(defaultInput)
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    q: ''
  });

  const fetchProducts = async (pageToFetch, append = false) => {
    if (!append) setLoading(true);
    try {
      const fetchedData = await StoreService.getStoreProducts({ 
        id, 
        ...pagination, 
        page: pageToFetch 
      });
      setData(prev => ({
        ...fetchedData,
        items: append ? [...prev.items, ...fetchedData.items] : fetchedData.items
      }));
    } catch (ex) {
      console.log(ex);
      if (!append) setData(defaultInput);
    } finally {
      if (!append) setLoading(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    // Determine if we should append based on if page > 1
    fetchProducts(pagination.page, pagination.page > 1);

    return () => {
      abortController.abort();
    };
  }, [id, pagination]);


  const handleSearchChange = useDebounce((e) => {
    setPagination(prev => ({ ...prev, page: 1, q: e.target.value }));
    setData(defaultInput);
  }, 400);


  const next = async () => {
    if (data.has_next)
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
  }


  return (<>
    <div className="flex-1">
      <section id="search" className="padding py-4 bg-[#f8f9fa]">
        <div className="wrapper">
          <div className="text-2xl font-bold mb-5">Start Shopping Now!</div>
          <Input placeholder="Search for products..." className="bg-background" onChange={handleSearchChange} />
        </div>
      </section>


      <section id="products" className="w-full wrapper">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data?.items?.map((src, index) => (<ProductCard key={src.id} {...src} />))}
        </div>

        {loading && <div className="w-full flex justify-center mt-5">
          <Loader />
        </div>}
        {data.has_next &&
          <div className="flex items-center justify-center mt-8">
            <Button onClick={next}>Load More</Button>
          </div>
        }
      </section>
    </div>

  </>);
}

export default StoreProductsPage;