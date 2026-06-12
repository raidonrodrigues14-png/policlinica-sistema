'use client'

import { useEffect, useState } from 'react'
import { Stethoscope, Inbox, RefreshCw, CheckCircle2, Activity, FileText, AlertTriangle } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useUsuario, iniciais } from '@/lib/auth'

const RISCO = [
  { id: 'vermelho', label: 'Emergência', tempo: 'Imediato', cls: 'bg-rose-500 border-rose-500 text-white', txt: 'text-rose-700' },
  { id: 'laranja', label: 'Muito urgente', tempo: '≤10min', cls: 'bg-orange-500 border-orange-500 text-white', txt: 'text-orange-700' },
  { id: 'amarelo', label: 'Urgente', tempo: '≤60min', cls: 'bg-amber-400 border-amber-400 text-amber-950', txt: 'text-amber-700' },
  { id: 'verde', label: 'Pouco urgente', tempo: '≤120min', cls: 'bg-emerald-500 border-emerald-500 text-white', txt: 'text-emerald-700' },
  { id: 'azul', label: 'Não urgente', tempo: '≤240min', cls: 'bg-sky-500 border-sky-500 text-white', txt: 'text-sky-700' },
]

const av = (v: any, min: any, max: any, ok: any, at: any, al: any) =>
  !v ? '' : (+v < min || +v > max) ? al : (+v <= ok) ? 'normal' : (+v <= at) ? 'atencao' : 'alerta'

const CLS: Record<string, { badge: string; border: string; t: string }> = {
  normal: { badge: 'badge-green', border: 'border-slate-200', t: 'Normal' },
  atencao: { badge: 'badge-yellow', border: 'border-amber-400', t: 'Atenção' },
  alerta: { badge: 'badge-red', border: 'border-rose-400', t: 'Alerta' },
  '': { badge: 'badge-gray', border: 'border-slate-200', t: '-' },
}

const VITAIS_VAZIO = { peso: '', altura: '', pas: '', pad: '', temp: '', fc: '', fr: '', sat: '', glic: '', dor: '0' }

function VitalCard({ value, onChange, l, u, st }: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  l: string
  u: string
  st?: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <label className="mb-1 block text-[11px] font-semibold text-slate-500">{l}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          onChange={onChange}
          className={`input border-[1.5px] py-1.5 text-center font-bold ${st ? CLS[st].border : ''}`}
        />
        <span className="text-[10px] whitespace-nowrap text-slate-400">{u}</span>
      </div>
      {st && <span className={`mt-1.5 ${CLS[st].badge}`}>{CLS[st].t}</span>}
    </div>
  )
}

