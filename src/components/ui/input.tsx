import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border px-4 py-2 text-sm outline-none transition-all duration-200 placeholder:opacity-50 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
