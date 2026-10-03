import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/admin/page-header"
import { PropertyForm } from "@/components/admin/property-form"
import { StatusBadge } from "@/components/property/status-badge"
import { PUBLIC_STATUSES } from "@/config/property-options"
import { isStaff, requirePageUser } from "@/lib/auth/session"
import { getAdminStore } from "@/lib/data"
import { formatRelative } from "@/lib/format"
import type { PropertyInput } from "@/lib/validations/property"
import type { Property } from "@/types/domain"

export const metadata: Metadata = { title: "Edit property" }

function toInput(p: Property): PropertyInput {
  return {
    title: p.title,
    description: p.description,
    purpose: p.purpose,
    category: p.category,
    propertyType: p.propertyType,
    price: p.price,
    priceLabel: p.priceLabel,
    negotiable: p.negotiable,
    address: p.address,
    locality: p.locality,
    city: p.city,
    state: p.state,
    pincode: p.pincode,
    latitude: p.latitude,
    longitude: p.longitude,
    locationPrecision: p.locationPrecision,
    area: p.area,
    areaUnit: p.areaUnit,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    parking: p.parking,
    furnishing: p.furnishing,
    floor: p.floor,
    totalFloors: p.totalFloors,
    facing: p.facing,
    constructionYear: p.constructionYear,
    possessionStatus: p.possessionStatus,
    amenities: p.amenities,
    highlights: p.highlights,
    nearbyLandmarks: p.nearbyLandmarks,
    customFields: p.customFields,
    images: p.images,
    videoUrl: p.videoUrl,
    virtualTourUrl: p.virtualTourUrl,
    status: p.status,
    featured: p.featured,
    verified: p.verified,
  }
}

export default async function EditPropertyPage({ params, searchParams }: PageProps<"/admin/properties/[id]/edit">) {
  const user = await requirePageUser()
  const { id } = await params
  const { created } = await searchParams
  const property = await (await getAdminStore()).properties.getById(id)
  // Sellers only ever see their own submissions (RLS enforces the same in Supabase).
  if (!property || (!isStaff(user) && property.createdBy !== user.id)) notFound()

  const sellerLocked = !isStaff(user) && !["draft", "pending_review", "changes_requested"].includes(property.status)
  const isPublic = PUBLIC_STATUSES.includes(property.status)

  return (
    <>
      <PageHeader
        back={{ href: "/admin/properties", label: isStaff(user) ? "Properties" : "My submissions" }}
        title={property.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge status={property.status} />
            {property.isDemo && <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium ring-1 ring-line">Demo listing</span>}
            <span>Updated {formatRelative(property.updatedAt)}</span>
            {isPublic && <span>· /properties/{property.slug}</span>}
          </span>
        }
      />
      {created === "1" && (
        <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Property created. {isPublic ? "It's live on the website now." : "It isn't public yet — change the status to Published when you're ready."}
        </div>
      )}
      {sellerLocked ? (
        <div className="rounded-xl border border-line bg-white p-6 text-sm text-ink-soft">
          This listing has been reviewed and can no longer be edited here. Contact Yaam to request changes.
        </div>
      ) : (
        <PropertyForm
          initial={toInput(property)}
          propertyId={property.id}
          slug={isPublic ? property.slug : undefined}
          role={user.role}
          reviewNotes={property.reviewNotes}
        />
      )}
    </>
  )
}
