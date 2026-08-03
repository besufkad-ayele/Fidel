import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, Inter, Noto_Sans_Ethiopic } from 'next/font/google'
import localFont from 'next/font/local'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
import { Providers } from '@/components/providers'
import { publicEnv } from '@/lib/env'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
  display: 'swap',
})

/** Primary Amharic face — used only via `--font-ethiopic` / `<AmharicText>`. */
const zemenay = localFont({
  src: '../fonts/Zemenay-Regular.ttf',
  variable: '--font-zemenay',
  display: 'swap',
  weight: '400',
})

/** Fallback for Ethiopic glyphs missing from Zemenay. */
const notoEthiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  variable: '--font-noto-ethiopic',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'Fidel — Learn Amharic',
    template: '%s · Fidel',
  },
  description:
    'Six levels of Amharic built for diplomats, NGO staff, researchers, and returning diaspora. Culture first, then language, then practice.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F9F7F2' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1313' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${dmSerif.variable} ${zemenay.variable} ${notoEthiopic.variable}`}
    >
      <body>
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
