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
  const hasBg = className && /\bbg-\S+/.test(className);
  
  // Helper to determine if className has a text color class (excluding text size classes)
  const hasTextColor = React.useMemo(() => {
    if (!className) return false;
    const matches = className.match(/\btext-\S+/g);
    if (!matches) return false;
    const sizePattern = /^text-(xs|sm|base|md|lg|xl|[2-9]xl|\[\d+(?:px|rem|em|pt)\])$/;
    return matches.some(m => !sizePattern.test(m));
  }, [className]);

  let inlineStyle: React.CSSProperties = { ...style };

  if (variant === "default" || !variant) {
    if (!hasBg) inlineStyle.background = "var(--accent)";
  } else if (variant === "secondary") {
    if (!hasBg) inlineStyle.background = "var(--surface-2)";
    if (!hasTextColor) inlineStyle.color = "var(--text-secondary)";
  } else if (variant === "success") {
    if (!hasBg) inlineStyle.background = "var(--success)";
  } else if (variant === "warning") {
    if (!hasBg) inlineStyle.background = "var(--warning)";
  } else if (variant === "danger") {
    if (!hasBg) inlineStyle.background = "var(--danger)";
  }

  return (
    <div className={cn(badgeVariants({ variant }), className)} style={inlineStyle} {...props} />
  );
}

export { Badge, badgeVariants };
