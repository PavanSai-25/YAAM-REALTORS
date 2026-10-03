"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ExternalLink, Loader2, Plus, Save, Send, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"
import { saveProperty } from "@/app/actions/properties"
import { ImageUploader } from "@/components/admin/image-uploader"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  AMENITIES,
  AREA_UNIT_LABELS,
  AREA_UNITS,
  CATEGORIES,
  CATEGORY_LABELS,
  FACING,
  FACING_LABELS,
  FURNISHING,
  FURNISHING_LABELS,
  POSSESSION,
  POSSESSION_LABELS,
  PURPOSES,
  PROPERTY_TYPE_LABELS,
  STATUS_LABELS,
  TYPES_BY_CATEGORY,
  type PropertyStatus,
  type Role,
} from "@/config/property-options"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import { propertyInputSchema, type PropertyInput } from "@/lib/validations/property"

type FormIn = z.input<typeof propertyInputSchema>

const SECTIONS = [
  { id: "basic", label: "Basic information" },
  { id: "pricing", label: "Pricing" },
  { id: "location", label: "Location" },
  { id: "details", label: "Property details" },
  { id: "amenities", label: "Amenities & highlights" },
  { id: "media", label: "Photos & media" },
  { id: "publishing", label: "Publishing" },
]

const STAFF_STATUSES: PropertyStatus[] = ["draft", "published", "under_negotiation", "sold", "rented", "archived"]
const NONE = "__none"

