import "server-only"
import { AVAILABLE_STATUSES, PUBLIC_STATUSES } from "@/config/property-options"
import {
  deriveCover,
  isPubliclyVisible,
  matchesAdminFilter,
  matchesSearch,
  paginate,
  sortProperties,
  toPublicProperty,
} from "@/lib/data/query"
import type { AdminDataStore, PropertyWrite, PublicDataStore } from "@/lib/data/types"
import { istDateKey, lastIstDays, toSqft } from "@/lib/format"
import type { DashboardStats, Enquiry, Property } from "@/types/domain"
import { hashPassword, mutateDb, newId, readDb } from "./db"

function materialize(data: PropertyWrite, base: Partial<Property>, now: string): Property {
  const images = [...data.images].sort((a, b) => a.position - b.position).map((img, position) => ({ ...img, position }))
  const wasPublic = base.status ? isPubliclyVisible(base.status) : false
  return {
    ...(base as Property),
    ...data,
    images,
    areaSqft: toSqft(data.area, data.areaUnit),
    coverImageUrl: deriveCover(images),
    isDemo: data.isDemo ?? base.isDemo ?? false,
    reviewNotes: data.reviewNotes !== undefined ? data.reviewNotes : (base.reviewNotes ?? null),
    updatedAt: now,
    publishedAt:
      isPubliclyVisible(data.status) && !wasPublic ? now : isPubliclyVisible(data.status) ? (base.publishedAt ?? now) : null,
  }
}

export const localPublicStore: PublicDataStore = {
  properties: {
    async search(search) {
      const db = await readDb()
      const matched = db.properties.filter((p) => matchesSearch(p, search))
      const page = paginate(sortProperties(matched, search.sort), search.page)
      return { ...page, items: page.items.map(toPublicProperty) }
    },
    async getBySlug(slug) {
      const db = await readDb()
      const p = db.properties.find((x) => x.slug === slug && PUBLIC_STATUSES.includes(x.status))
      return p ? toPublicProperty(p) : null
    },
    async listFeatured(limit) {
      const db = await readDb()
      const available = db.properties.filter((p) => AVAILABLE_STATUSES.includes(p.status))
      const featured = sortProperties(available.filter((p) => p.featured), "newest")
      const rest = sortProperties(available.filter((p) => !p.featured), "newest")
      return [...featured, ...rest].slice(0, limit).map(toPublicProperty)
    },
    async listSimilar(property, limit) {
      const db = await readDb()
      const candidates = db.properties.filter(
        (p) => p.id !== property.id && AVAILABLE_STATUSES.includes(p.status) && p.category === property.category,
      )
      const score = (p: Property) =>
        Number(p.purpose === property.purpose) * 2 +
        Number(p.locality === property.locality) * 2 +
        Number(p.propertyType === property.propertyType)
      return candidates
        .sort((a, b) => score(b) - score(a))
        .slice(0, limit)
        .map(toPublicProperty)
    },
    async listSitemapEntries() {
      const db = await readDb()
      return db.properties
        .filter((p) => PUBLIC_STATUSES.includes(p.status))
        .map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }))
    },
    async listLocalities() {
      const db = await readDb()
      const set = new Set(db.properties.filter((p) => AVAILABLE_STATUSES.includes(p.status)).map((p) => p.locality))
      return [...set].sort()
    },
    async categoryCounts() {
      const db = await readDb()
      const live = db.properties.filter((p) => AVAILABLE_STATUSES.includes(p.status))
      return {
        residential: live.filter((p) => p.category === "residential").length,
        commercial: live.filter((p) => p.category === "commercial").length,
        land: live.filter((p) => p.category === "land").length,
        rent: live.filter((p) => p.purpose === "rent").length,
      }
    },
  },
  async createEnquiry(input) {
    await mutateDb((db) => {
      if (db.enquiries.some((e) => e.reference === input.reference)) return
      const property = input.propertyId ? db.properties.find((p) => p.id === input.propertyId) : undefined
      const now = new Date().toISOString()
      const enquiry: Enquiry = {
        id: newId("enq"),
        ...input,
        propertyId: property?.id ?? null,
        propertyTitle: property?.title ?? null,
        propertySlug: property?.slug ?? null,
        status: "new",
        assignedTo: null,
        assignedToName: null,
        createdAt: now,
        updatedAt: now,
      }
      db.enquiries.push(enquiry)
    })
  },
  async getSettings() {
    return (await readDb()).settings
  },
}

