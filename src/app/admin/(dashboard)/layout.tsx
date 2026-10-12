import type { Metadata } from "next"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { getAdminStore } from "@/lib/data"
import { isStaff, requirePageUser } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · YAAM Admin" },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requirePageUser()
  const store = await getAdminStore()

  let newEnquiries = null
  const counts: Record<string, number> = {}
  if (isStaff(user)) {
    const [enq, pending] = await Promise.all([
      store.enquiries.list({ status: "new", page: 1 }),
      store.properties.list({ status: "pending_review", page: 1 }),
    ])
    newEnquiries = enq.items
    counts["/admin/enquiries"] = enq.total
    counts["/admin/sellers"] = pending.total
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <AdminSidebar role={user.role} counts={counts} />
      <div className="lg:pl-64">
        <AdminHeader user={user} newEnquiries={newEnquiries} counts={counts} />
        <main id="main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
