"use client";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import React from "react";
import { useState } from "react";


const Password = React.forwardRef(
    ({ className, containerClassName = "", ...props }, ref) => {

        const [isVisible, setIsVisible] = useState(false);
        const toggleVisibility = () => setIsVisible((prevState) => !prevState);

        return (
            <div className={`relative ${containerClassName}`}>
                <Input
                    placeholder="Password"
                    type={isVisible ? "text" : "password"}
                    ref={ref}
                    className={className}
                    {...props}
                />
                <button
                    className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 ring-offset-background transition-shadow hover:text-foreground focus-visible:border focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    onClick={toggleVisibility}
                    aria-label={isVisible ? "Hide password" : "Show password"}
                    aria-pressed={isVisible}
                    aria-controls="password"
                >
                    {isVisible ? (
                        <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
                    ) : (
                        <Eye size={16} strokeWidth={2} aria-hidden="true" />
                    )}
                </button>
            </div>
        )
    }
)

Password.displayName = "Password"

export { Password }

