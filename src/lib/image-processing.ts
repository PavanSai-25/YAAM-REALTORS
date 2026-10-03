/**
 * Browser-side image preparation before upload:
 *  - downscale to at most 2400px on the long edge
 *  - re-encode as WebP (JPEG fallback) at ~82% quality
 *  - re-encoding drops EXIF metadata, including phone GPS coordinates
 * Typical phone photos shrink from 4–8 MB to 300–600 KB.
 */
export const MAX_DIMENSION = 2400

export type PreparedImage = { blob: Blob; width: number; height: number; contentType: string }

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) throw new Error("Not an image")
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not supported")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  let blob = await encode("image/webp", 0.82)
  if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", 0.85)
  if (!blob) throw new Error("Could not process image")
  return { blob, width, height, contentType: blob.type }
}

/** PUT with progress events (fetch can't report upload progress). */
export function uploadWithProgress(
  target: { uploadUrl: string; method: string; headers: Record<string, string> },
  blob: Blob,
  onProgress: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(target.method, target.uploadUrl)
    for (const [k, v] of Object.entries(target.headers)) xhr.setRequestHeader(k, v)
    if (!target.headers["content-type"]) xhr.setRequestHeader("content-type", blob.type)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve()
      let message = `Upload failed (${xhr.status})`
      try {
        message = JSON.parse(xhr.responseText).error ?? JSON.parse(xhr.responseText).message ?? message
      } catch {}
      reject(new Error(message))
    }
    xhr.onerror = () => reject(new Error("Network error — check your connection and retry."))
    xhr.send(blob)
  })
}
