import type { Metadata } from "next"
import Link from "next/link"
import { PropertyCard } from "@/components/property/property-card"
import { JsonLd } from "@/components/seo/json-ld"
import { PropertyFilters } from "@/components/search/property-filters"
import { SortSelect } from "@/components/search/sort-select"
import { EmptyState } from "@/components/shared/empty-state"
import { Pagination } from "@/components/shared/pagination"
import { getPublicStore } from "@/lib/data"
import { breadcrumbJsonLd, listingsSeoTitle } from "@/lib/seo/structured-data"
import { getSiteSettings } from "@/lib/settings"
import { cn } from "@/lib/utils"
import { parsePropertySearch, searchToQuery } from "@/lib/validations/filters"

export async function generateMetadata({ searchParams }: PageProps<"/properties">): Promise<Metadata> {
  const search = parsePropertySearch(await searchParams)
  const title = listingsSeoTitle(search)
  // Only the clean purpose/category combinations are canonical; deeper filters point back to them.
  const canonical = `/properties${searchToQuery({ purpose: search.purpose, category: search.category })}`
  return {
    title,
    description: `Browse ${title.toLowerCase()} with Yaam Realtors & Consultants. Photos, prices and details — enquire instantly on WhatsApp.`,
    alternates: { canonical },
    openGraph: { title: `${title} | Yaam Realtors`, url: canonical },
  }
}

const TABS = [
  { label: "All", purpose: undefined },
  { label: "Buy", purpose: "sale" as const },
  { label: "Rent", purpose: "rent" as const },
]

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const search = parsePropertySearch(await searchParams)
  const store = getPublicStore()
  const [settings, results, localities] = await Promise.all([
    getSiteSettings(),
    store.properties.search(search),
    store.properties.listLocalities(),
  ])
  const { page: _page, ...filters } = search
  void _page
  const heading = listingsSeoTitle(search)

  return (
    <div className="bg-canvas pt-[4.25rem]">
      <div className="border-b border-line bg-white">
        <div className="container-page py-8 sm:py-10">
          <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-brand">
                  Home
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-ink-soft">
                Properties
              </li>
            </ol>
          </nav>
          <h1 className="mt-3 text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] sm:text-4xl">{heading}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-2" role="list" aria-label="Purpose">
            {TABS.map((t) => {
              const active = search.purpose === t.purpose
              return (
                <Link
                  key={t.label}
                  role="listitem"
                  href={`/properties${searchToQuery({ ...filters, purpose: t.purpose, page: 1 })}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "h-9 rounded-full px-4 text-sm leading-9 font-semibold transition-colors",
                    active ? "bg-navy-900 text-white" : "bg-canvas text-ink-soft hover:bg-brand-light hover:text-navy-900",
                  )}
                >
                  {t.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[18.5rem_1fr] lg:py-10">
        <PropertyFilters initial={filters} localities={localities} total={results.total} />

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p id="results-heading" className="text-sm text-ink-muted" aria-live="polite">
              <span className="font-semibold text-ink tabular">{results.total}</span>{" "}
              {results.total === 1 ? "property" : "properties"} found
            </p>
            <div className="flex items-center gap-2">
              <SortSelect search={search} />
            </div>
          </div>

          {results.items.length ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {results.items.map((p, i) => (
                  <PropertyCard key={p.id} property={p} whatsappNumber={settings.whatsappNumber} priority={i < 3} />
                ))}
              </div>
              <Pagination
                page={results.page}
                totalPages={results.totalPages}
                hrefFor={(p) => `/properties${searchToQuery({ ...search, page: p })}`}
              />
            </>
          ) : (
            <EmptyState
              title="No properties match your search."
              description="Try adjusting your filters or explore all available properties."
              action={
                <Link
                  href="/properties"
                  className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-navy-900"
                >
                  View All Properties
                </Link>
              }
            />
          )}
        </section>
      </div>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Properties", path: "/properties" },
        ])}
      />
    </div>
  )
}
