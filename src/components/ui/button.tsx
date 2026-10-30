import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap outline-none select-none transition-all duration-150 ease-(--ease-out) focus-visible:ring-2 focus-visible:ring-brand/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        control:
          "border-hairline bg-surface text-fg hover:bg-hover hover:border-fg-2/30 shadow-2xs hover:shadow-xs aria-expanded:bg-hover data-[state=open]:bg-hover",
        brand: "accent-surface text-white hover:brightness-110 shadow-2xs hover:shadow-xs active:brightness-95",
        default: "bg-brand text-white hover:bg-brand-strong hover:shadow-xs active:bg-brand-strong/90",
        outline:
          "border-hairline bg-surface text-fg hover:bg-hover hover:border-fg-2/40 shadow-2xs hover:shadow-xs aria-expanded:bg-hover",
        secondary: "bg-surface-2/60 text-fg hover:bg-hover active:bg-selected",
        ghost: "text-fg-2 hover:bg-hover hover:text-fg active:bg-selected aria-expanded:bg-hover aria-expanded:text-fg",
        destructive:
          "bg-[var(--status-danger-tint)] text-danger hover:bg-danger/15 active:bg-danger/20 border border-danger/20 focus-visible:ring-destructive/30",
        link: "text-brand underline underline-offset-2 hover:text-brand-strong",
      },
      size: {
        default: "h-[30px] gap-1.5 px-[11px]",
        sm: "h-7 gap-1.5 px-[8px] text-[11px]",
        lg: "h-9 gap-2 px-3.5 text-sm",
        icon: "size-[30px]",
        "icon-sm": "size-7",
        "icon-xs": "size-6",
        "icon-lg": "size-8",
      },
    },
    defaultVariants: {
      variant: "control",
      size: "default",
    },
  }
);

// Bouton générique du système avec états hover/active tactiles
function Button({
  className,
  variant = "control",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