export const localAdminStore: AdminDataStore = {
  properties: {
    async list(filter, scope) {
      const db = await readDb()
      const items = db.properties.filter(
        (p) =>
          matchesAdminFilter(p, filter) &&
          (!scope?.ownerId || p.createdBy === scope.ownerId) &&
          (!scope?.statuses || scope.statuses.includes(p.status)),
      )
      return paginate(
        items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        filter.page,
        20,
      )
    },
    async getById(id) {
      return (await readDb()).properties.find((p) => p.id === id) ?? null
    },
    async isSlugTaken(slug, exceptId) {
      return (await readDb()).properties.some((p) => p.slug === slug && p.id !== exceptId)
    },
    async create(data, createdBy) {
      return mutateDb((db) => {
        const now = new Date().toISOString()
        const property = materialize(data, { id: newId("prop"), createdAt: now, createdBy }, now)
        db.properties.push(property)
        return property
      })
    },
    async update(id, data) {
      return mutateDb((db) => {
        const index = db.properties.findIndex((p) => p.id === id)
        if (index === -1) throw new Error("Property not found")
        const updated = materialize(data, db.properties[index], new Date().toISOString())
        db.properties[index] = updated
        return updated
      })
    },
    async bulkUpdate(ids, patch) {
      return mutateDb((db) => {
        const now = new Date().toISOString()
        let count = 0
        for (const p of db.properties) {
          if (!ids.includes(p.id)) continue
          if (patch.status) {
            if (isPubliclyVisible(patch.status) && !isPubliclyVisible(p.status)) p.publishedAt = now
            if (!isPubliclyVisible(patch.status)) p.publishedAt = null
            p.status = patch.status
          }
          if (patch.featured !== undefined) p.featured = patch.featured
          p.updatedAt = now
          count++
        }
        return count
      })
    },
    async setReview(id, status, notes) {
      await mutateDb((db) => {
        const p = db.properties.find((x) => x.id === id)
        if (!p) throw new Error("Property not found")
        const now = new Date().toISOString()
        if (isPubliclyVisible(status) && !isPubliclyVisible(p.status)) p.publishedAt = now
        p.status = status
        p.reviewNotes = notes
        p.updatedAt = now
      })
    },
    async delete(ids) {
      return mutateDb((db) => {
        const removed = db.properties.filter((p) => ids.includes(p.id))
        db.properties = db.properties.filter((p) => !ids.includes(p.id))
        for (const e of db.enquiries) if (e.propertyId && ids.includes(e.propertyId)) e.propertyId = null
        return removed.flatMap((p) => p.images.map((i) => i.storagePath).filter((x): x is string => !!x))
      })
    },
    async recent(limit, scope) {
      const db = await readDb()
      return db.properties
        .filter((p) => !scope?.ownerId || p.createdBy === scope.ownerId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, limit)
    },
  },
  enquiries: {
    async list(filter) {
      const db = await readDb()
      const q = filter.q?.toLowerCase()
      const items = db.enquiries
        .filter((e) => !filter.status || e.status === filter.status)
        .filter((e) => !filter.source || e.source === filter.source)
        .filter(
          (e) =>
            !q ||
            [e.name, e.phone, e.email, e.reference, e.propertyTitle].some((v) => v?.toLowerCase().includes(q)),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return paginate(items, filter.page, 20)
    },
    async get(id) {
      return (await readDb()).enquiries.find((e) => e.id === id) ?? null
    },
    async recent(limit) {
      const db = await readDb()
      return [...db.enquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)
    },
    async update(id, patch) {
      await mutateDb((db) => {
        const e = db.enquiries.find((x) => x.id === id)
        if (!e) throw new Error("Enquiry not found")
        if (patch.status) e.status = patch.status
        if (patch.assignedTo !== undefined) {
          const user = patch.assignedTo ? db.users.find((u) => u.id === patch.assignedTo) : null
          if (patch.assignedTo && !user) throw new Error("Staff member not found")
          e.assignedTo = user?.id ?? null
          e.assignedToName = user?.fullName ?? null
        }
        e.updatedAt = new Date().toISOString()
      })
    },
    async listNotes(enquiryId) {
      const db = await readDb()
      return db.enquiryNotes
        .filter((n) => n.enquiryId === enquiryId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    },
    async addNote(note) {
      return mutateDb((db) => {
        if (!db.enquiries.some((e) => e.id === note.enquiryId)) throw new Error("Enquiry not found")
        const created = { id: newId("note"), ...note, createdAt: new Date().toISOString() }
        db.enquiryNotes.push(created)
        return created
      })
    },
  },
  users: {
    async list() {
      const db = await readDb()
      return db.users.map(({ passwordHash: _p, ...u }) => {
        void _p
        return u
      })
    },
    async updateRole(userId, role) {
      await mutateDb((db) => {
        const u = db.users.find((x) => x.id === userId)
        if (!u) throw new Error("User not found")
        u.role = role
      })
    },
    canCreateUsers: () => true,
    async create(input) {
      return mutateDb((db) => {
        const email = input.email.toLowerCase()
        if (db.users.some((u) => u.email === email)) throw new Error("A user with this email already exists")
        const user = {
          id: newId("user"),
          email,
          fullName: input.fullName,
          role: input.role,
          createdAt: new Date().toISOString(),
          passwordHash: hashPassword(input.password),
        }
        db.users.push(user)
        const { passwordHash: _p, ...profile } = user
        void _p
        return profile
      })
    },
  },
  async saveSettings(settings) {
    await mutateDb((db) => {
      db.settings = settings
    })
  },
  async stats(scope): Promise<DashboardStats> {
    const db = await readDb()
    const props = db.properties.filter((p) => !scope?.ownerId || p.createdBy === scope.ownerId)
    const enquiries = scope?.ownerId ? [] : db.enquiries
    const days = lastIstDays(14).map((date) => ({
      date,
      count: enquiries.filter((e) => istDateKey(e.createdAt) === date).length,
    }))
    return {
      totalProperties: props.length,
      activeListings: props.filter((p) => AVAILABLE_STATUSES.includes(p.status)).length,
      sold: props.filter((p) => p.status === "sold").length,
      rented: props.filter((p) => p.status === "rented").length,
      drafts: props.filter((p) => p.status === "draft").length,
      pendingReview: props.filter((p) => p.status === "pending_review").length,
      enquiries: enquiries.length,
      newEnquiries: enquiries.filter((e) => e.status === "new").length,
      enquiriesByDay: days,
    }
  },
}
