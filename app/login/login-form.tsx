'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { usernameToEmail } from '@/lib/utils/generate-credentials'

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Converte username in email per Supabase Auth
      // Se l'input contiene @, è già un'email (per staff/admin)
      // Altrimenti è uno username (codice fiscale) e lo convertiamo
      const email = usernameToEmail(username.trim())
      
      console.log('Tentativo login per:', username, '->', email)
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Errore login:', signInError)
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (!data?.user) {
        console.error('Login fallito: nessun utente restituito')
        setError('Login fallito: utente non trovato')
        setLoading(false)
        return
      }

      console.log('Login riuscito per utente:', data.user.id)
      
      // Forza un refresh della sessione per sincronizzare i cookie
      const sessionResult = await supabase.auth.getSession()
      
      if (!sessionResult.data.session) {
        // Se non c'è sessione, aspetta un po' di più e riprova
        await new Promise(resolve => setTimeout(resolve, 500))
        await supabase.auth.getSession()
      }
      
      // Determina il redirect path
      // Per pazienti, va direttamente a /paziente/referti per evitare problemi con la home page
      const redirectPath = redirectTo || searchParams.get('redirect') || '/paziente/referti'
      
      console.log('Redirect a:', redirectPath)
      
      // Usa window.location.href per forzare un reload completo e sincronizzare i cookie
      // Questo è necessario per assicurarsi che i cookie di sessione siano disponibili per il server
      window.location.href = redirectPath
    } catch (err) {
      console.error('Errore login:', err)
      setError('Errore durante il login: ' + (err instanceof Error ? err.message : 'Errore sconosciuto'))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-teal-600 px-4 py-2 font-medium uppercase text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Accesso in corso...' : 'ACCEDI'}
        </button>
      </div>
    </form>
  )
}
