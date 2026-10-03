import { PropertyCardSkeleton } from "@/components/property/property-card"

export default function Loading() {
  return (
    <div className="bg-canvas pt-[4.25rem]" aria-busy="true" aria-label="Loading properties">
      <div className="border-b border-line bg-white">
        <div className="container-page space-y-4 py-10">
          <div className="h-4 w-32 animate-pulse rounded bg-canvas" />
          <div className="h-9 w-2/3 max-w-lg animate-pulse rounded bg-canvas" />
          <div className="h-9 w-48 animate-pulse rounded-full bg-canvas" />
        </div>
      </div>
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[18.5rem_1fr]">
        <div className="hidden h-[32rem] animate-pulse rounded-xl bg-white lg:block" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
