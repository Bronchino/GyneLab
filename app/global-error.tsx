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
    // Log l'errore per il debugging
    console.error('Global error boundary caught error:', error)
  }, [error])

  return (
    <html lang="it">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Errore Critico</h2>
              <p className="mt-2 text-sm text-gray-600">
                Si è verificato un errore critico nell&apos;applicazione.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <p className="text-xs font-mono text-red-800 break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="mt-2 text-xs text-red-600">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={reset}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Riprova
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Torna alla home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

