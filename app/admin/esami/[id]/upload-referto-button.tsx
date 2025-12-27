'use client'

import { useState, useRef, useEffect } from 'react'
import UploadRefertoForm from './upload-referto-form'

interface UploadRefertoButtonProps {
  prelievoId: string
  hasReferto: boolean
}

export default function UploadRefertoButton({ prelievoId, hasReferto }: UploadRefertoButtonProps) {
  const [showForm, setShowForm] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)

  // Chiudi form quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowForm(false)
      }
    }

    if (showForm) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showForm])

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={() => setShowForm(!showForm)}
        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {hasReferto ? 'Sostituisci Referto' : '+ Aggiungi Referto'}
      </button>
      {showForm && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white shadow-lg rounded-lg border border-gray-200 z-10 p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Carica Referto PDF</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {hasReferto 
                ? 'Attenzione: caricare un nuovo referto sovrascriverà quello esistente.'
                : 'Seleziona un file PDF referto da caricare.'}
            </p>
          </div>
          <UploadRefertoForm prelievoId={prelievoId} onClose={() => setShowForm(false)} />
        </div>
      )}
    </div>
  )
}

