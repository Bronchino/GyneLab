import { requireAdmin } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { Prelievo, Paziente, TipoPrelievo, StatoPrelievo } from '@/lib/supabase/types'
import ElencoEsamiList from './elenco-esami-list'

interface PrelievoWithDetails extends Prelievo {
  paziente?: Paziente
  tipo_prelievo?: TipoPrelievo
  stato?: StatoPrelievo
}

export default async function ElencoEsamiPage({
  searchParams,
}: {
  searchParams?: { stato?: string }
}) {
  await requireAdmin()
  
  const supabase = await createClient()

  // Filtro per stato (opzionale)
  const statoFilter = searchParams?.stato

  // Query tutti i prelievi
  let query = supabase
    .from('prelievi')
    .select('*')
    .order('data_prelievo', { ascending: false })

  // Applica filtro per stato se presente
  if (statoFilter) {
    // Prima otteniamo l'ID dello stato dal nome
    const { data: statoData } = await supabase
      .from('stati_prelievo')
      .select('id')
      .eq('nome', statoFilter)
      .single()
    
    if (statoData) {
      query = query.eq('stato_id', statoData.id)
    }
  }

  const { data: prelievi, error: prelieviError } = await query

  if (prelieviError) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Errore nel caricamento degli esami
          </h3>
          <p className="text-red-700">{prelieviError.message}</p>
        </div>
      </div>
    )
  }

  // Carica tutti gli stati disponibili per i filtri
  const { data: stati } = await supabase
    .from('stati_prelievo')
    .select('*')
    .order('ordine', { ascending: true })

  // Carica i dati dei pazienti
  let pazientiMap = new Map<string, Paziente>()
  if (prelievi && prelievi.length > 0) {
    const pazienteIds = prelievi.map(p => p.paziente_id).filter(Boolean) as string[]
    if (pazienteIds.length > 0) {
      const { data: pazienti } = await supabase
        .from('pazienti')
        .select('*')
        .in('id', [...new Set(pazienteIds)])
      pazienti?.forEach(paziente => pazientiMap.set(paziente.id, paziente))
    }
  }

  // Carica i tipi prelievo
  let tipiMap = new Map<string, TipoPrelievo>()
  if (prelievi && prelievi.length > 0) {
    const tipoIds = prelievi.map(p => p.tipo_prelievo_id).filter(Boolean) as string[]
    if (tipoIds.length > 0) {
      const { data: tipi } = await supabase
        .from('tipi_prelievo')
        .select('*')
        .in('id', [...new Set(tipoIds)])
      tipi?.forEach(tipo => tipiMap.set(tipo.id, tipo))
    }
  }

  // Carica gli stati prelievo
  let statiMap = new Map<string, StatoPrelievo>()
  if (prelievi && prelievi.length > 0) {
    const statoIds = prelievi.map(p => p.stato_id).filter(Boolean) as string[]
    if (statoIds.length > 0) {
      const { data: statiPrelievi } = await supabase
        .from('stati_prelievo')
        .select('*')
        .in('id', [...new Set(statoIds)])
      statiPrelievi?.forEach(stato => statiMap.set(stato.id, stato))
    }
  }

  // Combina i dati
  const prelieviWithDetails: PrelievoWithDetails[] = (prelievi || []).map(prelievo => ({
    ...prelievo,
    paziente: pazientiMap.get(prelievo.paziente_id),
    tipo_prelievo: tipiMap.get(prelievo.tipo_prelievo_id),
    stato: statiMap.get(prelievo.stato_id),
  }))

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Elenco Esami</h1>
        <p className="mt-2 text-sm text-gray-600">
          Visualizza tutti gli esami eseguiti ({prelievi?.length || 0})
        </p>
      </div>

      <ElencoEsamiList 
        prelievi={prelieviWithDetails}
        stati={stati || []}
        statoSelezionato={statoFilter}
      />
    </div>
  )
}

