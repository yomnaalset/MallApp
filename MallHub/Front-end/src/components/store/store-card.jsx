import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router";
import StorePlaceholder from '@/assets/store-placeholder.png';

const StoreCard = ({ id, name, description, categories, section, logo_url, diamonds }) => {
    // Calculate total diamonds for the store
    const diamondCount = diamonds?.length ? diamonds.reduce((sum, diamond) => sum + diamond.quantity, 0) : 0;
    
    return (
        <Card className="w-full m-w-sm pt-4 hover:-translate-y-2 transition-all relative">
            <CardHeader className='p-0'>
                <Link to={`/stores/${id}/products`}>
                    <div className="w-5/6 min-h-[200px] max-h-[250px] overflow-hidden mx-auto aspect-w-16 aspect-h-8 relative">
                        <img
                            src={logo_url ? logo_url : StorePlaceholder}
                            alt={name}
                            className='aspect-square w-full object-contain'
                        />
                    </div>
                </Link>
            </CardHeader>

            <CardContent className="p-4 pt-0 grid gap-4 min-w-[220px] mt-4">
                <Link to={`/stores/${id}/products`} className="">
                    <div className="flex items-center justify-center mb-4">
                        <h3 className="text-lg font-medium capitalize">{name}</h3>
                        {diamondCount > 0 && (
                            <div className="ml-2 flex items-center bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">
                                <span className="mr-1 text-sm">💎</span>
                                <span className="text-xs font-medium">{diamondCount}</span>
                            </div>
                        )}
                    </div>
                    <Button className="w-full">View Products</Button>
                </Link>
            </CardContent>
        </Card>
    )
}

export default StoreCard;




// {
//     "id": 3,
//         "name": "test",
//             "description": "test",
//                 "categories": [
//                     {
//                         "id": 1,
//                         "name": "Category 1",
//                         "description": "...1"
//                     }
//                 ],
//                     "section": {
//         "id": 1,
//             "name": "Section 1",
//                 "description": "...",
//                     "created_at": "2025-01-29T14:05:38.120450Z",
//                         "updated_at": "2025-01-29T14:05:38.120697Z"
//     },
//     "logo_url": null
// }