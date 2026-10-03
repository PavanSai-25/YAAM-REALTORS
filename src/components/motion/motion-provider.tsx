"use client"

import { domAnimation, LazyMotion, MotionConfig } from "motion/react"

/**
 * LazyMotion + `m.*` components keep the animation runtime small.
 * reducedMotion="user" makes every transform animation respect the OS
 * "reduce motion" setting automatically (opacity fades still run).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
