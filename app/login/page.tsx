'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Monitor, Stethoscope, HeartPulse, BarChart3, Eye, EyeOff, AlertCircle, ArrowRight, type LucideIcon } from 'lucide-react'

interface Profissional {
  id: string
  label: string
  cor: string
  icon: LucideIcon
  usuario: string
  senha: string
}

// Credenciais dos profissionais (demonstração — substituir por autenticação real)
const PROFISSIONAIS: Profissional[] = [
  { id: 'recepcionista', label: 'Recepcionista', cor: '#10b981', icon: Monitor, usuario: 'recepcao', senha: '123' },
  { id: 'enfermeiro', label: 'Enfermagem', cor: '#0ea5e9', icon: Stethoscope, usuario: 'enfermeiro', senha: '123' },
  { id: 'medico', label: 'Médico', cor: '#ec4899', icon: HeartPulse, usuario: 'medico', senha: '123' },
  { id: 'gestor', label: 'Gestor', cor: '#f59e0b', icon: BarChart3, usuario: 'gestor', senha: '123' },
]

const rotasPorPerfil: Record<string, string> = {
  recepcionista: '/recepcao',
  enfermeiro: '/triagem',
  medico: '/prontuario',
  gestor: '/gestao',
}

export default function Login() {
  const router = useRouter()
  const [perfilSelecionado, setPerfilSelecionado] = useState('recepcionista')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const profissional = PROFISSIONAIS.find((x) => x.id === perfilSelecionado)
  const cor = profissional?.cor ?? '#10b981'

  function fazerLogin() {
    setErro('')
    if (!usuario || !senha) {
      setErro('Preencha usuário e senha.')
      return
    }
    const valido = PROFISSIONAIS.find(
      (p) => p.id === perfilSelecionado && p.usuario === usuario && p.senha === senha
    )
    if (valido) {
      localStorage.setItem(
        'usuario',
        JSON.stringify({ nome: profissional?.label, perfil: perfilSelecionado, usuario })
      )
      router.replace(rotasPorPerfil[perfilSelecionado] ?? '/recepcao')
    } else {
      setErro('Usuário ou senha inválidos para este perfil.')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') fazerLogin()
  }

  return (
    <div className="flex min-h-screen">
      {/* Painel institucional */}
      <div className="relative hidden flex-1 flex-col justify-center overflow-hidden bg-navy-950 px-16 lg:flex">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-2xl font-extrabold text-white">
              +
            </div>
            <div>
              <div className="text-sm font-bold text-white">PoliclínicaMed</div>
              <div className="text-[11px] text-slate-500">Gestão Municipal de Saúde</div>
            </div>
          </div>

          <h1 className="max-w-lg text-4xl leading-tight font-extrabold text-white">
            Alto Alegre do Maranhão
            <br />
            <span className="text-brand-400">Especialidades médicas</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
            Prontuário eletrônico para toda a equipe de saúde. Acesso seguro e personalizado
            para cada profissional — da recepção ao consultório.
          </p>

          <div className="mt-12 flex gap-8 text-slate-500">
            {[
              ['Recepção e fila', Monitor],
              ['Triagem Manchester', Stethoscope],
              ['Prontuário completo', HeartPulse],
              ['Indicadores', BarChart3],
            ].map(([label, Icon]) => {
              const I = Icon as LucideIcon
              return (
                <div key={label as string} className="flex flex-col items-center gap-2">
                  <I size={20} className="text-brand-500" />
                  <span className="text-[11px]">{label as string}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex w-full items-center justify-center bg-slate-50 px-6 py-10 lg:w-[440px]">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-extrabold text-slate-900">Entrar no sistema</h2>
          <p className="mt-1 mb-7 text-[13px] text-slate-500">
            Escolha seu perfil e informe suas credenciais
          </p>

          {/* Seleção de perfil */}
          <div className="mb-7 grid grid-cols-2 gap-2">
            {PROFISSIONAIS.map((p) => {
              const Icon = p.icon
              const ativo = perfilSelecionado === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPerfilSelecionado(p.id)
                    setUsuario('')
                    setSenha('')
                    setErro('')
                  }}
                  className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-3 text-left transition-all ${
                    ativo ? 'bg-white shadow-card' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  style={ativo ? { borderColor: p.cor } : undefined}
                >
                  <Icon size={18} style={{ color: ativo ? p.cor : '#94a3b8' }} />
                  <span
                    className="text-[12px] font-bold"
                    style={{ color: ativo ? p.cor : '#0f172a' }}
                  >
                    {p.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="field">
            <label className="label">Usuário</label>
            <input
              type="text"
              className="input"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite seu usuário"
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label className="label">Senha</label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                className="input pr-11"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
              <AlertCircle size={15} className="shrink-0" />
              {erro}
            </div>
          )}

          <button
            onClick={fazerLogin}
            className="btn w-full py-3 text-[15px] text-white transition-opacity hover:opacity-90"
            style={{ background: cor }}
          >
            Entrar como {profissional?.label}
            <ArrowRight size={17} />
          </button>

          <p className="mt-7 border-t border-slate-200 pt-4 text-center text-[11px] text-slate-400">
            Sistema de Prontuário Eletrônico · Policlínica Municipal
          </p>
        </div>
      </div>
    </div>
  )
}
