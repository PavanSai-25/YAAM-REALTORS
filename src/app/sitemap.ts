import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/config/site"
import { getPublicStore } from "@/lib/data"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/properties"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/properties?purpose=sale"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/properties?purpose=rent"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/properties?category=commercial"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/properties?category=land"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/services"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/list-property"), changeFrequency: "monthly", priority: 0.6 },
  ]
  try {
    const entries = await getPublicStore().properties.listSitemapEntries()
    return [
      ...staticPages,
      ...entries.map((e) => ({
        url: absoluteUrl(`/properties/${e.slug}`),
        lastModified: new Date(e.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ]
  } catch {
    return staticPages
  }
}
