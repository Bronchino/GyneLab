import { requireAdmin } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import StudioPrivacyForm from './studio-privacy-form'
import { StudioImpostazioni, PrivacyTesto } from '@/lib/supabase/types'

export default async function StudioPrivacyPage() {
  await requireAdmin()
  
  const supabase = await createClient()

  // Carica i dati dello studio (assumendo che ci sia un solo record o il primo)
  // Nota: potrebbe essere necessario adattare il nome della tabella
  const { data: studioData } = await supabase
    .from('studio_impostazioni')
    .select('*')
    .limit(1)
    .maybeSingle()

  // Carica il testo della privacy (assumendo che ci sia un solo record o il primo)
  const { data: privacyData } = await supabase
    .from('privacy_testo')
    .select('*')
    .limit(1)
    .maybeSingle()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">
          Impostazioni / Studio e Privacy
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Studio e Privacy</h1>
          <a
            href="/admin/impostazioni"
            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Torna indietro
          </a>
        </div>
      </div>

      <StudioPrivacyForm 
        studio={studioData as StudioImpostazioni | null}
        privacy={privacyData as PrivacyTesto | null}
      />
    </div>
  )
}

