'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

// next-themes injects an inline <script> to apply the stored theme before
// hydration (avoids a flash). React 19 warns about <script> inside client
// components; the warning is a false positive — the script runs correctly
// during SSR. See: https://github.com/pacocoursey/next-themes/issues/385
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const original = console.error
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : ''
    if (message.includes('Encountered a script tag')) return
    original.apply(console, args)
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  )
}
