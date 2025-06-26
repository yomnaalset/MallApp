import ProductCard from "@/components/product/product-card";
import Loader from "@/components/shared/loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { CustomerService } from "@/services/customer.service";
import { useEffect, useState } from "react";
import DiscountCodeBanner from "@/components/shared/DiscountCodeBanner";
import { DiscountCodeService } from "@/services/discount-code-service";

const defaultInput = {
  current_page: 0,
  has_next: false,
  has_previous: false,
  per_page: 0,
  total_items: 0,
  total_pages: 0,
  items: []
}

export default function Home() {

  const [data, setData] = useState(defaultInput);
  const [loading, setLoading] = useState(false);
  const [activeDiscountCode, setActiveDiscountCode] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    q: ''
  });

  const fetchProducts = async (pageToFetch, append = false) => {
    if (!append) setLoading(true);
    try {
      const fetchedData = await CustomerService.getPaginatedProducts({ ...pagination, page: pageToFetch });
      setData(prev => ({
        ...fetchedData,
        items: append ? [...prev.items, ...fetchedData.items] : fetchedData.items
      }));
    } catch (ex) {
      console.log(ex)
      if (!append) setData(defaultInput);
    } finally {
      if (!append) setLoading(false);
    }
  }

  // Fetch active discount codes
  const fetchActiveDiscountCodes = async () => {
    try {
      const discountCodes = await DiscountCodeService.getActiveDiscountCodes();
      if (discountCodes && discountCodes.length > 0) {
        setActiveDiscountCode(discountCodes[0]); // Display the first active discount code
      }
    } catch (error) {
      console.error("Error fetching active discount codes:", error);
    }
  };

  useEffect(() => {
    fetchProducts(pagination.page, pagination.page > 1);
    fetchActiveDiscountCodes();
  }, [pagination]);

  const handleSearchChange = useDebounce((e) => {
    setPagination(prev => ({ ...prev, page: 1, q: e.target.value }));
  }, 400);

  const next = async () => {
    if (data.has_next && !loading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }

  const handleFavoriteToggled = () => {
    console.log("Favorite toggled on home, refetching page 1...");
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      fetchProducts(1, false);
    }
  }

  return (
    <div className="flex-1">
      <section id="search" className="padding py-4 bg-[#f8f9fa]">
        <div className="wrapper">
          <div className="text-2xl font-bold mb-5">Start Shopping Now!</div>
          
          {/* Display the discount code banner if available */}
          {activeDiscountCode && <DiscountCodeBanner discountCode={activeDiscountCode} />}
          
          <Input placeholder="Search for products..." className="bg-background" onChange={handleSearchChange} />
        </div>
      </section>

      <section id="products" className="w-full wrapper">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.items.map((src) => (
            <ProductCard
              key={src.id}
              {...src}
              onFavoriteToggle={handleFavoriteToggled}
            />
          ))}
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
  );
}
