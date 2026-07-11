import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Localoom's signature button: a hard-edged slanted parallelogram with a solid
// offset shadow (no blur, no rounding). The button element is skewed; an inner
// span counter-skews so the label/icons stay upright and `justify-*` / `w-full`
// keep working. Pressing nudges the button into its shadow.
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center -skew-x-9 whitespace-nowrap border border-transparent text-sm font-medium transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[3px_3px_0_0_#000] hover:bg-primary/90 hover:shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        outline:
          "border-border bg-background shadow-[3px_3px_0_0_#000] hover:bg-muted hover:text-foreground hover:shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:bg-input/20 aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[3px_3px_0_0_#000] hover:bg-secondary/80 hover:shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/15 text-destructive shadow-[3px_3px_0_0_#000] hover:bg-destructive/25 hover:shadow-[2px_2px_0_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        link: "skew-x-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5",
        xs: "h-6 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-4",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
  variant = "default",
  size = "default",
  straight = false,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    // Opt out of the slanted parallelogram look: a plain rounded rectangle that
    // matches input fields. Use for buttons that sit inline with an <Input/>,
    // where the skew reads as odd next to the straight field.
    straight?: boolean
  }) {
  const skewed = variant !== "link" && !straight
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size }),
        straight &&
          "skew-x-0 rounded-lg shadow-none hover:shadow-none active:translate-x-0 active:translate-y-0",
        className
      )}
      {...props}
    >
      {/* Counter-skew so content sits upright inside the slanted button. Straight
          and `link` buttons aren't skewed, so their content isn't either. */}
      <span
        className={cn(
          "inline-flex items-center justify-center gap-1.5",
          skewed && "skew-x-9"
        )}
      >
        {children}
      </span>
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