/** `<input type=number>` ↔ number | null */
const num = { setValueAs: (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v)) }

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 rounded-xl border border-line bg-white p-5 sm:p-7">
      <h2 id={`${id}-title`} className="text-lg font-semibold">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
  optional,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  className?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-ink-soft">
        {label}
        {optional && <span className="font-normal text-ink-muted"> (optional)</span>}
      </Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export function PropertyForm({
  initial,
  propertyId,
  slug,
  role,
  reviewNotes,
}: {
  initial: PropertyInput
  propertyId: string | null
  slug?: string
  role: Role
  reviewNotes?: string | null
}) {
  const router = useRouter()
  const staff = role !== "seller"
  const [uploading, setUploading] = useState(false)
  const [highlightDraft, setHighlightDraft] = useState("")
  const [customKey, setCustomKey] = useState("")
  const [customValue, setCustomValue] = useState("")

  const form = useForm<FormIn, unknown, PropertyInput>({
    resolver: zodResolver(propertyInputSchema),
    defaultValues: initial,
    mode: "onTouched",
  })
  const { register, control, handleSubmit, setValue, setError, formState } = form
  const errors = formState.errors
  const landmarks = useFieldArray({ control, name: "nearbyLandmarks" })

  const category = useWatch({ control, name: "category" })
  const purpose = useWatch({ control, name: "purpose" })
  const areaUnit = useWatch({ control, name: "areaUnit" })
  const price = useWatch({ control, name: "price" })
  const priceLabel = useWatch({ control, name: "priceLabel" })
  const highlights = useWatch({ control, name: "highlights" }) ?? []
  const customFields = useWatch({ control, name: "customFields" }) ?? {}
  const residential = category === "residential"

  const err = (name: string) => {
    const parts = name.split(".")
    let node: unknown = errors
    for (const p of parts) node = (node as Record<string, unknown> | undefined)?.[p]
    return (node as { message?: string } | undefined)?.message
  }
  const aria = (name: string) => ({
    "aria-invalid": !!err(name),
    "aria-describedby": err(name) ? `${name}-error` : undefined,
  })

  async function submit(values: PropertyInput, statusOverride?: PropertyStatus) {
    if (uploading) {
      toast.error("Please wait for photos to finish uploading.")
      return
    }
    const payload = statusOverride ? { ...values, status: statusOverride } : values
    const result = await saveProperty(propertyId, payload)
    if (!result.ok) {
      for (const [path, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(path as FieldPath<FormIn>, { message })
      }
      toast.error(result.error)
      return
    }
    const { id, status } = result.data
    toast.success(
      status === "published"
        ? "Property published — it's now live on the website."
        : status === "pending_review"
          ? "Submitted for review. We'll let you know once it's approved."
          : "Property saved.",
    )
    if (!propertyId) router.replace(`/admin/properties/${id}/edit?created=1`)
    else router.refresh()
  }

  const onInvalid = () => {
    toast.error("Please fix the highlighted fields.")
    const first = document.querySelector("[aria-invalid=true]") as HTMLElement | null
    first?.focus()
  }

  return (
    <form
      onSubmit={handleSubmit((v) => submit(v), onInvalid)}
      noValidate
      className="grid gap-8 xl:grid-cols-[13rem_minmax(0,1fr)]"
    >
      <nav aria-label="Form sections" className="hidden xl:block">
        <ol className="sticky top-24 space-y-1 border-l border-line">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm text-ink-muted hover:border-brand hover:text-ink">
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="min-w-0 space-y-6 pb-28">
        {reviewNotes && (
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <p className="font-semibold">Reviewer notes</p>
            <p className="mt-1 whitespace-pre-line">{reviewNotes}</p>
          </div>
        )}

        <Section id="basic" title="Basic information">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Title" htmlFor="title" error={err("title")} hint="e.g. Contemporary 4 BHK Villa with Private Pool" className="sm:col-span-2">
              <Input id="title" {...register("title")} {...aria("title")} />
            </Field>
            <Field label="Description" htmlFor="description" error={err("description")} className="sm:col-span-2">
              <Textarea id="description" rows={7} {...register("description")} {...aria("description")} />
            </Field>
            <Field label="Purpose" htmlFor="purpose" error={err("purpose")}>
              <Controller
                control={control}
                name="purpose"
                render={({ field }) => (
                  <div id="purpose" role="radiogroup" aria-label="Purpose" className="grid grid-cols-2 gap-2">
                    {PURPOSES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        role="radio"
                        aria-checked={field.value === p}
                        onClick={() => field.onChange(p)}
                        className={cn(
                          "h-10 rounded-lg border text-sm font-medium",
                          field.value === p ? "border-brand bg-brand-light text-navy-900" : "border-line text-ink-soft hover:border-ink-muted/40",
                        )}
                      >
                        {p === "sale" ? "Sell" : "Rent / Lease"}
                      </button>
                    ))}
                  </div>
                )}
              />
            </Field>
            <Field label="Category" htmlFor="category" error={err("category")}>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v)
                      setValue("propertyType", TYPES_BY_CATEGORY[v as keyof typeof TYPES_BY_CATEGORY][0], { shouldValidate: true })
                      if (v === "land") setValue("areaUnit", "sqyd")
                    }}
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Property type" htmlFor="propertyType" error={err("propertyType")}>
              <Controller
                control={control}
                name="propertyType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="propertyType" className="w-full" {...aria("propertyType")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES_BY_CATEGORY[category ?? "residential"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {PROPERTY_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
        </Section>

        <Section id="pricing" title="Pricing" description={purpose === "rent" ? "Monthly rent in rupees." : "Asking price in rupees."}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={purpose === "rent" ? "Monthly rent (₹)" : "Price (₹)"} htmlFor="price" error={err("price")} hint={price ? `Displays as ${formatPrice({ price: Number(price), priceLabel: null, purpose: purpose ?? "sale" })}` : undefined}>
              <Input id="price" type="number" inputMode="numeric" min={0} step={1000} {...register("price", num)} {...aria("price")} />
            </Field>
            <Field label="Price label" htmlFor="priceLabel" optional error={err("priceLabel")} hint="Overrides the displayed price, e.g. “Price on request”">
              <Input id="priceLabel" {...register("priceLabel", { setValueAs: (v) => (v ? v : null) })} placeholder={priceLabel ? undefined : "Leave empty to show the price"} />
            </Field>
            <label className="flex items-center gap-3 sm:col-span-2">
              <Controller control={control} name="negotiable" render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />} />
              <span className="text-sm text-ink-soft">Price is negotiable</span>
            </label>
          </div>
        </Section>

        <Section id="location" title="Location">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Address" htmlFor="address" optional error={err("address")} hint="Hidden from the public when location is set to approximate." className="sm:col-span-2">
              <Input id="address" {...register("address")} />
            </Field>
            <Field label="Locality" htmlFor="locality" error={err("locality")}>
              <Input id="locality" placeholder="e.g. Sainikpuri" {...register("locality")} {...aria("locality")} />
            </Field>
            <Field label="City" htmlFor="city" error={err("city")}>
              <Input id="city" {...register("city")} {...aria("city")} />
            </Field>
            <Field label="State" htmlFor="state" error={err("state")}>
              <Input id="state" {...register("state")} {...aria("state")} />
            </Field>
            <Field label="Pincode" htmlFor="pincode" optional error={err("pincode")}>
              <Input id="pincode" inputMode="numeric" maxLength={6} {...register("pincode")} {...aria("pincode")} />
            </Field>
            <Field label="Latitude" htmlFor="latitude" optional error={err("latitude")}>
              <Input id="latitude" type="number" step="any" {...register("latitude", num)} {...aria("latitude")} />
            </Field>
            <Field label="Longitude" htmlFor="longitude" optional error={err("longitude")} hint="Tip: right-click the spot in Google Maps to copy coordinates.">
              <Input id="longitude" type="number" step="any" {...register("longitude", num)} {...aria("longitude")} />
            </Field>
            <Field label="Map precision" htmlFor="locationPrecision" className="sm:col-span-2">
              <Controller
                control={control}
                name="locationPrecision"
                render={({ field }) => (
                  <div id="locationPrecision" role="radiogroup" aria-label="Map precision" className="grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        ["approximate", "Approximate area", "Shows a ~1 km area. Exact pin and address stay private."],
                        ["exact", "Exact location", "Shows a pin and the full address publicly."],
                      ] as const
                    ).map(([value, title, desc]) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={field.value === value}
                        onClick={() => field.onChange(value)}
                        className={cn("rounded-lg border p-3 text-left", field.value === value ? "border-brand bg-brand-light" : "border-line hover:border-ink-muted/40")}
                      >
                        <span className="block text-sm font-medium">{title}</span>
                        <span className="mt-0.5 block text-xs text-ink-muted">{desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              />
            </Field>
          </div>
          <div className="mt-6">
            <p className="text-sm font-medium text-ink-soft">Nearby landmarks <span className="font-normal text-ink-muted">(optional)</span></p>
            <ul className="mt-3 space-y-2">
              {landmarks.fields.map((f, i) => (
                <li key={f.id} className="grid grid-cols-[1fr_7rem_auto] gap-2">
                  <Input aria-label={`Landmark ${i + 1} name`} placeholder="e.g. Sainikpuri X Roads" {...register(`nearbyLandmarks.${i}.name`)} {...aria(`nearbyLandmarks.${i}.name`)} />
                  <Input aria-label={`Landmark ${i + 1} distance`} placeholder="1.2 km" {...register(`nearbyLandmarks.${i}.distance`)} />
                  <button type="button" onClick={() => landmarks.remove(i)} className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas hover:text-destructive" aria-label={`Remove landmark ${i + 1}`}>
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => landmarks.append({ name: "", distance: "" })} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
              <Plus className="size-4" aria-hidden /> Add landmark
            </button>
          </div>
        </Section>

        <Section id="details" title="Property details">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Area" htmlFor="area" error={err("area")}>
              <Input id="area" type="number" step="any" min={0} {...register("area", num)} {...aria("area")} />
            </Field>
            <Field label="Area unit" htmlFor="areaUnit">
              <Controller
                control={control}
                name="areaUnit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="areaUnit" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AREA_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {AREA_UNIT_LABELS[u]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Possession" htmlFor="possessionStatus" optional>
              <Controller
                control={control}
                name="possessionStatus"
                render={({ field }) => (
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                    <SelectTrigger id="possessionStatus" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Not specified</SelectItem>
                      {POSSESSION.map((p) => (
                        <SelectItem key={p} value={p}>
                          {POSSESSION_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            {category !== "land" && (
              <>
                {residential && (
                  <Field label="Bedrooms (BHK)" htmlFor="bedrooms" optional error={err("bedrooms")}>
                    <Input id="bedrooms" type="number" min={0} max={20} {...register("bedrooms", num)} {...aria("bedrooms")} />
                  </Field>
                )}
                <Field label="Bathrooms" htmlFor="bathrooms" optional error={err("bathrooms")}>
                  <Input id="bathrooms" type="number" min={0} max={20} {...register("bathrooms", num)} {...aria("bathrooms")} />
                </Field>
                <Field label="Parking spaces" htmlFor="parking" optional error={err("parking")}>
                  <Input id="parking" type="number" min={0} {...register("parking", num)} {...aria("parking")} />
                </Field>
                <Field label="Floor" htmlFor="floor" optional error={err("floor")} hint="0 = ground floor">
                  <Input id="floor" type="number" {...register("floor", num)} {...aria("floor")} />
                </Field>
                <Field label="Total floors" htmlFor="totalFloors" optional error={err("totalFloors")}>
                  <Input id="totalFloors" type="number" min={0} {...register("totalFloors", num)} {...aria("totalFloors")} />
                </Field>
                <Field label="Year built" htmlFor="constructionYear" optional error={err("constructionYear")}>
                  <Input id="constructionYear" type="number" min={1900} max={2100} {...register("constructionYear", num)} {...aria("constructionYear")} />
                </Field>
                <Field label="Furnishing" htmlFor="furnishing" optional>
                  <Controller
                    control={control}
                    name="furnishing"
                    render={({ field }) => (
                      <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                        <SelectTrigger id="furnishing" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Not specified</SelectItem>
                          {FURNISHING.map((f) => (
                            <SelectItem key={f} value={f}>
                              {FURNISHING_LABELS[f]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </>
            )}
            <Field label="Facing" htmlFor="facing" optional>
              <Controller
                control={control}
                name="facing"
                render={({ field }) => (
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                    <SelectTrigger id="facing" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Not specified</SelectItem>
                      {FACING.map((f) => (
                        <SelectItem key={f} value={f}>
                          {FACING_LABELS[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
          {areaUnit !== "sqft" && <p className="mt-3 text-xs text-ink-muted">Area is converted to sq.ft. automatically for search filters.</p>}

          <div className="mt-8">
            <p className="text-sm font-medium text-ink-soft">
              Additional specifications <span className="font-normal text-ink-muted">(optional — e.g. “Khata: Yes”, “Road width: 40 ft”)</span>
            </p>
            {Object.keys(customFields).length > 0 && (
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {Object.entries(customFields).map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span>
                      <span className="text-ink-muted">{k}:</span> {v}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...customFields }
                        delete next[k]
                        setValue("customFields", next, { shouldDirty: true })
                      }}
                      className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted hover:text-destructive"
                      aria-label={`Remove ${k}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input aria-label="Specification name" placeholder="Name" value={customKey} maxLength={60} onChange={(e) => setCustomKey(e.target.value)} />
              <Input aria-label="Specification value" placeholder="Value" value={customValue} maxLength={300} onChange={(e) => setCustomValue(e.target.value)} />
              <button
                type="button"
                onClick={() => {
                  if (!customKey.trim() || !customValue.trim()) return
                  setValue("customFields", { ...customFields, [customKey.trim()]: customValue.trim() }, { shouldDirty: true })
                  setCustomKey("")
                  setCustomValue("")
                }}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:border-brand hover:text-brand"
              >
                <Plus className="size-4" aria-hidden /> Add
              </button>
            </div>
          </div>
        </Section>

        <Section id="amenities" title="Amenities & highlights">
          <Controller
            control={control}
            name="amenities"
            render={({ field }) => (
              <div role="group" aria-label="Amenities" className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {AMENITIES.map((a) => {
                  const checked = field.value?.includes(a.id) ?? false
                  return (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          field.onChange(v ? [...(field.value ?? []), a.id] : (field.value ?? []).filter((x) => x !== a.id))
                        }
                      />
                      {a.label}
                    </label>
                  )
                })}
              </div>
            )}
          />
          <div className="mt-8">
            <Label htmlFor="highlight-input" className="text-ink-soft">
              Highlights <span className="font-normal text-ink-muted">(short selling points, press Enter to add)</span>
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="highlight-input"
                value={highlightDraft}
                maxLength={160}
                placeholder="e.g. Corner plot with two-side road"
                onChange={(e) => setHighlightDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return
                  e.preventDefault()
                  const v = highlightDraft.trim()
                  if (v && !highlights.includes(v) && highlights.length < 20) setValue("highlights", [...highlights, v], { shouldDirty: true })
                  setHighlightDraft("")
                }}
              />
            </div>
            {highlights.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {highlights.map((h) => (
                  <li key={h} className="inline-flex items-center gap-1.5 rounded-full bg-brand-light py-1 pr-1.5 pl-3 text-sm text-navy-900">
                    {h}
                    <button
                      type="button"
                      onClick={() => setValue("highlights", highlights.filter((x) => x !== h), { shouldDirty: true })}
                      className="inline-flex size-5 items-center justify-center rounded-full hover:bg-white"
                      aria-label={`Remove highlight: ${h}`}
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <Section id="media" title="Photos & media" description="The first photo is the cover. Drag photos or use the arrows to reorder.">
          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <ImageUploader value={field.value ?? []} onChange={field.onChange} onBusyChange={setUploading} invalid={!!err("images")} />
            )}
          />
          {err("images") && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{err("images")}</p>}
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Field label="Video URL" htmlFor="videoUrl" optional error={err("videoUrl")} hint="YouTube or other https:// link">
              <Input id="videoUrl" type="url" placeholder="https://" {...register("videoUrl", { setValueAs: (v) => (v ? v : null) })} {...aria("videoUrl")} />
            </Field>
            <Field label="Virtual tour URL" htmlFor="virtualTourUrl" optional error={err("virtualTourUrl")}>
              <Input id="virtualTourUrl" type="url" placeholder="https://" {...register("virtualTourUrl", { setValueAs: (v) => (v ? v : null) })} {...aria("virtualTourUrl")} />
            </Field>
          </div>
        </Section>

        <Section
          id="publishing"
          title="Publishing"
          description={staff ? "Published, under-negotiation, sold and rented listings are visible on the website." : "Yaam reviews every submission before it goes live."}
        >
          {staff ? (
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Status" htmlFor="status">
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...new Set([...STAFF_STATUSES, field.value])].map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s as PropertyStatus]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3">
                <span>
                  <span className="block text-sm font-medium">Featured</span>
                  <span className="block text-xs text-ink-muted">Shown first on the homepage</span>
                </span>
                <Controller control={control} name="featured" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Featured" />} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3">
                <span>
                  <span className="block text-sm font-medium">Verified</span>
                  <span className="block text-xs text-ink-muted">Yaam has checked this listing</span>
                </span>
                <Controller control={control} name="verified" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Verified" />} />
              </label>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Save a draft to keep working on it, or submit it for review when it&apos;s ready.</p>
          )}
        </Section>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur-md lg:left-64">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="hidden text-sm text-ink-muted sm:block" aria-live="polite">
            {uploading ? "Uploading photos…" : formState.isDirty ? "Unsaved changes" : propertyId ? "All changes saved" : "New property"}
          </p>
          <div className="ml-auto flex items-center gap-2">
            {slug && (
              <Link href={`/properties/${slug}`} target="_blank" className="hidden h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink-soft hover:bg-canvas sm:inline-flex">
                Preview <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            )}
            {staff ? (
              <button
                type="submit"
                disabled={formState.isSubmitting || uploading}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-navy-900 disabled:opacity-60"
              >
                {formState.isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
                {propertyId ? "Save changes" : "Create property"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={formState.isSubmitting || uploading}
                  onClick={handleSubmit((v) => submit(v, "draft"), onInvalid)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold hover:border-brand disabled:opacity-60"
                >
                  <Save className="size-4" aria-hidden /> Save draft
                </button>
                <button
                  type="button"
                  disabled={formState.isSubmitting || uploading}
                  onClick={handleSubmit((v) => submit(v, "pending_review"), onInvalid)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-navy-900 disabled:opacity-60"
                >
                  {formState.isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                  Submit for review
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}

