import "server-only"
import { headers } from "next/headers"

/**
 * Small fixed-window limiter for public endpoints (enquiries, login).
 * In-memory, so on serverless it is per-instance — enough to blunt casual
 * abuse. Swap for a shared store (e.g. Upstash Redis) if traffic grows.
 */
const buckets = new Map<string, { count: number; resetAt: number }>()

export async function clientIp() {
  const h = await headers()
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
}

export async function rateLimit(scope: string, limit: number, windowMs: number) {
  const key = `${scope}:${await clientIp()}`
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k)
    }
    return true
  }
  bucket.count++
  return bucket.count <= limit
}