export default function TriagemPage() {
  const usuario = useUsuario()
  const [filaTriagem, setFilaTriagem] = useState<any[]>([])
  const [pac, setPac] = useState<any>(null)
  const [v, setV] = useState<Record<string, string>>(VITAIS_VAZIO)
  const [risco, setRisco] = useState('')
  const [queixa, setQueixa] = useState('')
  const [ok, setOk] = useState(false)

  const carregarPacientesTriagem = () => {
    const pacientesStorage = localStorage.getItem('pacientes_triagem')
    if (pacientesStorage) {
      const pacientes = JSON.parse(pacientesStorage)
      const ativos = pacientes.filter((p: any) => p.status === 'aguardando_triagem' || p.status === 'em_triagem')
      setFilaTriagem(ativos)
    }
  }

  const atualizarStatusPaciente = (pacienteId: string, novoStatus: string, dadosTriagem: any = null) => {
    const pacientesStorage = localStorage.getItem('pacientes_triagem')
    if (pacientesStorage) {
      let pacientes = JSON.parse(pacientesStorage)
      pacientes = pacientes.map((p: any) => {
        if (p.id === pacienteId) {
          return {
            ...p,
            status: novoStatus,
            ...(dadosTriagem && { dados_triagem: dadosTriagem }),
            data_triagem: new Date().toISOString(),
          }
        }
        return p
      })
      localStorage.setItem('pacientes_triagem', JSON.stringify(pacientes))

      const historicoStorage = localStorage.getItem('historico_triagens')
      const historico = historicoStorage ? JSON.parse(historicoStorage) : []
      const pacienteCompleto = pacientes.find((p: any) => p.id === pacienteId)
      if (pacienteCompleto && novoStatus === 'aguardando_medico') {
        historico.push({
          ...pacienteCompleto,
          dados_triagem: dadosTriagem,
          finalizado_em: new Date().toISOString(),
          enfermeiro: usuario?.nome,
        })
        localStorage.setItem('historico_triagens', JSON.stringify(historico))
      }
    }
  }

  useEffect(() => {
    if (!usuario) return
    carregarPacientesTriagem()
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pacientes_triagem') carregarPacientesTriagem()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [usuario])

  if (!usuario) return null

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [k]: e.target.value }))
  const imc = v.peso && v.altura ? (parseFloat(v.peso) / ((parseFloat(v.altura) / 100) ** 2)).toFixed(1) : null
  const imcC = imc ? (parseFloat(imc) < 18.5 ? 'Abaixo do peso' : parseFloat(imc) < 25 ? 'Normal' : parseFloat(imc) < 30 ? 'Sobrepeso' : 'Obesidade') : null
  const stFC = av(v.fc, 20, 300, 100, 120, 'alerta')
  const stSat = av(v.sat, 50, 100, 100, 95, 'alerta') === '' ? '' : +v.sat >= 95 ? 'normal' : +v.sat >= 90 ? 'atencao' : 'alerta'
  const stTemp = v.temp ? (+v.temp < 35 ? 'alerta' : +v.temp <= 37.2 ? 'normal' : +v.temp <= 38.9 ? 'atencao' : 'alerta') : ''
  const stGlic = v.glic ? (+v.glic < 70 ? 'alerta' : +v.glic <= 99 ? 'normal' : +v.glic <= 125 ? 'atencao' : 'alerta') : ''
  const stPA = v.pas && v.pad ? (+v.pas < 90 || +v.pad < 60 ? 'alerta' : +v.pas <= 120 && +v.pad <= 80 ? 'normal' : +v.pas <= 139 ? 'atencao' : 'alerta') : ''

  function finalizar() {
    const dadosTriagem = {
      sinais_vitais: v,
      risco,
      queixa,
      imc,
      imc_classificacao: imcC,
      data_hora: new Date().toISOString(),
      enfermeiro: usuario!.nome,
    }
    if (pac) {
      atualizarStatusPaciente(pac.id, 'aguardando_medico', dadosTriagem)
      carregarPacientesTriagem()
    }
    setOk(true)
    setTimeout(() => {
      setOk(false)
      setPac(null)
      setV(VITAIS_VAZIO)
      setRisco('')
      setQueixa('')
      carregarPacientesTriagem()
    }, 2500)
  }

  return (
    <AppShell usuario={usuario} title="Triagem — Classificação de Risco">
      <div className="flex h-full overflow-hidden">
        {/* Fila */}
        <div className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Stethoscope size={14} className="text-brand-600" /> Fila de triagem
            </div>
            <span className="badge-gray">{filaTriagem.length}</span>
          </div>

          {filaTriagem.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              <Inbox size={32} className="mx-auto mb-2" />
              <div className="text-xs">Nenhum paciente aguardando triagem</div>
            </div>
          )}

          <div className="space-y-2">
            {filaTriagem.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setPac(f)
                  atualizarStatusPaciente(f.id, 'em_triagem')
                  carregarPacientesTriagem()
                }}
                className={`w-full rounded-xl border-[1.5px] px-3 py-2.5 text-left transition-colors ${
                  pac?.id === f.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="font-mono text-sm font-extrabold text-brand-600">#{f.num}</div>
                <div className="mt-0.5 text-[13px] font-semibold text-slate-900">{f.nome}</div>
                <div className="text-[11px] text-slate-400">{f.esp}</div>
                {f.chegada && (
                  <div className="mt-1 text-[9px] text-slate-300">
                    Chegada: {new Date(f.chegada).toLocaleTimeString()}
                  </div>
                )}
              </button>
            ))}
          </div>

          <button onClick={carregarPacientesTriagem} className="btn-ghost btn-sm mt-3 w-full">
            <RefreshCw size={12} /> Atualizar fila
          </button>
        </div>

        {/* Área de triagem */}
        <main className="flex-1 overflow-y-auto p-5">
          {!pac ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <Stethoscope size={48} strokeWidth={1.5} />
              <div className="text-[15px] font-semibold">Selecione um paciente da fila para iniciar a triagem</div>
              {filaTriagem.length === 0 && (
                <div className="max-w-xs text-center text-[13px] text-slate-300">
                  Os pacientes aparecerão aqui quando a recepção enviá-los para triagem.
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {ok && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-800">
                  <CheckCircle2 size={16} /> Triagem finalizada! Paciente encaminhado ao médico.
                </div>
              )}

              {/* Cabeçalho do paciente */}
              <div className="card flex items-center gap-3.5 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-[15px] font-bold text-sky-700">
                  {iniciais(pac.nome)}
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900">{pac.nome}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{pac.esp} · Ficha #{pac.num}</div>
                </div>
              </div>

              {/* Sinais vitais */}
              <div className="card-pad">
                <div className="card-title flex items-center gap-1.5">
                  <Activity size={15} className="text-brand-600" /> Sinais vitais
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                  <VitalCard value={v.peso} onChange={set('peso')} l="Peso" u="kg" />
                  <VitalCard value={v.altura} onChange={set('altura')} l="Altura" u="cm" />
                  <VitalCard value={v.fc} onChange={set('fc')} l="Freq. cardíaca" u="bpm" st={stFC} />
                  <VitalCard value={v.sat} onChange={set('sat')} l="Saturação O₂" u="%" st={stSat} />
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <label className="mb-1 block text-[11px] font-semibold text-slate-500">PA (mmHg)</label>
                    <div className="flex items-center gap-1">
                      <input type="number" value={v.pas} onChange={set('pas')} placeholder="120"
                        className={`input border-[1.5px] py-1.5 text-center font-bold ${stPA ? CLS[stPA].border : ''}`} />
                      <span className="text-slate-400">/</span>
                      <input type="number" value={v.pad} onChange={set('pad')} placeholder="80"
                        className={`input border-[1.5px] py-1.5 text-center font-bold ${stPA ? CLS[stPA].border : ''}`} />
                    </div>
                    {stPA && (
                      <span className={`mt-1.5 ${CLS[stPA].badge}`}>
                        {stPA === 'normal' ? 'Normal' : stPA === 'atencao' ? 'Atenção' : 'Hipertensão'}
                      </span>
                    )}
                  </div>
                  <VitalCard value={v.temp} onChange={set('temp')} l="Temperatura" u="°C" st={stTemp} />
                  <VitalCard value={v.glic} onChange={set('glic')} l="Glicemia" u="mg/dL" st={stGlic} />
                  <VitalCard value={v.fr} onChange={set('fr')} l="Freq. resp." u="irpm" />
                </div>

                {imc && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                    <span className="text-[11px] font-semibold text-slate-500">IMC:</span>
                    <span className="text-xl font-extrabold text-emerald-800">{imc}</span>
                    <span className="text-xs text-slate-500">kg/m² — {imcC}</span>
                  </div>
                )}

                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                    Escala de dor: <strong className="text-sm text-slate-900">{v.dor}/10</strong>
                  </label>
                  <input type="range" min={0} max={10} value={v.dor} onChange={set('dor')} className="w-full accent-brand-600" />
                </div>
              </div>

              {/* Classificação de risco */}
              <div className="card-pad">
                <div className="card-title flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-amber-500" /> Classificação de risco — Manchester
                </div>
                <div className="flex flex-wrap gap-2">
                  {RISCO.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRisco(r.id)}
                      className={`min-w-[100px] flex-1 rounded-xl border-2 px-2 py-2.5 transition-all ${
                        risco === r.id ? r.cls : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className={`text-[11px] font-bold ${risco === r.id ? '' : 'text-slate-900'}`}>{r.label}</div>
                      <div className={`mt-0.5 text-[10px] ${risco === r.id ? 'opacity-80' : 'text-slate-400'}`}>{r.tempo}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Queixa principal */}
              <div className="card-pad">
                <div className="card-title flex items-center gap-1.5">
                  <FileText size={15} className="text-slate-500" /> Queixa principal
                </div>
                <textarea
                  value={queixa}
                  onChange={(e) => setQueixa(e.target.value)}
                  placeholder="Descreva a queixa principal do paciente..."
                  className="input min-h-[72px] resize-y"
                />
              </div>

              <button onClick={finalizar} className="btn-primary py-3.5 text-[15px]">
                <CheckCircle2 size={17} /> Finalizar triagem e encaminhar ao médico
              </button>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  )
}
