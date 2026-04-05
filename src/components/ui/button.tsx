import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "text-white shadow hover:opacity-90 active:scale-95",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:scale-95",
        outline: "border bg-transparent hover:opacity-80 active:scale-95",
        secondary: "hover:opacity-80 active:scale-95",
        ghost: "hover:opacity-80 active:scale-95",
        link: "underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, style, ...props }, ref) => {
    const defaultStyle =
      variant === "default" || !variant
        ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))", ...style }
        : variant === "outline"
        ? { borderColor: "var(--border)", color: "var(--text-primary)", ...style }
        : variant === "secondary"
        ? { background: "var(--surface-2)", color: "var(--text-primary)", ...style }
        : variant === "ghost"
        ? { color: "var(--text-secondary)", ...style }
        : style;

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={defaultStyle}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
