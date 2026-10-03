import type { Metadata } from "next"
import { PageHeader } from "@/components/admin/page-header"
import { SettingsForm } from "@/components/admin/settings-form"
import { requirePageUser } from "@/lib/auth/session"
import { getSiteSettings } from "@/lib/settings"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  await requirePageUser(["admin"], "/admin/settings")
  const settings = await getSiteSettings()
  return (
    <>
      <PageHeader title="Website settings" description="Business details and homepage content. Changes go live as soon as you save." />
      <SettingsForm initial={settings} />
    </>
  )
}
