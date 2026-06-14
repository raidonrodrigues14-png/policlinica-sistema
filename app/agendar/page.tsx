'use client'
import { useState } from 'react'
import {
  Stethoscope, Heart, Baby, Flower2, Bone, Brain, Sparkles, MessageCircle,
  Salad, Dumbbell, Info, AlertTriangle, ArrowLeft, ArrowRight, PartyPopper,
  CalendarCheck2, Smartphone, type LucideIcon,
} from 'lucide-react'

type Etapa = 'identificacao' | 'especialidade' | 'horario' | 'confirmacao' | 'sucesso'

const ESPECIALIDADES: { id: string; nome: string; icon: LucideIcon; desc: string }[] = [
  { id: 'clinica', nome: 'Clínica Médica', icon: Stethoscope, desc: 'Consultas gerais e check-up' },
  { id: 'cardio', nome: 'Cardiologia', icon: Heart, desc: 'Coração e sistema cardiovascular' },
  { id: 'pediatria', nome: 'Pediatria', icon: Baby, desc: 'Crianças e adolescentes' },
  { id: 'gineco', nome: 'Ginecologia', icon: Flower2, desc: 'Saúde da mulher' },
  { id: 'ortopedia', nome: 'Ortopedia', icon: Bone, desc: 'Ossos, músculos e articulações' },
  { id: 'neuro', nome: 'Neurologia', icon: Brain, desc: 'Sistema nervoso' },
  { id: 'dermato', nome: 'Dermatologia', icon: Sparkles, desc: 'Pele, cabelo e unhas' },
  { id: 'psico', nome: 'Psicologia', icon: MessageCircle, desc: 'Saúde mental e emocional' },
  { id: 'nutri', nome: 'Nutrição', icon: Salad, desc: 'Alimentação e dieta' },
  { id: 'fisio', nome: 'Fisioterapia', icon: Dumbbell, desc: 'Reabilitação e movimento' },
]

const MEDICOS: Record<string, { nome: string; crm: string }[]> = {
  clinica: [{ nome: 'Dr. Roberto Nunes', crm: 'CRM/MA 12345' }],
  cardio: [{ nome: 'Dr. Carlos Mendes', crm: 'CRM/MA 54321' }],
  pediatria: [{ nome: 'Dra. Fernanda Lima', crm: 'CRM/MA 11111' }],
  gineco: [{ nome: 'Dra. Carla Souza', crm: 'CRM/MA 22222' }],
  ortopedia: [{ nome: 'Dr. Marcos Silva', crm: 'CRM/MA 33333' }],
  neuro: [{ nome: 'Dr. Paulo Mendes', crm: 'CRM/MA 44444' }],
  dermato: [{ nome: 'Dra. Ana Pereira', crm: 'CRM/MA 55555' }],
  psico: [{ nome: 'Psi. Lucia Costa', crm: 'CRP/MA 6789' }],
  nutri: [{ nome: 'Nutr. Rita Campos', crm: 'CRN/MA 1234' }],
  fisio: [{ nome: 'Ft. Joao Alves', crm: 'CREFITO 5678' }],
}

function gerarHorarios() {
  const ocupados = ['08:30', '10:00', '14:00', '15:30']
  const slots = []
  for (let h = 7; h < 17; h++) {
    for (const m of [0, 30]) {
      const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      slots.push({ hora, livre: !ocupados.includes(hora) })
    }
  }
  return slots
}

