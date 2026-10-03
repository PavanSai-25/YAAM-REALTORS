import type { Metadata } from "next"
import { PageHeader } from "@/components/admin/page-header"
import { PropertyForm } from "@/components/admin/property-form"
import { requirePageUser } from "@/lib/auth/session"
import { EMPTY_PROPERTY_INPUT } from "@/lib/validations/property"

export const metadata: Metadata = { title: "Add property" }

export default async function NewPropertyPage() {
  const user = await requirePageUser()
  const seller = user.role === "seller"
  return (
    <>
      <PageHeader
        back={{ href: "/admin/properties", label: seller ? "My submissions" : "Properties" }}
        title={seller ? "Submit a property" : "Add property"}
        description={seller ? "Yaam will review your listing before it appears on the website." : "Fill in the details, upload photos and publish when ready."}
      />
      <PropertyForm initial={EMPTY_PROPERTY_INPUT} propertyId={null} role={user.role} />
    </>
  )
}
