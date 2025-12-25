import { createClient } from '@/lib/supabase/server'
import { requirePaziente } from '@/lib/auth/require-role'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { Prelievo, PazienteDocumento } from '@/lib/supabase/types'
import RefertiList from './referti-list'

export default async function RefertiPage() {
  await requirePaziente()
  
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) {
    return <div>Errore: utente non trovato</div>
  }

  // Ottiene l'ID del paziente corrente usando la funzione del DB
  const { data: currentPazienteId } = await supabase.rpc('current_paziente_id')
  
  if (!currentPazienteId) {
    return <div>Errore: paziente non trovato</div>
  }

  // Query 1: Prelievi con referti pubblicati e non scaduti
  // RLS: paziente può vedere solo i propri prelievi
  // Filtriamo lato client anche per referto pubblicato e non scaduto
  const { data: prelievi, error: prelieviError } = await supabase
    .from('prelievi')
    .select('*')
    .eq('paziente_id', currentPazienteId)
    .not('referto_pubblicato_at', 'is', null)
    .order('data_prelievo', { ascending: false })

  // Filtraggio lato server per scadenza (compatibile con RLS)
  const prelieviConReferti = (prelievi || []).filter((p: Prelievo) => {
    if (!p.referto_pubblicato_at) return false
    if (p.referto_scade_at) {
      const scadeAt = new Date(p.referto_scade_at)
      return scadeAt > new Date()
    }
    return true
  })

  // Query 2: Documenti paziente pubblicati e non scaduti
  // RLS: paziente può vedere solo documenti pubblicati e non scaduti del proprio paziente
  const { data: documenti, error: documentiError } = await supabase
    .from('pazienti_documenti')
    .select('*')
    .eq('paziente_id', currentPazienteId)
    .not('pubblicato_at', 'is', null)
    .order('pubblicato_at', { ascending: false })

  // Filtraggio per scadenza
  const documentiDisponibili = (documenti || []).filter((d: PazienteDocumento) => {
    if (!d.pubblicato_at) return false
    if (d.scade_at) {
      const scadeAt = new Date(d.scade_at)
      return scadeAt > new Date()
    }
    return true
  })

  if (prelieviError || documentiError) {
    return (
      <div className="text-red-600">
        Errore nel caricamento dei dati: {prelieviError?.message || documentiError?.message}
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">I Miei Referti e Documenti</h1>
        <p className="mt-2 text-sm text-gray-600">
          Consulta i tuoi referti e documenti disponibili
        </p>
      </div>

      <RefertiList 
        prelievi={prelieviConReferti as Prelievo[]}
        documenti={documentiDisponibili as PazienteDocumento[]}
      />
    </div>
  )
}