function gerarProtocolo() {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

const ETAPAS = ['identificacao', 'especialidade', 'horario', 'confirmacao']
const ETAPAS_LABEL = ['Identificação', 'Especialidade', 'Horário', 'Confirmação']

export default function AgendarPage() {
  const [etapa, setEtapa] = useState<Etapa>('identificacao')
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [nasc, setNasc] = useState('')
  const [esp, setEsp] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [proto, setProto] = useState('')
  const [erro, setErro] = useState('')

  const espObj = ESPECIALIDADES.find((e) => e.id === esp)
  const medObj = MEDICOS[esp]?.[0]
  const horarios = data ? gerarHorarios() : []

  const minData = new Date()
  minData.setDate(minData.getDate() + 1)
  const minDataStr = minData.toISOString().slice(0, 10)

  function confirmar() {
    const protocolo = gerarProtocolo()
    setProto(protocolo)

    // Persiste o agendamento no localStorage
    const agendamento = {
      id: protocolo,
      nome,
      cpf,
      nasc,
      esp,
      data,
      hora,
      proto: protocolo,
      medico: MEDICOS[esp]?.[0]?.nome || '',
      criado_em: new Date().toISOString(),
    }
    try {
      const stored = localStorage.getItem('agendamentos')
      const lista = stored ? JSON.parse(stored) : []
      lista.push(agendamento)
      localStorage.setItem('agendamentos', JSON.stringify(lista))
    } catch {}

    setEtapa('sucesso')
  }

  function formatCPF(v: string) {
    return v.replace(/\D/g, '').slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const etapaIdx = ETAPAS.indexOf(etapa)

  const Resumo = ({ rows }: { rows: [string, string][] }) => (
    <div>
      {rows.map(([l, v]) => (
        <div key={l} className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
          <span className="text-[13px] text-slate-500">{l}</span>
          <span className="text-[13px] font-bold text-slate-900">{v}</span>
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-navy-950 px-5 py-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-lg font-bold text-white">+</div>
        <div>
          <div className="text-sm font-bold text-white">Policlínica Municipal</div>
          <div className="text-[11px] text-slate-400">Agendamento Online</div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-6">
        {/* Progresso */}
        {etapa !== 'sucesso' && (
          <div className="mb-6">
            <div className="mb-1.5 flex justify-between">
              {ETAPAS_LABEL.map((l, i) => (
                <span key={l} className={`flex-1 text-center text-[10px] ${i <= etapaIdx ? 'font-bold text-brand-600' : 'text-slate-400'}`}>
                  {l}
                </span>
              ))}
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${((etapaIdx + 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 1 — IDENTIFICAÇÃO */}
        {etapa === 'identificacao' && (
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Olá! Vamos agendar</h1>
            <p className="mt-1 mb-5 text-sm text-slate-500">Informe seus dados para continuar</p>

            <div className="card mb-4 p-6">
              <div className="field">
                <label className="label">Nome completo</label>
                <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" />
              </div>
              <div className="field">
                <label className="label">CPF</label>
                <input className="input" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" />
              </div>
              <div className="field">
                <label className="label">Data de nascimento</label>
                <input type="date" className="input" value={nasc} onChange={(e) => setNasc(e.target.value)} />
              </div>

              {erro && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                  <AlertTriangle size={14} className="shrink-0" /> {erro}
                </div>
              )}

              <button
                className="btn-primary w-full py-3.5"
                onClick={() => {
                  if (!nome || !cpf || !nasc) { setErro('Preencha todos os campos.'); return }
                  setErro(''); setEtapa('especialidade')
                }}
              >
                Continuar <ArrowRight size={16} />
              </button>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-900">
              <Info size={15} className="mt-0.5 shrink-0" />
              O agendamento online é gratuito para pacientes do SUS cadastrados na rede municipal.
            </div>
          </div>
        )}

        {/* 2 — ESPECIALIDADE */}
        {etapa === 'especialidade' && (
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Qual especialidade?</h1>
            <p className="mt-1 mb-5 text-sm text-slate-500">Escolha o tipo de consulta</p>

            <div className="mb-4 grid grid-cols-2 gap-2.5">
              {ESPECIALIDADES.map((e) => {
                const Icon = e.icon
                const ativo = esp === e.id
                return (
                  <button
                    key={e.id}
                    onClick={() => setEsp(e.id)}
                    className={`rounded-xl border-2 px-3 py-4 text-center transition-all ${
                      ativo ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Icon size={26} className={`mx-auto mb-2 ${ativo ? 'text-brand-600' : 'text-slate-400'}`} />
                    <div className={`text-xs font-bold ${ativo ? 'text-brand-800' : 'text-slate-900'}`}>{e.nome}</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">{e.desc}</div>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => setEtapa('identificacao')} className="btn-secondary flex-1">
                <ArrowLeft size={15} /> Voltar
              </button>
              <button
                onClick={() => { if (!esp) { setErro('Escolha uma especialidade.'); return } setErro(''); setEtapa('horario') }}
                disabled={!esp}
                className="btn-primary flex-[2]"
              >
                Continuar <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* 3 — HORÁRIO */}
        {etapa === 'horario' && (
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Escolha o horário</h1>
            <p className="mt-1 mb-5 text-sm text-slate-500">
              {espObj?.nome} — {medObj?.nome}
            </p>

            <div className="card mb-4 p-5">
              <label className="label">Data da consulta</label>
              <input
                type="date"
                className="input"
                min={minDataStr}
                value={data}
                onChange={(e) => { setData(e.target.value); setHora('') }}
              />
            </div>

            {data && (
              <div className="card mb-4 p-5">
                <div className="card-title">Horários disponíveis</div>
                <div className="grid grid-cols-4 gap-2">
                  {horarios.map((slot) => (
                    <button
                      key={slot.hora}
                      onClick={() => slot.livre && setHora(slot.hora)}
                      disabled={!slot.livre}
                      className={`rounded-lg border-[1.5px] py-2.5 text-[13px] transition-all ${
                        hora === slot.hora
                          ? 'border-brand-600 bg-brand-600 font-bold text-white'
                          : slot.livre
                            ? 'border-slate-200 bg-white text-slate-900 hover:border-brand-400'
                            : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                      }`}
                    >
                      {slot.hora}
                    </button>
                  ))}
                </div>
                {hora && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-800">
                    <CalendarCheck2 size={15} />
                    Horário selecionado: {data.split('-').reverse().join('/')} às {hora}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2.5">
              <button onClick={() => setEtapa('especialidade')} className="btn-secondary flex-1">
                <ArrowLeft size={15} /> Voltar
              </button>
              <button
                onClick={() => { if (!data || !hora) return; setEtapa('confirmacao') }}
                disabled={!data || !hora}
                className="btn-primary flex-[2]"
              >
                Continuar <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* 4 — CONFIRMAÇÃO */}
        {etapa === 'confirmacao' && (
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Confirmar agendamento</h1>
            <p className="mt-1 mb-5 text-sm text-slate-500">Verifique os dados antes de confirmar</p>

            <div className="card mb-4 p-6">
              <Resumo
                rows={[
                  ['Paciente', nome],
                  ['CPF', cpf],
                  ['Especialidade', espObj?.nome ?? '—'],
                  ['Médico', medObj?.nome ?? '—'],
                  ['Data', data.split('-').reverse().join('/')],
                  ['Horário', hora],
                  ['Local', 'Policlínica Municipal'],
                  ['Tipo', 'Consulta SUS — Gratuita'],
                ]}
              />
            </div>

            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              Compareça 15 minutos antes do horário com documento de identidade e cartão SUS.
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => setEtapa('horario')} className="btn-secondary flex-1">
                <ArrowLeft size={15} /> Voltar
              </button>
              <button onClick={confirmar} className="btn-primary flex-[2]">
                Confirmar agendamento
              </button>
            </div>
          </div>
        )}

        {/* 5 — SUCESSO */}
        {etapa === 'sucesso' && (
          <div className="pt-4 text-center">
            <PartyPopper size={56} className="mx-auto mb-4 text-brand-500" />
            <h1 className="text-2xl font-extrabold text-emerald-800">Agendado com sucesso!</h1>
            <p className="mt-1 mb-6 text-sm text-slate-500">Seu agendamento foi confirmado</p>

            <div className="card mb-5 p-6 text-left">
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-center">
                <div className="text-[11px] text-slate-500">Número de protocolo</div>
                <div className="font-mono text-2xl font-extrabold tracking-widest text-emerald-800">{proto}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">Guarde este número</div>
              </div>
              <Resumo
                rows={[
                  ['Paciente', nome],
                  ['Especialidade', espObj?.nome ?? '—'],
                  ['Médico', medObj?.nome ?? '—'],
                  ['Data e hora', `${data.split('-').reverse().join('/')} às ${hora}`],
                  ['Local', 'Policlínica Municipal'],
                ]}
              />
            </div>

            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-left text-xs leading-relaxed text-sky-900">
              <Smartphone size={15} className="mt-0.5 shrink-0" />
              Você pode cancelar o agendamento até 2 horas antes pelo próprio site.
            </div>

            <button
              onClick={() => { setEtapa('identificacao'); setEsp(''); setData(''); setHora(''); setProto('') }}
              className="btn-primary w-full py-3"
            >
              Fazer outro agendamento
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
