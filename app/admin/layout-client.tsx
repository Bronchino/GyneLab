'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface SidebarLinkProps {
  href: string
  icon: ReactNode
  children: ReactNode
  isActive?: boolean
}

function SidebarLink({ href, icon, children, isActive }: SidebarLinkProps) {
  return (
    <a
      href={href}
      className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-white bg-opacity-20 text-white'
          : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10'
      }`}
    >
      {icon}
      <span>{children}</span>
    </a>
  )
}

interface AdminLayoutClientProps {
  children: ReactNode
  nomeCompleto: string
}

export default function AdminLayoutClient({ children, nomeCompleto }: AdminLayoutClientProps) {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    if (path === '/admin/dashboard' || path === '/admin') {
      return pathname === '/admin/dashboard' || pathname === '/admin'
    }
    if (path === '/admin/esami-in-attesa') {
      return pathname === '/admin/esami-in-attesa' || pathname === '/admin' || pathname === '/admin/dashboard'
    }
    return pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar sinistra */}
      <aside className="w-64 bg-teal-600 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-teal-700">
          <h1 className="text-white text-2xl font-black tracking-wide">GyneLab</h1>
          <button className="text-white text-opacity-80 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Barra di ricerca nella sidebar */}
        <div className="px-4 py-4 border-b border-teal-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Ricerca paziente..."
              className="w-full px-4 py-2 pl-10 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-white text-opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {/* Sezione GENERALE */}
          <div>
            <p className="px-4 text-xs font-semibold text-white text-opacity-60 uppercase tracking-wider mb-2">
              GENERALE
            </p>
            <div className="space-y-1">
              <SidebarLink
                href="/admin/esami-in-attesa"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                isActive={isActive('/admin/esami-in-attesa')}
              >
                Situazione Esami
              </SidebarLink>
            </div>
          </div>

          {/* Sezione AMMINISTRAZIONE */}
          <div>
            <p className="px-4 text-xs font-semibold text-white text-opacity-60 uppercase tracking-wider mb-2">
              AMMINISTRAZIONE
            </p>
            <div className="space-y-1">
              <SidebarLink
                href="/admin/pazienti"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                isActive={isActive('/admin/pazienti')}
              >
                Lista Pazienti
              </SidebarLink>

              <SidebarLink
                href="/admin/elenco-esami"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                }
                isActive={isActive('/admin/elenco-esami')}
              >
                Elenco Esami
              </SidebarLink>
            </div>
          </div>
        </nav>
      </aside>

      {/* Contenuto principale */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">

          {/* Info utente e impostazioni */}
          <div className="flex items-center space-x-4">
            {/* Impostazioni */}
            <a 
              href="/admin/impostazioni"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg" 
              title="Impostazioni"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>

            {/* Utente */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {nomeCompleto.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700 font-medium">{nomeCompleto}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Logout */}
            <form action="/logout" method="post">
              <button
                type="submit"
                className="text-gray-600 hover:text-gray-900 px-3 py-1 text-sm"
              >
                Logout
              </button>
            </form>
          </div>
        </header>

        {/* Contenuto */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

