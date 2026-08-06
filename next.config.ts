import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/**' }]
      : [],
  },
  typedRoutes: true,
  // Admin image/homework uploads go through Server Actions (default is 1MB).
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default createNextIntlPlugin('./src/i18n/request.ts')(nextConfig)
