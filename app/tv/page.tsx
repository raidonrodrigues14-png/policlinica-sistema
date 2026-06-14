'use client'
import { useEffect, useState } from 'react'
import { MapPin, Users } from 'lucide-react'

export default function TVPage() {
  const [chamada, setChamada] = useState<any>(null)
  const [fila, setFila] = useState<any[]>([])
  const [hora, setHora] = useState('')
  const [pisc, setPisc] = useState(false)
  const [chamadaAnterior, setChamadaAnterior] = useState<string | undefined>(undefined)

  function carregar() {
    try {
      const c = localStorage.getItem('tv_chamada_atual')
      if (c) setChamada(JSON.parse(c))
      const f = localStorage.getItem('tv_fila')
      if (f) setFila(JSON.parse(f))
    } catch {}
  }

  useEffect(() => {
    carregar()
    const tick = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
    const poll = setInterval(carregar, 3000)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tv_chamada_atual' || e.key === 'tv_fila') carregar()
    }
    window.addEventListener('storage', onStorage)
    return () => {
      clearInterval(tick)
      clearInterval(poll)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Pisca quando muda o número chamado
  useEffect(() => {
    if (!chamada) return
    if (chamada.num !== chamadaAnterior) {
      setChamadaAnterior(chamada.num)
      setPisc(true)
      const t = setTimeout(() => setPisc(false), 2500)
      return () => clearTimeout(t)
    }
  }, [chamada?.num])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0f172a] text-white select-none">
      {/* Cabeçalho */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#10b981] text-xl font-extrabold">
            +
          </div>
          <div>
            <div className="text-sm font-bold">PoliclínicaMed</div>
            <div className="text-[10px] text-slate-400">Gestão Municipal de Saúde</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#10b981]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#10b981]" />
            Ao vivo
          </span>
          <div className="font-mono text-xl font-bold text-white">{hora}</div>
        </div>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Painel principal de chamada */}
        <div className="flex flex-1 flex-col items-center justify-center p-12">
          <div
            className={`w-full max-w-2xl rounded-3xl border-2 p-12 text-center transition-all duration-500 ${
              pisc
                ? 'border-[#10b981] bg-[#10b981]/15 shadow-[0_0_60px_rgba(16,185,129,0.3)]'
                : 'border-white/10 bg-white/5'
            }`}
          >
            {chamada ? (
              <>
                <div className="mb-2 text-[11px] font-bold tracking-widest text-[#10b981] uppercase">
                  {pisc ? '📢 Chamando agora' : 'Último chamado'}
                </div>
                <div className="font-mono text-[9rem] leading-none font-extrabold text-white">
                  #{chamada.num}
                </div>
                <div className="mt-5 text-4xl font-bold text-white">{chamada.nome}</div>
                <div className="mt-4 flex items-center justify-center gap-2 text-2xl text-[#34d399]">
                  <MapPin size={24} />
                  {chamada.cons}
                </div>
                <div className="mt-1 text-lg text-slate-400">{chamada.esp}</div>
              </>
            ) : (
              <div className="py-8 text-3xl font-semibold text-slate-600">
                Aguardando chamada...
              </div>
            )}
          </div>

          {/* Rodapé informativo */}
          <div className="mt-8 text-center text-sm text-slate-600">
            Dirija-se ao consultório indicado ao ouvir seu nome
          </div>
        </div>

        {/* Fila lateral */}
        <div className="w-72 shrink-0 overflow-y-auto border-l border-white/10 p-6">
          <div className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
            <Users size={13} />
            Próximos na fila
          </div>

          {fila.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-600">Fila vazia</div>
          ) : (
            <div className="space-y-2">
              {fila.slice(0, 10).map((p, i) => (
                <div
                  key={p.id ?? i}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    i === 0
                      ? 'border-[#10b981]/40 bg-[#10b981]/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <span className="font-mono text-2xl font-extrabold text-[#10b981]">#{p.num}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{p.nome}</div>
                    <div className="truncate text-[11px] text-slate-400">{p.esp}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {fila.length > 0 && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <div className="text-[10px] text-slate-500">Total aguardando</div>
              <div className="text-2xl font-bold text-white">{fila.length}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
