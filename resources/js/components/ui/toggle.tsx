import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] focus-visible:ring-offset-2 focus-visible:ring-offset-black",
  {
    variants: {
      variant: {
        default: "border-4 border-white bg-transparent text-white hover:bg-white/10 data-[state=on]:bg-[#FFBF00] data-[state=on]:text-black data-[state=on]:border-[#FFBF00]",
        outline:
          "border-4 border-white/40 bg-transparent text-white/70 hover:border-white hover:text-white data-[state=on]:bg-[#FFBF00] data-[state=on]:text-black data-[state=on]:border-[#FFBF00]",
      },
      size: {
        default: "h-10 px-4 min-w-10",
        sm: "h-8 px-3 min-w-8 text-xs",
        lg: "h-12 px-6 min-w-12 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
