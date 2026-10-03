"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { submitEnquiry } from "@/app/actions/enquiry"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { cn } from "@/lib/utils"
import { enquiryFormSchema, type EnquiryFormInput } from "@/lib/validations/enquiry"

type Source = EnquiryFormInput["source"]

const inputClass =
  "h-11 w-full rounded-lg border border-line bg-white px-3.5 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-brand-accent focus:ring-3 focus:ring-brand-accent/20 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/15"

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-destructive">
      {message}
    </p>
  )
}

export function EnquiryForm({
  source,
  propertyId = null,
  whatsappNumber,
  whatsappMessage,
  submitLabel = "Request a callback",
  messagePlaceholder = "Anything you'd like us to know? (optional)",
  showEmail = false,
  className,
}: {
  source: Source
  propertyId?: string | null
  whatsappNumber: string
  whatsappMessage: string
  submitLabel?: string
  messagePlaceholder?: string
  showEmail?: boolean
  className?: string
}) {
  const [reference, setReference] = useState<string | null>(null)
  const form = useForm<EnquiryFormInput>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: { name: "", phone: "", email: "", message: "", propertyId, source, company: "" },
  })
  const { register, handleSubmit, formState, setError } = form
  const errors = formState.errors

  const onSubmit = handleSubmit(async (values) => {
    const result = await submitEnquiry(values)
    if (result.ok) {
      setReference(result.reference)
      return
    }
    for (const [key, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(key as keyof EnquiryFormInput, { message })
    }
    toast.error(result.error)
  })

  if (reference) {
    return (
      <div className={cn("rounded-xl border border-emerald-200 bg-emerald-50/60 p-5", className)} role="status">
        <p className="flex items-center gap-2 font-semibold text-emerald-900">
          <CheckCircle2 className="size-5" aria-hidden /> Thank you — we&apos;ll call you back.
        </p>
        <p className="mt-1.5 text-sm text-emerald-900/80">
          Your reference is <span className="font-semibold tabular">{reference}</span>. For a faster reply, continue on WhatsApp.
        </p>
        <WhatsAppButton number={whatsappNumber} message={whatsappMessage} reference={reference} label="Continue on WhatsApp" className="mt-4 w-full" />
      </div>
    )
  }

  const id = (name: string) => `${source}-${name}`
  return (
    <form onSubmit={onSubmit} noValidate className={cn("space-y-3.5", className)}>
      <div>
        <label htmlFor={id("name")} className="mb-1.5 block text-sm font-medium text-ink-soft">
          Your name
        </label>
        <input
          id={id("name")}
          autoComplete="name"
          className={inputClass}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? id("name-error") : undefined}
          {...register("name")}
        />
        <FieldError id={id("name-error")} message={errors.name?.message} />
      </div>
      <div>
        <label htmlFor={id("phone")} className="mb-1.5 block text-sm font-medium text-ink-soft">
          Mobile number
        </label>
        <input
          id={id("phone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          className={inputClass}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? id("phone-error") : undefined}
          {...register("phone")}
        />
        <FieldError id={id("phone-error")} message={errors.phone?.message} />
      </div>
      {showEmail && (
        <div>
          <label htmlFor={id("email")} className="mb-1.5 block text-sm font-medium text-ink-soft">
            Email <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <input
            id={id("email")}
            type="email"
            autoComplete="email"
            className={inputClass}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? id("email-error") : undefined}
            {...register("email")}
          />
          <FieldError id={id("email-error")} message={errors.email?.message} />
        </div>
      )}
      <div>
        <label htmlFor={id("message")} className="mb-1.5 block text-sm font-medium text-ink-soft">
          Message <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <textarea
          id={id("message")}
          rows={3}
          placeholder={messagePlaceholder}
          className={cn(inputClass, "h-auto resize-none py-2.5")}
          {...register("message")}
        />
      </div>
      {/* Honeypot: hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input tabIndex={-1} autoComplete="off" {...register("company")} />
        </label>
      </div>
      <button
        type="submit"
        disabled={formState.isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-navy-900 text-sm font-semibold text-white transition-colors hover:bg-brand disabled:opacity-70"
      >
        {formState.isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {formState.isSubmitting ? "Sending…" : submitLabel}
      </button>
      <p className="text-center text-xs text-ink-muted">We only use your details to respond to this enquiry.</p>
    </form>
  )
}
