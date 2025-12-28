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

  // Recupera i dati del paziente per il saluto
  const { data: paziente, error: pazienteError } = await supabase
    .from('pazienti')
    .select('nome, cognome')
    .eq('id', currentPazienteId)
    .single()

  // Query 1: Prelievi con referti pubblicati e non scaduti
  // RLS: paziente può vedere solo i propri prelievi
  // Include join con tipi_prelievo per ottenere il nome dell'esame
  const { data: prelievi, error: prelieviError } = await supabase
    .from('prelievi')
    .select(`
      *,
      tipo_prelievo:tipi_prelievo(nome)
    `)
    .eq('paziente_id', currentPazienteId)
    .not('referto_pubblicato_at', 'is', null)
    .order('data_prelievo', { ascending: false })

  // Filtraggio lato server per scadenza (compatibile con RLS)
  // Il tipo restituito dalla query include tipo_prelievo come oggetto annidato
  const prelieviConReferti = (prelievi || []).filter((p: any) => {
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

  if (prelieviError || documentiError || pazienteError) {
    return (
      <div className="text-red-600">
        Errore nel caricamento dei dati: {prelieviError?.message || documentiError?.message || pazienteError?.message}
      </div>
    )
  }

  // Determina il saluto in base all'ora
  const ora = new Date().getHours()
  const saluto = ora >= 6 && ora < 13 ? 'Buongiorno' : ora >= 13 && ora < 20 ? 'Buonasera' : 'Buonanotte'
  const nomePaziente = paziente ? `${paziente.nome} ${paziente.cognome}`.trim() : ''

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        {nomePaziente && (
          <h1 className="text-3xl font-bold text-gray-900">
            {saluto}, {nomePaziente}!
          </h1>
        )}
        {!nomePaziente && (
          <h1 className="text-3xl font-bold text-gray-900">I Miei Referti e Documenti</h1>
        )}
      </div>

      <RefertiList 
        prelievi={prelieviConReferti as any}
        documenti={documentiDisponibili as PazienteDocumento[]}
      />
    </div>
  )
}

