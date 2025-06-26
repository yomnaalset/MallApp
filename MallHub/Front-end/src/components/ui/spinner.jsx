import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const Spinner = ({ 
  className, 
  size = "default",
  ...props 
}) => {
  const sizeClass = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  }[size];

  return (
    <Loader2 
      className={cn(
        "animate-spin text-muted-foreground", 
        sizeClass,
        className
      )} 
      {...props} 
    />
  );
}; 