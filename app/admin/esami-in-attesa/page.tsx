import { requireAdmin } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { Prelievo, Paziente, TipoPrelievo, StatoPrelievo } from '@/lib/supabase/types'
import EsamiTabelle from './esami-tabelle'

interface PrelievoWithDetails extends Prelievo {
  paziente?: Paziente
  tipo_prelievo?: TipoPrelievo
  stato?: StatoPrelievo
}

export default async function EsamiInAttesaPage() {
  await requireAdmin()
  
  const supabase = await createClient()

  // Recupera nome utente
  const { data: { user } } = await supabase.auth.getUser()
  let nomeCompleto = user?.email || 'Admin'
  if (user) {
    const { data: profilo } = await supabase
      .from('profili_utenti')
      .select('nome, cognome')
      .eq('id', user.id)
      .single()
    
    if (profilo?.nome && profilo?.cognome) {
      nomeCompleto = `${profilo.nome} ${profilo.cognome}`
    }
  }

  // Calcola saluto basato sull'ora
  const ora = new Date().getHours()
  const saluto = ora >= 6 && ora < 13 ? 'Buongiorno' : ora >= 13 && ora < 20 ? 'Buonasera' : 'Buonanotte'

  // Query 1: Ultimi 10 esami ordinati per data esecuzione (decrescente)
  const { data: ultimiPrelievi, error: ultimiError } = await supabase
    .from('prelievi')
    .select('*')
    .order('data_prelievo', { ascending: false })
    .limit(10)

  // Query 2: Esami senza referto pubblicato, ordinati per data stimata referto (crescente)
  const { data: prelieviNonRefertati, error: nonRefertatiError } = await supabase
    .from('prelievi')
    .select('*')
    .is('referto_pubblicato_at', null)
    .order('data_stimata_referto', { ascending: true })

  // Statistiche: conteggio totale pazienti
  const { count: totalePazienti } = await supabase
    .from('pazienti')
    .select('*', { count: 'exact', head: true })

  // Statistiche: conteggio totale esami
  const { count: totaleEsami } = await supabase
    .from('prelievi')
    .select('*', { count: 'exact', head: true })

  // Statistiche: conteggio esami da refertare (stato "Eseguito" senza referto pubblicato)
  const { data: statoEseguito } = await supabase
    .from('stati_prelievo')
    .select('id')
    .ilike('nome', 'eseguito')
    .single()

  let esamiDaRefertare = 0
  if (statoEseguito) {
    const { count } = await supabase
      .from('prelievi')
      .select('*', { count: 'exact', head: true })
      .eq('stato_id', statoEseguito.id)
      .is('referto_pubblicato_at', null)
    esamiDaRefertare = count || 0
  }

  // Calcola esami in scadenza/scaduti
  const oggi = new Date().toISOString().split('T')[0]
  
  // Esami in scadenza oggi
  const { count: esamiInScadenzaOggi } = await supabase
    .from('prelievi')
    .select('*', { count: 'exact', head: true })
    .eq('data_stimata_referto', oggi)
    .is('referto_pubblicato_at', null)

  // Esami scaduti
  const { count: esamiScaduti } = await supabase
    .from('prelievi')
    .select('*', { count: 'exact', head: true })
    .lt('data_stimata_referto', oggi)
    .is('referto_pubblicato_at', null)

  // Esami senza scadenza da refertare
  const { count: esamiSenzaScadenza } = await supabase
    .from('prelievi')
    .select('*', { count: 'exact', head: true })
    .is('data_stimata_referto', null)
    .is('referto_pubblicato_at', null)

  if (ultimiError || nonRefertatiError) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Errore nel caricamento degli esami
          </h3>
          <p className="text-red-700">{ultimiError?.message || nonRefertatiError?.message}</p>
        </div>
      </div>
    )
  }

  // Combina gli ID per caricare i dati correlati
  const allPrelievi = [...(ultimiPrelievi || []), ...(prelieviNonRefertati || [])]
  const allPazienteIds = [...new Set(allPrelievi.map(p => p.paziente_id).filter(Boolean) as string[])]
  const allTipoIds = [...new Set(allPrelievi.map(p => p.tipo_prelievo_id).filter(Boolean) as string[])]
  const allStatoIds = [...new Set(allPrelievi.map(p => p.stato_id).filter(Boolean) as string[])]

  // Carica i dati dei pazienti
  let pazientiMap = new Map<string, Paziente>()
  if (allPazienteIds.length > 0) {
    const { data: pazienti } = await supabase
      .from('pazienti')
      .select('*')
      .in('id', allPazienteIds)
    pazienti?.forEach(paziente => pazientiMap.set(paziente.id, paziente))
  }

  // Carica i tipi prelievo
  let tipiMap = new Map<string, TipoPrelievo>()
  if (allTipoIds.length > 0) {
    const { data: tipi } = await supabase
      .from('tipi_prelievo')
      .select('*')
      .in('id', allTipoIds)
    tipi?.forEach(tipo => tipiMap.set(tipo.id, tipo))
  }

  // Carica gli stati prelievo
  let statiMap = new Map<string, StatoPrelievo>()
  if (allStatoIds.length > 0) {
    const { data: stati } = await supabase
      .from('stati_prelievo')
      .select('*')
      .in('id', allStatoIds)
    stati?.forEach(stato => statiMap.set(stato.id, stato))
  }

  // Combina i dati per ultimi 10 esami
  const ultimiEsami: PrelievoWithDetails[] = (ultimiPrelievi || []).map(prelievo => ({
    ...prelievo,
    paziente: pazientiMap.get(prelievo.paziente_id),
    tipo_prelievo: tipiMap.get(prelievo.tipo_prelievo_id),
    stato: statiMap.get(prelievo.stato_id),
  }))

  // Combina i dati per esami non refertati
  const esamiNonRefertati: PrelievoWithDetails[] = (prelieviNonRefertati || []).map(prelievo => ({
    ...prelievo,
    paziente: pazientiMap.get(prelievo.paziente_id),
    tipo_prelievo: tipiMap.get(prelievo.tipo_prelievo_id),
    stato: statiMap.get(prelievo.stato_id),
  }))

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-500 mb-2">
              Generale / Home
            </div>
            <div className="mb-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                {saluto}, {nomeCompleto}
              </h1>
            </div>
            <p className="text-sm text-gray-600">
              Ci sono {esamiInScadenzaOggi || 0} esami in scadenza oggi, {esamiScaduti || 0} esami scaduti e {esamiSenzaScadenza || 0} esami senza scadenza da refertare.
            </p>
          </div>
          <a
            href="/admin/impostazioni"
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Impostazioni
          </a>
        </div>
      </div>

      <EsamiTabelle 
        ultimiEsami={ultimiEsami}
        esamiNonRefertati={esamiNonRefertati}
        statistiche={{
          totalePazienti: totalePazienti || 0,
          totaleEsami: totaleEsami || 0,
          esamiDaRefertare: esamiDaRefertare,
        }}
      />
    </div>
  )
}
