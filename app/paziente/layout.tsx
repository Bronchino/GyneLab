import { requirePaziente } from '@/lib/auth/require-role'
import { ReactNode } from 'react'
import Logo from '@/components/logo'

export default async function PazienteLayout({
  children,
}: {
  children: ReactNode
}) {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/0247e7cd-30b8-41ea-9da5-caa078df417d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/paziente/layout.tsx:10',message:'PazienteLayout entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  // Verifica che l'utente sia paziente
  await requirePaziente()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Logo />
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Info
              </button>
              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Disconnetti
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

