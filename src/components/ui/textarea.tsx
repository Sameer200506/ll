import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:opacity-50 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
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
Textarea.displayName = "Textarea";

export { Textarea };
