import Image from "next/image"
import { cn } from "@/lib/utils"

/** Official architectural skyline emblem. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-emblem.png"
      alt="YAAM Realtors emblem"
      width={48}
      height={32}
      className={cn("h-8 w-auto object-contain shrink-0", className)}
      priority
    />
  )
}

/**
 * Official YAAM REALTORS brand logo without subtitle wording.
 * Automatically adapts between dark background (tone="light") and light background (tone="dark").
 */
export function Logo({
  className,
  tone = "dark",
  compact = false,
}: {
  className?: string
  tone?: "dark" | "light"
  compact?: boolean
}) {
  if (compact) {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <LogoMark className="h-8" />
      </span>
    )
  }

  // tone === "light" -> on dark background (transparent hero, footer, admin sidebar)
  // tone === "dark"  -> on light background (white navbar, login page)
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={tone === "light" ? "/logo-h-dark.png" : "/logo-h-light.png"}
        alt="YAAM REALTORS"
        width={302}
        height={40}
        className="h-9 w-auto object-contain sm:h-10"
        priority
      />
    </span>
  )
}
