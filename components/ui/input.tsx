import * as React from "react"

import { cn } from "@/lib/utils"
import { useController, UseControllerProps } from "react-hook-form"

type InputProps = React.ComponentPropsWithRef<"input"> & UseControllerProps<any>

const Input = (props: InputProps) => {
  const { className, type, ref, name, control } = props
  const { field, fieldState } = useController({ name, control })
  const {invalid } = fieldState;

  return (
    <div>
      <input
        {...field}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
          invalid && "border-red-600"
        )}
        ref={ref}
        {...props}
      />
    </div>
  )
}
Input.displayName = "Input"

export { Input }
