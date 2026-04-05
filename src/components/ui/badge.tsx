import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent text-white",
        secondary: "border-transparent",
        outline: "",
        success: "border-transparent text-white",
        warning: "border-transparent text-white",
        danger: "border-transparent text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  const defaultStyle =
    variant === "default" || !variant
      ? { background: "var(--accent)", ...style }
      : variant === "secondary"
      ? { background: "var(--surface-2)", color: "var(--text-secondary)", ...style }
      : variant === "success"
      ? { background: "var(--success)", ...style }
      : variant === "warning"
      ? { background: "var(--warning)", ...style }
      : variant === "danger"
      ? { background: "var(--danger)", ...style }
      : style;

  return (
    <div className={cn(badgeVariants({ variant }), className)} style={defaultStyle} {...props} />
  );
}

export { Badge, badgeVariants };
