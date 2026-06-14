'use client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { iniciais, PERFIL_COR, type Usuario } from '@/lib/auth'

interface AppShellProps {
  usuario: Usuario
  title: string
  /** Conteúdo extra à direita do cabeçalho (botões, etc.) */
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function AppShell({ usuario, title, actions, children }: AppShellProps) {
  const router = useRouter()
  const cor = PERFIL_COR[usuario.perfil] ?? '#10b981'

  function sair() {
    localStorage.removeItem('usuario')
    router.push('/login')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
        {/* Marca */}
        <div className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-prefeitura.svg"
            alt="Prefeitura de Alto Alegre do Maranhão"
            className="h-10 w-auto"
          />
        </div>

        <div className="mx-2 h-7 w-px bg-slate-200" />

        <h1 className="min-w-0 flex-1 truncate text-[15px] font-bold text-slate-900">{title}</h1>

        <span className="hidden text-xs text-slate-400 capitalize lg:block">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          Online
        </span>

        {actions}

        {/* Usuário */}
        <div className="ml-1 flex items-center gap-2.5 border-l border-slate-200 pl-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: cor }}
          >
            {iniciais(usuario.nome)}
          </div>
          <div className="hidden min-w-0 leading-tight sm:block">
            <div className="max-w-32 truncate text-xs font-semibold text-slate-900">{usuario.nome}</div>
            <div className="text-[10px] capitalize text-slate-400">{usuario.perfil}</div>
          </div>
          <button
            onClick={sair}
            title="Sair"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
