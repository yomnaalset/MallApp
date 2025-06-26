import { DiamondIcon } from 'lucide-react';

export function ProductCard({
  product,
  store,
  variant = "default",
  className,
  aspectRatio = "square",
  width,
  height,
  ...props
}) {
  // Calculate points - typically 1 point per $10 spent
  const pointsEarnable = Math.floor((product.price / 10) * 100) / 100;
  
  return (
    <div className={cn("group relative overflow-hidden rounded-md", className)} {...props}>
      <Link
        href={`/store/${store.id}/product/${product.id}`}
        className="relative block"
      >
        <AspectRatio ratio={aspectRatio} className="bg-muted">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover transition-all hover:scale-105"
          />
        </AspectRatio>
        {product.isNew && (
          <Badge className="absolute left-2 top-2">New</Badge>
        )}
      </Link>
      <div className="flex flex-col space-y-1.5 p-3">
        <Link
          href={`/store/${store.id}/product/${product.id}`}
          className="font-semibold line-clamp-1"
        >
          {product.name}
        </Link>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
          <div className="flex items-center text-sm text-muted-foreground">
            <DiamondIcon className="h-3.5 w-3.5 mr-1 text-primary" />
            <span>{pointsEarnable} pts</span>
          </div>
        </div>
        {variant === "default" && (
          <div className="flex items-center justify-between pt-2">
            <StarRating rating={product.rating} />
            <Button size="sm" onClick={(e) => handleAddToCart(e)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 