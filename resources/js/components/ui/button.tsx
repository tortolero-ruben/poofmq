import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
  {
    variants: {
      variant: {
        default:
          "border-4 border-[#FFBF00] bg-[#FFBF00] text-black hover:bg-transparent hover:text-[#FFBF00]",
        destructive:
          "border-4 border-white bg-red-600 text-white hover:bg-red-500",
        outline:
          "border-4 border-white bg-transparent text-white hover:bg-white hover:text-black",
        secondary:
          "border-4 border-white bg-[#000033] text-white hover:bg-[#FFBF00] hover:text-black",
        ghost:
          "border-4 border-white/20 text-white/50 hover:border-white/40 hover:text-white",
        link:
          "text-[#FFBF00] underline-offset-4 hover:underline border-0",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-4 py-1 text-xs",
        lg: "h-12 px-8 py-3 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
