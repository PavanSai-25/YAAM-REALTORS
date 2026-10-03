"use client"

import { ChevronLeft, ChevronRight, Images, X } from "lucide-react"
import { AnimatePresence, m } from "motion/react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { PropertyImage } from "@/types/domain"

export function PropertyGallery({ images, title, badges }: { images: PropertyImage[]; title: string; badges?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(0)
  const [mobileIndex, setMobileIndex] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)

  const count = images.length
  const go = useCallback(
    (delta: number) => {
      setDir(delta)
      setIndex((i) => (i + delta + count) % count)
    },
    [count],
  )
  const openAt = (i: number) => {
    setDir(0)
    setIndex(i)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, go])

  if (!count) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-canvas text-sm text-ink-muted">
        Photos coming soon
      </div>
    )
  }

  const alt = (img: PropertyImage, i: number) => img.alt || `${title} — photo ${i + 1}`
  const side = images.slice(1, 5)

  return (
    <>
      {/* Mobile: swipeable strip */}
      <div className="relative -mx-4 sm:-mx-6 md:hidden">
        <div
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget
            setMobileIndex(Math.round(el.scrollLeft / el.clientWidth))
          }}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => openAt(i)}
              className="relative aspect-[4/3] w-full shrink-0 snap-center"
              aria-label={`Open photo ${i + 1} of ${count}`}
            >
              <Image src={img.url} alt={alt(img, i)} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute top-3 left-4 flex flex-wrap gap-1.5">{badges}</div>
        <span className="absolute right-4 bottom-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white tabular">
          {mobileIndex + 1} / {count}
        </span>
      </div>

      {/* Desktop: mosaic */}
      <div
        className={cn(
          "relative hidden gap-2 overflow-hidden rounded-2xl md:grid",
          side.length >= 2 ? "h-[min(34rem,60vh)] grid-cols-4 grid-rows-2" : "aspect-[16/8] grid-cols-1",
        )}
      >
        <button
          type="button"
          onClick={() => openAt(0)}
          className={cn("group/g relative overflow-hidden", side.length >= 2 && "col-span-2 row-span-2")}
          aria-label="Open photo gallery"
        >
          <Image
            src={images[0].url}
            alt={alt(images[0], 0)}
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover/g:scale-[1.03]"
          />
        </button>
        {side.length >= 2 &&
          side.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => openAt(i + 1)}
              className={cn("group/g relative overflow-hidden", side.length === 2 && "row-span-2", side.length === 3 && i === 0 && "row-span-2")}
              aria-label={`Open photo ${i + 2} of ${count}`}
            >
              <Image
                src={img.url}
                alt={alt(img, i + 1)}
                fill
                sizes="25vw"
                className="object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover/g:scale-[1.04]"
              />
            </button>
          ))}
        <div className="pointer-events-none absolute top-4 left-4 flex flex-wrap gap-1.5">{badges}</div>
        <button
          type="button"
          onClick={() => openAt(0)}
          className="absolute right-4 bottom-4 inline-flex h-10 items-center gap-2 rounded-lg bg-white/95 px-4 text-sm font-semibold text-navy-900 shadow-lift transition-colors hover:bg-white"
        >
          <Images className="size-4" aria-hidden /> View all {count} photos
        </button>
      </div>

      {/* Fullscreen lightbox */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 block h-dvh w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-navy-950/97 p-0 text-white ring-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">{title} — photos</DialogTitle>
          <DialogDescription className="sr-only">Use the left and right arrow keys to move between photos.</DialogDescription>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
              <p className="text-sm text-white/70 tabular" aria-live="polite">
                {index + 1} / {count}
              </p>
              <p className="hidden max-w-[50%] truncate text-sm font-medium sm:block">{title}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Close gallery"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence initial={false} custom={dir} mode="popLayout">
                <m.div
                  key={images[index].id}
                  custom={dir}
                  initial={{ opacity: 0, x: dir * 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -60 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60) go(1)
                    else if (info.offset.x > 60) go(-1)
                  }}
                  className="absolute inset-0 px-2 sm:px-20"
                >
                  <Image
                    src={images[index].url}
                    alt={alt(images[index], index)}
                    fill
                    sizes="100vw"
                    quality={85}
                    className="pointer-events-none object-contain"
                  />
                </m.div>
              </AnimatePresence>
              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    className="absolute top-1/2 left-3 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 sm:inline-flex"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    className="absolute top-1/2 right-3 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 sm:inline-flex"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="size-6" />
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none] sm:justify-center sm:px-6">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    setDir(i > index ? 1 : -1)
                    setIndex(i)
                  }}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden rounded-md opacity-50 ring-2 ring-transparent transition",
                    i === index && "opacity-100 ring-white",
                  )}
                >
                  <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

