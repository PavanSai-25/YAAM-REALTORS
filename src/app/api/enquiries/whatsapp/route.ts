import { NextResponse } from "next/server"
import { getPublicStore } from "@/lib/data"
import { rateLimit } from "@/lib/rate-limit"
import { whatsappClickSchema } from "@/lib/validations/enquiry"

/**
 * Receives the beacon fired when a visitor taps "Chat on WhatsApp". Creates an
 * anonymous NEW enquiry carrying the reference code that is also in the
 * WhatsApp message, so staff can match the chat to the lead in the CRM.
 */
export async function POST(request: Request) {
  if (!(await rateLimit("wa-click", 20, 60_000))) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const parsed = whatsappClickSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  try {
    await getPublicStore().createEnquiry({
      reference: parsed.data.reference,
      propertyId: parsed.data.propertyId,
      name: null,
      phone: null,
      email: null,
      message: null,
      source: "whatsapp",
    })
  } catch (err) {
    console.error("[whatsapp-enquiry]", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true }, { status: 201 })
}
