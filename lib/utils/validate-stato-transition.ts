/**
 * Utility per validare transizioni di stato prelievo
 * Basato su SPECIFICA-STATI-PRELIEVO.md
 */

export interface StatoTransition {
  from: string
  to: string
  allowed: boolean
  type: 'automatic' | 'manual' | 'patient_action'
  description?: string
}

/**
 * Transizioni consentite secondo la specifica
 * Stati: Eseguito, Refertato, Notificato (futuro), Visionato, Scaricato
 */
const ALLOWED_TRANSITIONS: StatoTransition[] = [
  // Transizioni Forward (Progressione)
  {
    from: 'Eseguito',
    to: 'Refertato',
    allowed: true,
    type: 'automatic', // automatico su azione manuale staff (upload referto)
    description: 'Upload PDF referto da parte dello staff',
  },
  {
    from: 'Refertato',
    to: 'Visionato',
    allowed: true,
    type: 'patient_action', // automatico su azione paziente (visualizzazione)
    description: 'Paziente accede/visualizza referto',
  },
  {
    from: 'Refertato',
    to: 'Scaricato',
    allowed: true,
    type: 'patient_action', // automatico su azione paziente (download)
    description: 'Paziente scarica PDF referto (skip Visionato)',
  },
  {
    from: 'Visionato',
    to: 'Scaricato',
    allowed: true,
    type: 'patient_action', // automatico su azione paziente (download)
    description: 'Paziente scarica PDF referto',
  },
  // Transizioni Backward (Regressione Manuale - Solo Eccezionali)
  {
    from: 'Refertato',
    to: 'Eseguito',
    allowed: true,
    type: 'manual', // solo admin, quando referto viene rimosso
    description: 'Staff rimuove/cancella referto PDF',
  },
  // Transizioni future (Notificato - NON IMPLEMENTATE)
  {
    from: 'Refertato',
    to: 'Notificato',
    allowed: true,
    type: 'automatic',
    description: 'Invio notifica al paziente (FUTURO - NON IMPLEMENTATO)',
  },
  {
    from: 'Notificato',
    to: 'Visionato',
    allowed: true,
    type: 'patient_action',
    description: 'Paziente accede/visualizza referto (FUTURO - NON IMPLEMENTATO)',
  },
  {
    from: 'Notificato',
    to: 'Scaricato',
    allowed: true,
    type: 'patient_action',
    description: 'Paziente scarica PDF referto (FUTURO - NON IMPLEMENTATO)',
  },
]

/**
 * Valida se una transizione di stato è consentita
 * @param fromStatoNome Nome dello stato di partenza (case-insensitive)
 * @param toStatoNome Nome dello stato di destinazione (case-insensitive)
 * @returns true se la transizione è consentita, false altrimenti
 */
export function isValidStatoTransition(
  fromStatoNome: string,
  toStatoNome: string
): boolean {
  const fromLower = fromStatoNome.toLowerCase().trim()
  const toLower = toStatoNome.toLowerCase().trim()

  // Se stessa stato, non è una transizione
  if (fromLower === toLower) {
    return false
  }

  // Cerca nella lista delle transizioni consentite
  const transition = ALLOWED_TRANSITIONS.find(
    (t) => t.from.toLowerCase() === fromLower && t.to.toLowerCase() === toLower
  )

  return transition?.allowed === true
}

/**
 * Ottiene le informazioni sulla transizione
 * @param fromStatoNome Nome dello stato di partenza (case-insensitive)
 * @param toStatoNome Nome dello stato di destinazione (case-insensitive)
 * @returns Oggetto StatoTransition se trovato, null altrimenti
 */
export function getStatoTransition(
  fromStatoNome: string,
  toStatoNome: string
): StatoTransition | null {
  const fromLower = fromStatoNome.toLowerCase().trim()
  const toLower = toStatoNome.toLowerCase().trim()

  return (
    ALLOWED_TRANSITIONS.find(
      (t) => t.from.toLowerCase() === fromLower && t.to.toLowerCase() === toLower
    ) || null
  )
}

/**
 * Ottiene la lista degli stati raggiungibili da uno stato dato
 * @param fromStatoNome Nome dello stato di partenza (case-insensitive)
 * @returns Array di nomi stati raggiungibili
 */
export function getAvailableNextStates(fromStatoNome: string): string[] {
  const fromLower = fromStatoNome.toLowerCase().trim()

  return ALLOWED_TRANSITIONS
    .filter((t) => t.from.toLowerCase() === fromLower && t.allowed)
    .map((t) => t.to)
}

/**
 * Ottiene la lista degli stati da cui si può raggiungere uno stato dato
 * @param toStatoNome Nome dello stato di destinazione (case-insensitive)
 * @returns Array di nomi stati da cui si può raggiungere lo stato
 */
export function getAvailablePreviousStates(toStatoNome: string): string[] {
  const toLower = toStatoNome.toLowerCase().trim()

  return ALLOWED_TRANSITIONS
    .filter((t) => t.to.toLowerCase() === toLower && t.allowed)
    .map((t) => t.from)
}

