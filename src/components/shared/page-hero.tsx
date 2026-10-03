import Image from "next/image"

/** Compact photographic header for inner pages. */
export function PageHero({ eyebrow, title, description, image }: { eyebrow: string; title: string; description?: string; image: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 pt-[4.25rem]">
      <Image src={image} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/40" />
      <div className="container-page py-16 sm:py-24">
        <p className="rise text-[0.72rem] font-semibold tracking-[0.2em] text-brand-cyan uppercase">{eyebrow}</p>
        <h1 className="rise mt-4 max-w-3xl text-4xl leading-[1.06] font-semibold tracking-[-0.035em] text-white [animation-delay:80ms] sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="rise mt-5 max-w-2xl text-lg leading-relaxed text-white/75 [animation-delay:160ms]">{description}</p>}
      </div>
    </section>
  )
}
