export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-64 animate-pulse rounded bg-white" />
        <div className="h-4 w-80 animate-pulse rounded bg-white" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-white" />
        ))}
      </div>
      <div className="mt-6 h-72 animate-pulse rounded-xl bg-white" />
    </div>
  )
}
