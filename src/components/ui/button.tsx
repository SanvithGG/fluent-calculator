import React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-medium select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 active:scale-[0.96] transition-all duration-100 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:brightness-95",
        number:
          "bg-card/90 text-foreground font-semibold border border-border/60 hover:bg-muted/80 active:bg-muted shadow-[0_1px_2px_rgba(0,0,0,0.06)] backdrop-blur-md text-lg",
        operator:
          "bg-secondary/80 text-primary font-semibold border border-border/50 hover:bg-secondary active:bg-secondary/90 shadow-xs text-lg",
        operatorActive:
          "bg-primary/20 text-primary font-bold border-2 border-primary shadow-[0_0_16px_rgba(96,205,255,0.4)] text-lg",
        action:
          "bg-muted/50 text-foreground/90 font-medium border border-border/40 hover:bg-muted/90 active:bg-muted text-sm",
        equals:
          "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-lg shadow-blue-500/30 hover:brightness-110 active:scale-[0.96] text-xl",
        ghost:
          "text-foreground hover:bg-muted/70 active:bg-muted rounded-md",
        outline:
          "border border-border bg-transparent hover:bg-muted/50 active:bg-muted text-foreground",
      },
      size: {
        default: "h-11 px-3 rounded-xl",
        sm: "h-8 px-2 text-xs rounded-lg",
        lg: "h-14 px-4 text-xl rounded-2xl",
        icon: "h-8 w-8 rounded-lg p-0",
        "icon-sm": "h-7 w-7 rounded-md p-0 text-xs",
        keypad: "h-full w-full min-h-[48px] rounded-xl",
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
  badge?: string;
}

export function Button({
  className,
  variant,
  size,
  badge,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
      {badge && (
        <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-muted-foreground/60 select-none">
          {badge}
        </span>
      )}
    </ButtonPrimitive>
  );
}

export { buttonVariants };
