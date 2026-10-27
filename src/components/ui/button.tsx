import React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-medium select-none transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:brightness-95",
        number:
          "bg-card text-foreground font-semibold border border-border/60 hover:bg-muted/70 active:bg-muted/90 shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-lg",
        operator:
          "bg-secondary/70 text-secondary-foreground font-medium border border-border/40 hover:bg-secondary active:bg-secondary/90 text-lg",
        action:
          "bg-muted/40 text-foreground font-medium border border-border/30 hover:bg-muted/80 active:bg-muted text-sm",
        accent:
          "bg-primary text-primary-foreground font-bold shadow-md hover:brightness-105 active:brightness-95 text-xl",
        ghost:
          "text-foreground hover:bg-muted/70 active:bg-muted rounded-md",
        outline:
          "border border-border bg-transparent hover:bg-muted/50 active:bg-muted text-foreground",
      },
      size: {
        default: "h-11 px-3 rounded-lg",
        sm: "h-8 px-2 text-xs rounded-md",
        lg: "h-14 px-4 text-xl rounded-xl",
        icon: "h-8 w-8 rounded-md p-0",
        "icon-sm": "h-7 w-7 rounded-md p-0 text-xs",
        keypad: "h-full w-full min-h-[46px] rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  className?: string;
}

export function Button({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  );
}

export { buttonVariants };
