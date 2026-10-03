"use client"

import { m, useReducedMotion, useScroll, useTransform } from "motion/react"
import Image from "next/image"
import { useRef } from "react"

/** Full-bleed hero photograph with a gentle parallax drift + slow settle-in zoom. */
export function HeroParallax({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"])

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" aria-hidden={alt === ""}>
      <m.div style={{ y }} className="absolute inset-0 will-change-transform">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="animate-[hero-settle_2.4s_cubic-bezier(0.22,1,0.36,1)_both] object-cover object-[60%_center] motion-reduce:animate-none"
        />
      </m.div>
    </div>
  )
}
