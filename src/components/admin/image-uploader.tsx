"use client"

import { AlertCircle, ArrowLeft, ArrowRight, ImagePlus, Loader2, RotateCw, Star, Trash2, UploadCloud } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { requestUploadTargets } from "@/app/actions/properties"
import { prepareImage, uploadWithProgress } from "@/lib/image-processing"
import { cn } from "@/lib/utils"
import type { PropertyImage } from "@/types/domain"

type Pending = {
  key: string
  file: File
  preview: string
  progress: number
  stage: "processing" | "uploading" | "failed"
  error?: string
}

const MAX_IMAGES = 40

export function ImageUploader({
  value,
  onChange,
  onBusyChange,
  invalid,
}: {
  value: PropertyImage[]
  onChange: (images: PropertyImage[]) => void
  onBusyChange?: (busy: boolean) => void
  invalid?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  // Parallel uploads finish asynchronously: append to the latest list, not a stale render's.
  const latest = useRef(value)
  useEffect(() => {
    latest.current = value
  }, [value])

  const commit = (images: PropertyImage[]) => {
    const next = images.map((img, position) => ({ ...img, position }))
    latest.current = next
    onChange(next)
  }

  const updatePending = (key: string, patch: Partial<Pending>) =>
    setPending((list) => list.map((p) => (p.key === key ? { ...p, ...patch } : p)))

  async function uploadOne(item: Pending) {
    try {
      updatePending(item.key, { stage: "processing", progress: 0, error: undefined })
      const prepared = await prepareImage(item.file)
      const res = await requestUploadTargets([{ contentType: prepared.contentType, size: prepared.blob.size }])
      if (!res.ok) throw new Error(res.error)
      const target = res.data[0]
      updatePending(item.key, { stage: "uploading" })
      await uploadWithProgress(target, prepared.blob, (f) => updatePending(item.key, { progress: f }))
      const image: PropertyImage = {
        id: crypto.randomUUID(),
        url: target.publicUrl,
        storagePath: target.storagePath,
        alt: "",
        width: prepared.width,
        height: prepared.height,
        position: latest.current.length,
      }
      commit([...latest.current, image])
      setPending((list) => list.filter((p) => p.key !== item.key))
      URL.revokeObjectURL(item.preview)
    } catch (err) {
      updatePending(item.key, { stage: "failed", error: err instanceof Error ? err.message : "Upload failed" })
    }
  }

  async function addFiles(files: FileList | File[]) {
    const images = [...files].filter((f) => f.type.startsWith("image/"))
    if (!images.length) {
      toast.error("Please choose image files (JPEG, PNG, WebP or HEIC converted to JPEG).")
      return
    }
    const room = MAX_IMAGES - value.length - pending.length
    if (room <= 0) {
      toast.error(`A listing can have up to ${MAX_IMAGES} photos.`)
      return
    }
    const items: Pending[] = images.slice(0, room).map((file) => ({
      key: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      stage: "processing",
    }))
    setPending((list) => [...list, ...items])
    onBusyChange?.(true)
    // Upload three at a time to keep phones responsive.
    const queue = [...items]
    await Promise.all(
      Array.from({ length: Math.min(3, queue.length) }, async () => {
        while (queue.length) await uploadOne(queue.shift()!)
      }),
    )
    onBusyChange?.(false)
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= value.length || from === to) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    commit(next)
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (dragIndex !== null) return
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (dragIndex !== null) return
          e.preventDefault()
          setDragOver(false)
          void addFiles(e.dataTransfer.files)
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-brand bg-brand-light" : invalid ? "border-destructive/50 bg-destructive/5" : "border-line bg-canvas",
        )}
      >
        <UploadCloud className="size-8 text-brand" aria-hidden />
        <p className="mt-3 text-sm font-medium text-ink">Drag photos here, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 inline-flex h-9 items-center gap-2 rounded-lg bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-brand"
        >
          <ImagePlus className="size-4" aria-hidden /> Choose photos
        </button>
        <p className="mt-3 text-xs text-ink-muted">
          JPEG, PNG or WebP · resized to 2400px and optimised automatically · up to {MAX_IMAGES} photos
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {(value.length > 0 || pending.length > 0) && (
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" aria-label="Property photos">
          {value.map((img, i) => (
            <li
              key={img.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (dragIndex !== null) move(dragIndex, i)
                setDragIndex(null)
              }}
              className={cn(
                "group/img overflow-hidden rounded-lg border bg-white transition-shadow",
                i === 0 ? "border-brand ring-2 ring-brand/20" : "border-line",
                dragIndex === i && "opacity-50",
              )}
            >
              <div className="relative aspect-[4/3] cursor-grab bg-canvas active:cursor-grabbing">
                <Image src={img.url} alt={img.alt || `Photo ${i + 1}`} fill sizes="240px" className="object-cover" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-[0.65rem] font-bold tracking-wide text-white uppercase">
                    <Star className="size-3 fill-current" aria-hidden /> Cover
                  </span>
                )}
              </div>
              <div className="space-y-2 p-2.5">
                <label className="sr-only" htmlFor={`alt-${img.id}`}>
                  Description of photo {i + 1}
                </label>
                <input
                  id={`alt-${img.id}`}
                  value={img.alt}
                  onChange={(e) => commit(value.map((v) => (v.id === img.id ? { ...v, alt: e.target.value } : v)))}
                  placeholder="Describe photo (e.g. Living room)"
                  maxLength={200}
                  className="h-8 w-full rounded-md border border-line px-2 text-xs outline-none focus:border-brand-accent"
                />
                <div className="flex items-center justify-between gap-1">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="inline-flex size-7 items-center justify-center rounded-md text-ink-soft hover:bg-canvas disabled:opacity-30" aria-label={`Move photo ${i + 1} earlier`}>
                      <ArrowLeft className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} className="inline-flex size-7 items-center justify-center rounded-md text-ink-soft hover:bg-canvas disabled:opacity-30" aria-label={`Move photo ${i + 1} later`}>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {i !== 0 && (
                      <button type="button" onClick={() => move(i, 0)} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-brand hover:bg-brand-light" aria-label={`Set photo ${i + 1} as cover`}>
                        <Star className="size-3" aria-hidden /> Cover
                      </button>
                    )}
                    <button type="button" onClick={() => commit(value.filter((v) => v.id !== img.id))} className="inline-flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10" aria-label={`Remove photo ${i + 1}`}>
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.key} className={cn("overflow-hidden rounded-lg border bg-white", p.stage === "failed" ? "border-destructive/40" : "border-line")}>
              <div className="relative aspect-[4/3] bg-canvas">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={p.preview} alt="" className={cn("size-full object-cover", p.stage !== "failed" && "opacity-60")} />
                <div className="absolute inset-0 flex items-center justify-center">
                  {p.stage === "failed" ? (
                    <AlertCircle className="size-7 text-destructive" aria-hidden />
                  ) : (
                    <Loader2 className="size-6 animate-spin text-navy-900" aria-hidden />
                  )}
                </div>
              </div>
              <div className="p-2.5" aria-live="polite">
                {p.stage === "failed" ? (
                  <>
                    <p className="line-clamp-2 text-xs font-medium text-destructive">{p.error}</p>
                    <div className="mt-2 flex gap-1">
                      <button type="button" onClick={() => void uploadOne(p)} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-brand hover:bg-brand-light">
                        <RotateCw className="size-3" aria-hidden /> Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(p.preview)
                          setPending((l) => l.filter((x) => x.key !== p.key))
                        }}
                        className="inline-flex h-7 items-center rounded-md px-2 text-xs font-medium text-ink-soft hover:bg-canvas"
                      >
                        Dismiss
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-ink-muted">{p.stage === "processing" ? "Optimising…" : `Uploading ${Math.round(p.progress * 100)}%`}</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvas" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.progress * 100)} aria-label="Upload progress">
                      <div className="h-full rounded-full bg-brand transition-[width] duration-200" style={{ width: `${Math.max(4, p.progress * 100)}%` }} />
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
