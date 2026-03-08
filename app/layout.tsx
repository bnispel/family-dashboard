import type { Metadata } from "next"
import { Inter, Montserrat } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  fallback: ["Helvetica", "Arial", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", "sans-serif"],
})
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" })

export const metadata: Metadata = {
  title: "Family Dashboard",
  description: "Family Dashboard — simple family management and overview",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${montserrat.variable} bg-[#F3F4F6]`}>
        {children}
      </body>
    </html>
  )
}