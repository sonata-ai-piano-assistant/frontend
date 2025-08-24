"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

type AvatarProps = React.ComponentPropsWithRef<typeof AvatarPrimitive.Root>
type AvatarImageProps = React.ComponentPropsWithRef<typeof AvatarPrimitive.Image>
type AvatarFallbackProps = React.ComponentPropsWithRef<typeof AvatarPrimitive.Fallback>

const Avatar = (props: AvatarProps) => {
  const { className, ref, ...rest } = props

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...rest}
    />
  )
}
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = (props: AvatarImageProps) => {
  const { className, ref, ...rest } = props
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      {...rest}
    />
  )
}
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = (props: AvatarFallbackProps) => {
  const { className, children, ref } = props
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    >{children}</AvatarPrimitive.Fallback>
  )
}

AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
