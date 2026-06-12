'use client'
import { useRouter, usePathname } from 'next/navigation'
import {
  Home,
  Stethoscope,
  BookOpenText,
  FileText,
  BarChart3,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { iniciais, PERFIL_COR, type Usuario } from '@/lib/auth'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { label: 'Recepção', href: '/recepcao', icon: Home },
  { label: 'Triagem', href: '/triagem', icon: Stethoscope },
  { label: 'Prontuário', href: '/prontuario', icon: BookOpenText },
  { label: 'Documentos', href: '/documentos', icon: FileText },
  { label: 'Gestão', href: '/gestao', icon: BarChart3 },
]

interface AppShellProps {
  usuario: Usuario
  title: string
  /** Conteúdo extra à direita do cabeçalho (botões, etc.) */
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function AppShell({ usuario, title, actions, children }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const cor = PERFIL_COR[usuario.perfil] ?? '#10b981'

  function sair() {
    localStorage.removeItem('usuario')
    router.push('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col bg-navy-900">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-lg font-extrabold text-white">
            +
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold text-white">PoliclínicaMed</div>
            <div className="text-[10px] text-slate-500">Gestão Municipal de Saúde</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {NAV.map((item) => {
            const ativo = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  ativo
                    ? 'bg-brand-500/15 text-brand-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon size={17} strokeWidth={ativo ? 2.4 : 2} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-2.5 border-t border-white/10 px-4 py-3.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: cor }}
          >
            {iniciais(usuario.nome)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-slate-200">{usuario.nome}</div>
            <div className="text-[10px] capitalize text-slate-500">{usuario.perfil}</div>
          </div>
          <button
            onClick={sair}
            title="Sair"
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-300"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5">
          <h1 className="flex-1 truncate text-[15px] font-bold text-slate-900">{title}</h1>
          <span className="hidden text-xs text-slate-400 capitalize md:block">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            Online
          </span>
          {actions}
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
