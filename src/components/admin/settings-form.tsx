"use client"

import { Loader2, Plus, Save, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { saveSiteSettings } from "@/app/actions/admin"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SiteSettings } from "@/types/domain"

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter()
  const [s, setS] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [area, setArea] = useState("")

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setS((prev) => ({ ...prev, [key]: value }))

  function field(key: keyof SiteSettings, label: string, opts: { textarea?: boolean; hint?: string; type?: string; full?: boolean } = {}) {
    const id = `s-${key}`
    const value = s[key] as string | number | null
    const err = errors[key]
    const common = {
      id,
      value: value ?? "",
      "aria-invalid": !!err,
      "aria-describedby": err ? `${id}-err` : undefined,
    }
    return (
      <div className={opts.full || opts.textarea ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
        <Label htmlFor={id} className="text-ink-soft">
          {label}
        </Label>
        {opts.textarea ? (
          <Textarea rows={3} {...common} onChange={(e) => set(key, e.target.value as never)} />
        ) : (
          <Input
            type={opts.type ?? "text"}
            {...common}
            onChange={(e) => set(key, (opts.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value) as never)}
          />
        )}
        {err ? (
          <p id={`${id}-err`} role="alert" className="text-xs font-medium text-destructive">
            {err}
          </p>
        ) : opts.hint ? (
          <p className="text-xs text-ink-muted">{opts.hint}</p>
        ) : null}
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await saveSiteSettings(s)
    setSaving(false)
    if (res.ok) {
      setErrors({})
      toast.success("Settings saved. The website is updated.")
      router.refresh()
    } else {
      setErrors(res.fieldErrors ?? {})
      toast.error(res.error)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 pb-24" noValidate>
      <Card title="Business" description="Shown in the header, footer and structured data for search engines.">
        {field("companyName", "Company name")}
        {field("shortName", "Short name")}
        {field("establishedYear", "Established", { type: "number" })}
        {field("contactPerson", "Contact person")}
      </Card>

      <Card title="Contact" description="The WhatsApp number powers every “Chat on WhatsApp” button on the site.">
        {field("whatsappNumber", "WhatsApp number", { hint: "With country code, digits only — e.g. 917993983540" })}
        {field("phone", "Phone (for Call buttons)")}
        {field("email", "Email", { type: "email", hint: "Leave empty to hide" })}
        {field("businessHours", "Business hours", { hint: "Optional, e.g. Mon–Sat, 10am–7pm" })}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="s-address" className="text-ink-soft">
            Address (one line per row)
          </Label>
          <Textarea id="s-address" rows={4} value={s.addressLines.join("\n")} onChange={(e) => set("addressLines", e.target.value.split("\n").filter((l) => l.trim()))} aria-invalid={!!errors.addressLines} />
        </div>
        {field("mapsUrl", "Google Maps link", { full: true })}
      </Card>

      <Card title="Homepage">
        {field("heroHeadline", "Headline", { full: true })}
        {field("heroDescription", "Supporting text", { textarea: true })}
        {field("aboutIntro", "About introduction", { textarea: true, hint: "Used on the homepage and About page." })}
      </Card>

      <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Services</h2>
        <ul className="mt-5 space-y-3">
          {s.services.map((svc, i) => (
            <li key={i} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[14rem_1fr_auto]">
              <Input aria-label={`Service ${i + 1} title`} value={svc.title} onChange={(e) => set("services", s.services.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <Input aria-label={`Service ${i + 1} description`} value={svc.description} onChange={(e) => set("services", s.services.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
              <button type="button" onClick={() => set("services", s.services.filter((_, j) => j !== i))} className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted hover:text-destructive" aria-label={`Remove ${svc.title}`}>
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => set("services", [...s.services, { title: "", description: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
          <Plus className="size-4" aria-hidden /> Add service
        </button>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Areas you work in</h2>
        <p className="mt-1 text-sm text-ink-muted">Listed on the homepage. Only add areas Yaam actively serves.</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {s.serviceAreas.map((a) => (
            <li key={a} className="inline-flex items-center gap-1.5 rounded-full bg-brand-light py-1 pr-1.5 pl-3 text-sm text-navy-900">
              {a}
              <button type="button" onClick={() => set("serviceAreas", s.serviceAreas.filter((x) => x !== a))} className="inline-flex size-5 items-center justify-center rounded-full hover:bg-white" aria-label={`Remove ${a}`}>
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex max-w-sm gap-2">
          <Input
            aria-label="Add an area"
            placeholder="e.g. Kapra"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return
              e.preventDefault()
              const v = area.trim()
              if (v && !s.serviceAreas.includes(v)) set("serviceAreas", [...s.serviceAreas, v])
              setArea("")
            }}
          />
        </div>
      </section>

      <Card title="Social links" description="Leave empty to hide. Must start with https://">
        {(["instagram", "facebook", "youtube", "linkedin"] as const).map((k) => (
          <div key={k} className="space-y-1.5">
            <Label htmlFor={`s-${k}`} className="text-ink-soft capitalize">
              {k}
            </Label>
            <Input id={`s-${k}`} value={s.socials[k]} aria-invalid={!!errors[`socials.${k}`]} onChange={(e) => set("socials", { ...s.socials, [k]: e.target.value })} />
            {errors[`socials.${k}`] && <p className="text-xs font-medium text-destructive">{errors[`socials.${k}`]}</p>}
          </div>
        ))}
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur-md lg:left-64">
        <div className="flex justify-end px-4 py-3 sm:px-6 lg:px-8">
          <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-navy-900 disabled:opacity-60">
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />} Save settings
          </button>
        </div>
      </div>
    </form>
  )
}
