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
  searchParams?: { stato?: string; search?: string }
}) {
  await requireAdmin()
  
  const supabase = await createClient()

  // Filtro per stato (opzionale)
  const statoFilter = searchParams?.stato
  const searchQuery = searchParams?.search
  const daRefertareFilter = statoFilter === 'da_refertare'

  // Query tutti i prelievi
  let query = supabase
    .from('prelievi')
    .select('*')
    .order('data_prelievo', { ascending: false })

  // Applica filtro "Da Refertare" (esami con stato "Eseguito" e senza referto pubblicato)
  if (daRefertareFilter) {
    // Trova lo stato "Eseguito" (case-insensitive)
    const { data: statoEseguito } = await supabase
      .from('stati_prelievo')
      .select('id')
      .ilike('nome', 'eseguito')
      .single()
    
    if (statoEseguito) {
      query = query
        .eq('stato_id', statoEseguito.id)
        .is('referto_pubblicato_at', null)
    }
  } else if (statoFilter && statoFilter !== 'da_refertare') {
    // Applica filtro per stato normale se presente
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

  // Carica i dati dei pazienti (carica tutti i pazienti dei prelievi per permettere ricerca)
  let pazientiMap = new Map<string, Paziente>()
  const pazienteIdsToLoad = [...new Set((prelievi || []).map(p => p.paziente_id).filter(Boolean) as string[])]
  
  if (pazienteIdsToLoad.length > 0) {
    const { data: pazienti } = await supabase
      .from('pazienti')
      .select('*')
      .in('id', pazienteIdsToLoad)
    pazienti?.forEach(paziente => pazientiMap.set(paziente.id, paziente))
  }

  // Applica filtro di ricerca se presente (dopo aver caricato i dati dei pazienti)
  let prelieviFiltrati = prelievi || []
  if (searchQuery && searchQuery.trim()) {
    const searchLower = searchQuery.toLowerCase().trim()
    prelieviFiltrati = prelieviFiltrati.filter(prelievo => {
      // Cerca nel rif_interno o commento
      const rifMatch = (prelievo.rif_interno || prelievo.commento || '').toLowerCase().includes(searchLower)
      
      // Cerca nel nome/cognome paziente
      const paziente = pazientiMap.get(prelievo.paziente_id)
      const pazienteMatch = paziente 
        ? `${paziente.cognome} ${paziente.nome}`.toLowerCase().includes(searchLower)
        : false
      
      return rifMatch || pazienteMatch
    })
  }

  // Carica i tipi prelievo
  let tipiMap = new Map<string, TipoPrelievo>()
  const tipoIdsToLoad = [...new Set((prelieviFiltrati || []).map(p => p.tipo_prelievo_id).filter(Boolean) as string[])]
  if (tipoIdsToLoad.length > 0) {
    const { data: tipi } = await supabase
      .from('tipi_prelievo')
      .select('*')
      .in('id', tipoIdsToLoad)
    tipi?.forEach(tipo => tipiMap.set(tipo.id, tipo))
  }

  // Carica gli stati prelievo
  let statiMap = new Map<string, StatoPrelievo>()
  const statoIdsToLoad = [...new Set((prelieviFiltrati || []).map(p => p.stato_id).filter(Boolean) as string[])]
  if (statoIdsToLoad.length > 0) {
    const { data: statiPrelievi } = await supabase
      .from('stati_prelievo')
      .select('*')
      .in('id', statoIdsToLoad)
    statiPrelievi?.forEach(stato => statiMap.set(stato.id, stato))
  }

  // Combina i dati
  const prelieviWithDetails: PrelievoWithDetails[] = (prelieviFiltrati || []).map(prelievo => ({
    ...prelievo,
    paziente: pazientiMap.get(prelievo.paziente_id),
    tipo_prelievo: tipiMap.get(prelievo.tipo_prelievo_id),
    stato: statiMap.get(prelievo.stato_id),
  }))

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-500 mb-2">
              Amministrazione / Esami
            </div>
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900">Esami</h1>
              <a
                href="/admin/elenco-esami"
                className="inline-flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Aggiorna
              </a>
            </div>
          </div>
          <a
            href="/admin/pazienti"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Aggiungi un Esame
          </a>
        </div>
      </div>

      <ElencoEsamiList 
        prelievi={prelieviWithDetails}
        stati={stati || []}
        statoSelezionato={statoFilter}
        searchQuery={searchQuery}
      />
    </div>
  )
}

