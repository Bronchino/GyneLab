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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Situazione Esami</h1>
        <p className="mt-2 text-sm text-gray-600">
          Panoramica degli esami eseguiti
        </p>
      </div>

      <EsamiTabelle 
        ultimiEsami={ultimiEsami}
        esamiNonRefertati={esamiNonRefertati}
      />
    </div>
  )
}
