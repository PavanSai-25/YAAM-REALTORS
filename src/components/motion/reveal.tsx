"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

/**
 * Scroll reveal driven by CSS (see `.reveal` in globals.css).
 * Content is only hidden under `@media (scripting: enabled)`, so crawlers and
 * no-JS visitors always see it; reduced-motion users get it instantly.
 */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!("IntersectionObserver" in window)) {
      el.dataset.shown = "true"
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).dataset.shown = "true"
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

type DivProps = React.ComponentProps<"div">

export function Reveal({ delay = 0, className, style, children, ...rest }: DivProps & { delay?: number }) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      style={{ ...style, transitionDelay: delay ? `${delay}s` : undefined }}
      {...rest}
    >
      {children}
    </div>
  )
}

/** Children marked <StaggerItem> animate in sequence when the group enters view. */
export function Stagger({ className, children, stagger = 0.08, style, ...rest }: DivProps & { stagger?: number }) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={cn("reveal-group", className)}
      style={{ ...style, ["--stagger" as string]: `${stagger}s` }}
      {...rest}
    >
      {children}
    </div>
  )
}

export function StaggerItem({ className, children, ...rest }: DivProps) {
  return (
    <div className={cn("reveal-item", className)} {...rest}>
      {children}
    </div>
  )
}
