import { House } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@/components/shared/empty-state"

export default function PropertyNotFound() {
  return (
    <div className="container-page pt-32 pb-24">
      <EmptyState
        icon={House}
        title="This property is no longer available"
        description="It may have been sold, rented or taken off the market. Explore other listings or tell us what you're looking for."
        action={
          <Link href="/properties" className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-navy-900">
            View All Properties
          </Link>
        }
      />
    </div>
  )
}
