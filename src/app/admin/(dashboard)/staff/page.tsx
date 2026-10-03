import type { Metadata } from "next"
import { PageHeader } from "@/components/admin/page-header"
import { StaffManager } from "@/components/admin/staff-manager"
import { requirePageUser } from "@/lib/auth/session"
import { getAdminStore } from "@/lib/data"

export const metadata: Metadata = { title: "Staff & users" }

export default async function StaffPage() {
  const user = await requirePageUser(["admin"], "/admin/staff")
  const store = await getAdminStore()
  const users = await store.users.list()
  return (
    <>
      <PageHeader
        title="Staff & users"
        description="Admins manage everything. Staff manage properties and enquiries. Sellers only see their own submissions."
      />
      <StaffManager users={users} currentUserId={user.id} canCreate={store.users.canCreateUsers()} />
    </>
  )
}
