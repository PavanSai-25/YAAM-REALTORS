import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { MotionProvider } from "@/components/motion/motion-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SITE_URL } from "@/config/site"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "YAAM Realtors & Consultants — Property in Hyderabad & Secunderabad",
    template: "%s | YAAM Realtors",
  },
  description:
    "Buy, sell and rent residential, commercial and land properties across Hyderabad and Secunderabad with YAAM Realtors & Consultants. Established 2006.",
  applicationName: "YAAM Realtors",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "YAAM Realtors & Consultants",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: "#062b67",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={jakarta.variable}>
      <body className="min-h-dvh">
        <MotionProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </MotionProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
