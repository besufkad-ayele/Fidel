'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global]', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#F9F7F2',
          color: '#1A3636',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>This page couldn’t load</h1>
          <p style={{ opacity: 0.7, marginBottom: 20, maxWidth: 360 }}>
            Reload to try again, or go back.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '10px 20px',
                background: '#1A3636',
                color: '#F9F7F2',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Reload
            </button>
            <a
              href="/"
              style={{
                borderRadius: 999,
                padding: '10px 20px',
                border: '1px solid #E5DFD1',
                color: '#1A3636',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Back
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
