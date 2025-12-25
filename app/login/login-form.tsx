'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      console.log('Tentativo login per:', email)
      
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
      await supabase.auth.getSession()
      
      // Piccolo delay per assicurare che i cookie siano sincronizzati
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Redirect dopo login usando window.location per forzare un reload completo
      const redirectPath = redirectTo || searchParams.get('redirect') || '/'
      console.log('Redirect a:', redirectPath)
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>
      </div>
    </form>
  )
}

