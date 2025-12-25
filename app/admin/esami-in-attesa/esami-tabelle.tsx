'use client'

import { Prelievo, Paziente, TipoPrelievo, StatoPrelievo } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale/it'

interface PrelievoWithDetails extends Prelievo {
  paziente?: Paziente
  tipo_prelievo?: TipoPrelievo
  stato?: StatoPrelievo
}

interface EsamiTabelleProps {
  ultimiEsami: PrelievoWithDetails[]
  esamiNonRefertati: PrelievoWithDetails[]
}

export default function EsamiTabelle({ ultimiEsami, esamiNonRefertati }: EsamiTabelleProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it })
    } catch {
      return dateString
    }
  }

  const getStatoBadge = (stato: StatoPrelievo | undefined, refertoPubblicato: boolean) => {
    // Se ha referto pubblicato, mostra "Refertato"
    if (refertoPubblicato) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Refertato
        </span>
      )
    }
    
    // Altrimenti usa lo stato dal database
    if (!stato) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          -
        </span>
      )
    }

    // Se lo stato è "In Attesa" o simile, usa badge giallo
    const statoNome = stato.nome.toLowerCase()
    if (statoNome.includes('attesa') || statoNome.includes('in attesa')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          In Attesa
        </span>
      )
    }

    // Altrimenti usa il colore dal database se disponibile
    const colore = stato.colore?.toLowerCase() || 'gray'
    const colorMap: { [key: string]: string } = {
      'green': 'bg-green-100 text-green-800',
      'blue': 'bg-blue-100 text-blue-800',
      'yellow': 'bg-yellow-100 text-yellow-800',
      'orange': 'bg-orange-100 text-orange-800',
      'red': 'bg-red-100 text-red-800',
      'purple': 'bg-purple-100 text-purple-800',
      'gray': 'bg-gray-100 text-gray-800',
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[colore] || 'bg-gray-100 text-gray-800'}`}>
        {stato.nome}
      </span>
    )
  }

  const handleRowClick = (prelievoId: string) => {
    window.location.href = `/admin/esami/${prelievoId}`
  }

  return (
    <div className="space-y-8">
      {/* Tabella 1: Ultimi 10 Esami */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Ultimi 10 Esami</h2>
          </div>
          <a
            href="/admin/elenco-esami"
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            Visualizza Tutti
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Rif.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <div className="flex items-center space-x-1">
                    <span>Eseguito il</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Paziente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo Esame
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ultimiEsami.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nessun esame trovato
                  </td>
                </tr>
              ) : (
                ultimiEsami.map((prelievo) => {
                  const prelievoWithDetails = prelievo as PrelievoWithDetails
                  return (
                    <tr
                      key={prelievo.id}
                      onClick={() => handleRowClick(prelievo.id)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatoBadge(prelievoWithDetails.stato, !!prelievo.referto_pubblicato_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ------
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(prelievo.data_prelievo)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {prelievoWithDetails.paziente 
                          ? `${prelievoWithDetails.paziente.cognome} ${prelievoWithDetails.paziente.nome}`
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {prelievoWithDetails.tipo_prelievo?.nome || '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabella 2: Esami non Refertati */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Esami non Refertati (Meno Recenti)</h2>
          </div>
          <a
            href="/admin/elenco-esami"
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
          >
            Visualizza Tutti
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Rif.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Eseguito il
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <div className="flex items-center space-x-1">
                    <span>Referto il</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Paziente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo Esame
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {esamiNonRefertati.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nessun esame trovato
                  </td>
                </tr>
              ) : (
                esamiNonRefertati.map((prelievo) => {
                  const prelievoWithDetails = prelievo as PrelievoWithDetails
                  return (
                    <tr
                      key={prelievo.id}
                      onClick={() => handleRowClick(prelievo.id)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ------
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(prelievo.data_prelievo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(prelievo.data_stimata_referto)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {prelievoWithDetails.paziente 
                          ? `${prelievoWithDetails.paziente.cognome} ${prelievoWithDetails.paziente.nome}`
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {prelievoWithDetails.tipo_prelievo?.nome || '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

