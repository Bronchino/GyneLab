import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Pagina non trovata</h2>
          <p className="mt-2 text-sm text-gray-600">
            La pagina che stai cercando non esiste o è stata spostata.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Torna alla home
        </Link>
      </div>
    </div>
  )
}

