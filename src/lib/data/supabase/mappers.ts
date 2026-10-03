import type { PropertyWrite } from "@/lib/data/types"
import type { Enquiry, EnquiryNote, Property, PropertyImage, UserProfile } from "@/types/domain"

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come from PostgREST untyped */

export const PROPERTY_SELECT =
  "*, property_images(id, url, storage_path, alt, width, height, position)"

export function rowToProperty(r: any): Property {
  const images: PropertyImage[] = ((r.property_images ?? []) as any[])
    .map((i) => ({
      id: i.id,
      url: i.url,
      storagePath: i.storage_path,
      alt: i.alt ?? "",
      width: i.width,
      height: i.height,
      position: i.position,
    }))
    .sort((a, b) => a.position - b.position)
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    purpose: r.purpose,
    category: r.category,
    propertyType: r.property_type,
    price: Number(r.price),
    priceLabel: r.price_label,
    negotiable: r.negotiable,
    address: r.address,
    locality: r.locality,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    latitude: r.latitude,
    longitude: r.longitude,
    locationPrecision: r.location_precision,
    area: Number(r.area),
    areaUnit: r.area_unit,
    areaSqft: Number(r.area_sqft),
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    parking: r.parking,
    furnishing: r.furnishing,
    floor: r.floor,
    totalFloors: r.total_floors,
    facing: r.facing,
    constructionYear: r.construction_year,
    possessionStatus: r.possession_status,
    amenities: r.amenities ?? [],
    highlights: r.highlights ?? [],
    nearbyLandmarks: r.nearby_landmarks ?? [],
    customFields: r.custom_fields ?? {},
    images,
    coverImageUrl: r.cover_image_url ?? images[0]?.url ?? null,
    videoUrl: r.video_url,
    virtualTourUrl: r.virtual_tour_url,
    status: r.status,
    featured: r.featured,
    verified: r.verified,
    isDemo: r.is_demo,
    reviewNotes: r.review_notes ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    publishedAt: r.published_at,
    createdBy: r.created_by,
  }
}

/** camelCase write model → snake_case payload for public.save_property(). */
export function propertyToPayload(d: PropertyWrite) {
  const payload: Record<string, unknown> = {
    slug: d.slug,
    title: d.title,
    description: d.description,
    purpose: d.purpose,
    category: d.category,
    property_type: d.propertyType,
    price: d.price,
    price_label: d.priceLabel,
    negotiable: d.negotiable,
    address: d.address,
    locality: d.locality,
    city: d.city,
    state: d.state,
    pincode: d.pincode,
    latitude: d.latitude,
    longitude: d.longitude,
    location_precision: d.locationPrecision,
    area: d.area,
    area_unit: d.areaUnit,
    bedrooms: d.bedrooms,
    bathrooms: d.bathrooms,
    parking: d.parking,
    furnishing: d.furnishing,
    floor: d.floor,
    total_floors: d.totalFloors,
    facing: d.facing,
    construction_year: d.constructionYear,
    possession_status: d.possessionStatus,
    amenities: d.amenities,
    highlights: d.highlights,
    nearby_landmarks: d.nearbyLandmarks,
    custom_fields: d.customFields,
    video_url: d.videoUrl,
    virtual_tour_url: d.virtualTourUrl,
    status: d.status,
    featured: d.featured,
    verified: d.verified,
    is_demo: d.isDemo ?? false,
  }
  if (d.reviewNotes !== undefined) payload.review_notes = d.reviewNotes
  const images = [...d.images]
    .sort((a, b) => a.position - b.position)
    .map((i) => ({ url: i.url, storage_path: i.storagePath, alt: i.alt, width: i.width, height: i.height }))
  return { payload, images }
}

export function rowToEnquiry(r: any): Enquiry {
  return {
    id: r.id,
    reference: r.reference,
    propertyId: r.property_id,
    propertyTitle: r.property_title,
    propertySlug: r.property_slug,
    name: r.name,
    phone: r.phone,
    email: r.email,
    message: r.message,
    source: r.source,
    status: r.status,
    assignedTo: r.assigned_to,
    assignedToName: r.assignee?.full_name ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function rowToNote(r: any): EnquiryNote {
  return {
    id: r.id,
    enquiryId: r.enquiry_id,
    body: r.body,
    authorId: r.author_id,
    authorName: r.author_name,
    createdAt: r.created_at,
  }
}

export function rowToProfile(r: any): UserProfile {
  return { id: r.id, email: r.email, fullName: r.full_name, role: r.role, createdAt: r.created_at }
}
