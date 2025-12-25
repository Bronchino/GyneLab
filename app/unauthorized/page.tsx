export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">403 - Accesso Negato</h1>
        <p className="mt-2 text-gray-600">
          Non hai i permessi necessari per accedere a questa risorsa.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          Torna al login
        </a>
      </div>
    </div>
  )
}

