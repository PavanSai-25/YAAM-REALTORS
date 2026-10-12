"use client"

import { m, useReducedMotion, useScroll, useTransform } from "motion/react"
import Image from "next/image"
import { useRef } from "react"

import { useEffect, useState } from "react"

/** Full-bleed hero video or photograph with zero-lag smooth playback and gentle parallax. */
export function HeroParallax({
  src,
  videoSrc,
  alt,
}: {
  src: string
  videoSrc?: string
  alt: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"])
  const [videoActive, setVideoActive] = useState(false)

  useEffect(() => {
    if (reduce && videoRef.current) {
      videoRef.current.pause()
    }
  }, [reduce])

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden [contain:paint]" aria-hidden={alt === ""}>
      <m.div style={{ y }} className="absolute inset-0 will-change-transform">
        {/* Instant SSR / first-paint poster image */}
        <Image
          src={src}
          alt={alt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className={`object-cover object-[60%_center] transition-opacity duration-700 ease-out ${
            videoActive ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        />

        {videoSrc && !reduce && (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={src}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            onPlaying={() => setVideoActive(true)}
            style={{
              transform: "translate3d(0, 0, 0)",
              backfaceVisibility: "hidden",
            }}
            className={`absolute inset-0 size-full object-cover object-[60%_center] transition-opacity duration-700 ease-out ${
              videoActive ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </m.div>
    </div>
  )
}
