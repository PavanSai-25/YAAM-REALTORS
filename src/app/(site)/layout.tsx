import { Footer } from "@/components/layout/footer"
import { MobileActionBar } from "@/components/layout/mobile-action-bar"
import { Navbar } from "@/components/layout/navbar"
import { JsonLd } from "@/components/seo/json-ld"
import { getSiteSettings } from "@/lib/settings"
import { realEstateAgentJsonLd } from "@/lib/seo/structured-data"
import { generalEnquiryMessage } from "@/lib/whatsapp"

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings()
  const whatsappMessage = generalEnquiryMessage(settings.shortName)

  return (
    <>
      <Navbar contact={{ whatsappNumber: settings.whatsappNumber, phone: settings.phone, whatsappMessage }} />
      <main id="main" className="min-h-[60vh] pb-16 md:pb-0">
        {children}
      </main>
      <Footer settings={settings} />
      <MobileActionBar whatsappNumber={settings.whatsappNumber} whatsappMessage={whatsappMessage} phone={settings.phone} />
      <JsonLd data={realEstateAgentJsonLd(settings)} />
    </>
  )
}
