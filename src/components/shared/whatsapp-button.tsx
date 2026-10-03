"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { WhatsAppIcon } from "@/components/shared/icons"
import { cn } from "@/lib/utils"
import { generateEnquiryReference, whatsappUrl, whatsappWebUrl } from "@/lib/whatsapp"

const styles = cva(
  "group/wa inline-flex shrink-0 items-center justify-center gap-2 font-semibold whitespace-nowrap transition-[background-color,transform,box-shadow] duration-200 outline-none focus-visible:ring-3 focus-visible:ring-whatsapp/40 active:translate-y-px",
  {
    variants: {
      variant: {
        solid: "bg-whatsapp text-white shadow-[0_6px_16px_-6px_rgb(18_140_74/0.6)] hover:bg-whatsapp-hover",
        outline: "border border-whatsapp/30 bg-white text-whatsapp hover:border-whatsapp hover:bg-whatsapp/5",
        ghost: "text-whatsapp hover:bg-whatsapp/8",
        light: "bg-white text-navy-900 hover:bg-brand-light",
      },
      size: {
        sm: "h-9 rounded-lg px-3 text-sm",
        md: "h-11 rounded-lg px-4 text-sm",
        lg: "h-13 rounded-xl px-6 text-[0.95rem]",
        icon: "size-10 rounded-full",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
)

type Props = VariantProps<typeof styles> & {
  number: string
  /** Pre-filled text. A reference code is appended so chats can be matched to CRM leads. */
  message: string
  propertyId?: string | null
  label?: string
  className?: string
  /** Record the tap as an enquiry (default true). */
  track?: boolean
  /** Reuse an existing lead reference (e.g. after a form submit) instead of creating a new lead. */
  reference?: string
}

function isDesktop() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches && window.innerWidth >= 1024
}

export function WhatsAppButton({
  number,
  message,
  propertyId = null,
  label = "Chat on WhatsApp",
  variant,
  size,
  className,
  track = true,
  reference: existingReference,
}: Props) {
  const fallbackHref = whatsappUrl(number, message)

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    // Let modified clicks (new tab etc.) use the plain link.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()

    const reference = existingReference ?? generateEnquiryReference()
    const text = `${message}\n\n(Ref: ${reference})`
    const url = isDesktop() ? whatsappWebUrl(number, text) : whatsappUrl(number, text)

    if (track && !existingReference) {
      const body = JSON.stringify({ reference, propertyId })
      const sent = navigator.sendBeacon?.("/api/enquiries/whatsapp", new Blob([body], { type: "application/json" }))
      if (!sent) {
        void fetch("/api/enquiries/whatsapp", {
          method: "POST",
          body,
          headers: { "content-type": "application/json" },
          keepalive: true,
        }).catch(() => undefined)
      }
    }

    const win = window.open(url, "_blank", "noopener,noreferrer")
    if (!win) window.location.href = url
  }

  return (
    <a
      href={fallbackHref}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(styles({ variant, size }), className)}
      aria-label={size === "icon" ? label : undefined}
    >
      <WhatsAppIcon className={cn(size === "lg" ? "size-5" : "size-[1.15rem]", "transition-transform duration-300 group-hover/wa:scale-110")} />
      {size !== "icon" && <span>{label}</span>}
    </a>
  )
}
