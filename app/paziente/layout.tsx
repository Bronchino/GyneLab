import { requirePaziente } from '@/lib/auth/require-role'
import { ReactNode } from 'react'

export default async function PazienteLayout({
  children,
}: {
  children: ReactNode
}) {
  // Verifica che l'utente sia paziente
  await requirePaziente()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Area Paziente
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

