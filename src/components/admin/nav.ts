import type { Role } from "@/config/property-options"

export type AdminNavItem = { href: string; label: string; icon: string; roles: Role[]; exact?: boolean }

/** Navigation is filtered by role for convenience only — every route re-checks permissions server-side. */
export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", roles: ["admin", "staff", "seller"], exact: true },
  { href: "/admin/properties", label: "Properties", icon: "properties", roles: ["admin", "staff", "seller"], exact: true },
  { href: "/admin/properties/new", label: "Add Property", icon: "add", roles: ["admin", "staff", "seller"] },
  { href: "/admin/enquiries", label: "Enquiries", icon: "enquiries", roles: ["admin", "staff"] },
  { href: "/admin/sellers", label: "Seller Submissions", icon: "sellers", roles: ["admin", "staff"] },
  { href: "/admin/staff", label: "Staff & Users", icon: "staff", roles: ["admin"] },
  { href: "/admin/settings", label: "Settings", icon: "settings", roles: ["admin"] },
]
