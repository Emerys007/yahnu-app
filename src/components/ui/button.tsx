
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group relative inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-[background-color,color,border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/20",
        outline:
          "border border-input bg-card/80 hover:border-primary/35 hover:bg-primary/[0.08] hover:text-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        terra: "bg-terra text-terra-foreground shadow-sm hover:bg-terra/88 hover:shadow-md",
        gooey: "relative overflow-hidden border border-input bg-transparent text-primary transition-colors duration-300 before:absolute before:left-0 before:top-0 before:-z-10 before:h-full before:w-0 before:bg-primary before:transition-all before:duration-300 before:content-[''] hover:text-white hover:before:w-full",
      },
      size: {
        default: "h-11 px-4 py-2 [&_svg]:size-4",
        sm: "h-9 rounded-md px-3 [&_svg]:size-4",
        xs: "h-8 rounded-sm px-2 [&_svg]:size-3.5",
        lg: "h-12 rounded-xl px-7 text-base [&_svg]:size-5",
        icon: "h-11 w-11 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
