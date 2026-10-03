import "server-only"
import { cache } from "react"
import { DEFAULT_SITE_SETTINGS } from "@/config/site"
import { getPublicStore } from "@/lib/data"
import { siteSettingsSchema } from "@/lib/validations/settings"
import type { SiteSettings } from "@/types/domain"

/**
 * Business settings = defaults (config/site.ts + env) overlaid with whatever
 * the admin saved in /admin/settings. Invalid stored values fall back to the
 * defaults field-by-field rather than breaking the site.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  let stored: Partial<SiteSettings> | null = null
  try {
    stored = await getPublicStore().getSettings()
  } catch (err) {
    console.error("[settings] falling back to defaults:", err)
  }
  if (!stored) return DEFAULT_SITE_SETTINGS
  const merged = { ...DEFAULT_SITE_SETTINGS, ...stored, socials: { ...DEFAULT_SITE_SETTINGS.socials, ...stored.socials } }
  const parsed = siteSettingsSchema.safeParse(merged)
  if (parsed.success) return parsed.data
  const result = { ...merged }
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof SiteSettings
    if (key) (result as Record<string, unknown>)[key] = DEFAULT_SITE_SETTINGS[key]
  }
  return result
})
