'use client'
import { useEffect, useRef, useState } from 'react'
import {
  ClipboardList, Tv, UserPlus, Megaphone, Stethoscope, ArrowRight, Search,
  CheckCircle2, RefreshCw, MapPin, Loader2, Printer, Clock, MonitorPlay, ExternalLink, BellRing, CalendarDays,
} from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useUsuario } from '@/lib/auth'
import { useReactToPrint } from 'react-to-print'

const FILA_DEMO = [
  { id: '1', num: '016', nome: 'Joao Santos', esp: 'Clinica Medica', status: 'aguardando_triagem', cons: 'Consultorio 01' },
  { id: '2', num: '017', nome: 'Ana Rodrigues', esp: 'Pediatria', status: 'aguardando_triagem', cons: 'Consultorio 05' },
  { id: '3', num: '018', nome: 'Pedro Alves', esp: 'Ortopedia', status: 'aguardando_medico', cons: 'Consultorio 02' },
  { id: '4', num: '019', nome: 'Lucia Ferreira', esp: 'Ginecologia', status: 'aguardando_triagem', cons: 'Consultorio 04' },
  { id: '5', num: '015', nome: 'Maria Silva', esp: 'Cardiologia', status: 'aguardando_triagem', cons: 'Consultorio 03' },
]

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  aguardando_triagem: { label: 'Aguard. triagem', cls: 'badge-yellow' },
  em_triagem: { label: 'Em triagem', cls: 'badge-blue' },
  aguardando_medico: { label: 'Aguard. médico', cls: 'badge-orange' },
  em_atendimento: { label: 'Em atendimento', cls: 'badge-green' },
  finalizado: { label: 'Finalizado', cls: 'badge-green' },
}

const PROX_STATUS: Record<string, string> = {
  aguardando_triagem: 'em_triagem',
  em_triagem: 'aguardando_medico',
  aguardando_medico: 'em_atendimento',
  em_atendimento: 'finalizado',
}

// ── Busca de paciente no CadSUS (RNDS/DataSUS com fallback local) ──
async function buscarPacienteCadSUS(termo: string, tipo: 'cpf' | 'nome'): Promise<any | null> {
  if (!termo || termo.length < (tipo === 'cpf' ? 11 : 3)) return null

  if (tipo === 'cpf') {
    const cpfNumerico = termo.replace(/\D/g, '')
    if (cpfNumerico.length !== 11) return null
    try {
      const response = await fetch(
        `https://rnds.saude.gov.br/fhir/Patient?identifier=CPF|${cpfNumerico}`,
        { method: 'GET', headers: { Accept: 'application/fhir+json' } }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.entry && data.entry.length > 0) {
          const patient = data.entry[0].resource
          return {
            nome: patient.name?.[0]?.text || patient.name?.[0]?.given?.join(' ') + ' ' + (patient.name?.[0]?.family || ''),
            cpf: cpfNumerico,
            dataNascimento: patient.birthDate,
            sexo: patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : 'I',
            municipio: patient.address?.[0]?.city || '',
            cns: patient.identifier?.find((id: any) => id.system?.includes('CNS'))?.value || '',
            telefone: patient.telecom?.find((t: any) => t.system === 'phone')?.value || '',
            endereco: patient.address?.[0]?.line?.[0] || '',
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar no CadSUS via RNDS:', error)
    }
  } else {
    try {
      const nomeEncoded = encodeURIComponent(termo)
      const response = await fetch(
        `https://rnds.saude.gov.br/fhir/Patient?name=${nomeEncoded}&_count=10`,
        { method: 'GET', headers: { Accept: 'application/fhir+json' } }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.entry && data.entry.length > 0) {
          return data.entry.map((entry: any) => {
            const patient = entry.resource
            return {
              nome: patient.name?.[0]?.text || patient.name?.[0]?.given?.join(' ') + ' ' + (patient.name?.[0]?.family || ''),
              cpf: patient.identifier?.find((id: any) => id.system?.includes('CPF'))?.value || '',
              dataNascimento: patient.birthDate,
              sexo: patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : 'I',
              municipio: patient.address?.[0]?.city || '',
              cns: patient.identifier?.find((id: any) => id.system?.includes('CNS'))?.value || '',
              telefone: patient.telecom?.find((t: any) => t.system === 'phone')?.value || '',
              endereco: patient.address?.[0]?.line?.[0] || '',
            }
          })
        }
      }
    } catch (error) {
      console.error('Erro na busca por nome no RNDS:', error)
    }

    try {
      const nomeEncoded = encodeURIComponent(termo)
      const response = await fetch(
        `https://apisus.saude.gov.br/cadsus/api/paciente/nome/${nomeEncoded}`,
        { headers: { Accept: 'application/json' } }
      )
      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          return data.map((p: any) => ({
            nome: p.nome || p.nomeCompleto || '',
            cpf: p.cpf || '',
            dataNascimento: p.dataNascimento || p.nascimento,
            sexo: p.sexo === 'MASCULINO' ? 'M' : p.sexo === 'FEMININO' ? 'F' : 'I',
            municipio: p.municipio || p.cidade || '',
            cns: p.cns || p.numeroCNS || '',
            telefone: p.telefone || p.telefoneCelular || '',
            endereco: p.endereco || p.logradouro || '',
          }))
        }
      }
    } catch (error) {
      console.error('Erro na busca por nome no DataSUS:', error)
    }
  }

  // Mock para desenvolvimento/teste
  if (process.env.NODE_ENV === 'development') {
    const mockCadSUS: Record<string, any> = {
      '12345678901': { nome: 'João Silva Santos', dataNascimento: '1985-03-15', sexo: 'M', municipio: 'São Paulo', cns: '123456789012345', telefone: '(11) 98765-4321', endereco: 'Rua das Flores, 123' },
      '98765432109': { nome: 'Maria Oliveira Souza', dataNascimento: '1990-07-22', sexo: 'F', municipio: 'Rio de Janeiro', cns: '987654321098765', telefone: '(21) 91234-5678', endereco: 'Av. Atlântica, 500' },
      '11122233344': { nome: 'Pedro Costa Lima', dataNascimento: '1978-11-30', sexo: 'M', municipio: 'Belo Horizonte', cns: '111222333444555', telefone: '(31) 99876-5432', endereco: 'Rua da Bahia, 789' },
      'Ana Rodrigues': { nome: 'Ana Rodrigues Silva', dataNascimento: '1992-05-18', sexo: 'F', municipio: 'Curitiba', cns: '555444333222111', telefone: '(41) 98765-4321', endereco: 'Rua XV de Novembro, 200' },
      'Carlos Alberto': { nome: 'Carlos Alberto Mendes', dataNascimento: '1980-12-10', sexo: 'M', municipio: 'Porto Alegre', cns: '999888777666555', telefone: '(51) 99876-5432', endereco: 'Av. Protásio Alves, 1000' },
    }
    if (tipo === 'cpf') {
      const mockData = mockCadSUS[termo]
      if (mockData) return { ...mockData, cpf: termo }
    } else {
      const termoLower = termo.toLowerCase()
      const resultados = Object.entries(mockCadSUS)
        .filter(([key, value]) => key.toLowerCase().includes(termoLower) || value.nome.toLowerCase().includes(termoLower))
        .map(([key, value]) => ({ ...value, cpf: key.length === 11 ? key : '' }))
      return resultados.length > 0 ? resultados : null
    }
  }

  return null
}

const FORM_VAZIO = { nome: '', cpf: '', nascimento: '', sexo: 'M', municipio: '', especialidade: '', cns: '', telefone: '', endereco: '' }

function TempoEspera({ chegada }: { chegada?: string }) {
  const [min, setMin] = useState(0)
  useEffect(() => {
    if (!chegada) return
    const calc = () => setMin(Math.floor((Date.now() - new Date(chegada).getTime()) / 60000))
    calc()
    const t = setInterval(calc, 30000)
    return () => clearInterval(t)
  }, [chegada])
  if (!chegada) return null
  const cls =
    min < 20 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : min < 40 ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-rose-100 text-rose-700 border-rose-200'
  const h = Math.floor(min / 60)
  const m = min % 60
  const label = min < 60 ? `${min}m` : `${h}h${m > 0 ? m + 'm' : ''}`
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-bold ${cls}`}
    >
      <Clock size={10} />
      {label}
    </span>
  )
}


const ESPS = [
  'Clínica Geral','Cardiologia','Neurologia','Ortopedia','Pediatria','Ginecologia',
  'Dermatologia','Oftalmologia','Psiquiatria','Urologia','Endocrinologia','Otorrinolaringologia',
]
const HORARIOS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00']

function AgendamentoTab() {
  const usuario = useUsuario(['recepcionista', 'gestor', 'medico'])
  const [form, setForm] = useState({
    nome: '', cpf: '', dataNascimento: '', sexo: 'Masculino', municipio: '',
    especialidade: 'Clínica Geral', dataAgendamento: '', horario: '09:00',
    profissional: '', observacoes: '', telefone: '',
  })
  const [sucesso, setSucesso] = useState(false)
  const [protocolo, setProtocolo] = useState('')
  const [confirmado, setConfirmado] = useState<any>(null)
  const [lista, setLista] = useState<any[]>([])

  function carregar() {
    try {
      const raw = localStorage.getItem('agendamentos_consultas')
      setLista(raw ? JSON.parse(raw) : [])
    } catch { setLista([]) }
  }

  useEffect(() => { carregar() }, [])

  function salvar() {
    if (!form.nome || !form.dataNascimento || !form.municipio) {
      alert('Preencha: Nome, Data de nascimento e Município (*)')
      return
    }
    const proto = Math.random().toString(36).substr(2, 8).toUpperCase()
    const novo = {
      id: Date.now(), ...form,
      dataSolicitacao: new Date().toISOString(),
      status: 'agendado', medico: usuario?.nome || '', protocolo: proto,
    }
    const raw = localStorage.getItem('agendamentos_consultas')
    const agendamentos = raw ? JSON.parse(raw) : []
    agendamentos.push(novo)
    localStorage.setItem('agendamentos_consultas', JSON.stringify(agendamentos))

    const pacRaw = localStorage.getItem('pacientes')
    const pacientes = pacRaw ? JSON.parse(pacRaw) : []
    if (!pacientes.find((p: any) => p.cpf === form.cpf)) {
      pacientes.push({ id: Date.now(), nome: form.nome, cpf: form.cpf, dataNascimento: form.dataNascimento, sexo: form.sexo, municipio: form.municipio, criado_em: new Date().toISOString() })
      localStorage.setItem('pacientes', JSON.stringify(pacientes))
    }

    setProtocolo(proto)
    setConfirmado(novo)
    setSucesso(true)
    carregar()

    const tel = form.telefone?.replace(/\D/g, '')
    if (tel) {
      const dataFmt = form.dataAgendamento ? form.dataAgendamento.split('-').reverse().join('/') : ''
      const linha1 = encodeURIComponent('✅ *Agendamento Confirmado!*\n\nOlá, ' + form.nome + '!\nSeu agendamento foi confirmado.\n\n')
      const linha2 = encodeURIComponent('📋 *Protocolo:* ' + proto + '\n🩺 *Especialidade:* ' + form.especialidade + '\n👨‍⚕️ *Médico:* ' + (form.profissional || 'A definir') + '\n📅 *Data:* ' + dataFmt + ' às ' + form.horario + '\n📍 *Local:* Policlínica Municipal\n\nChegue 15 min antes com RG e cartão SUS.')
      window.open('https://wa.me/55' + tel + '?text=' + linha1 + linha2, '_blank')
    }

    setForm({ nome: '', cpf: '', dataNascimento: '', sexo: 'Masculino', municipio: '', especialidade: 'Clínica Geral', dataAgendamento: '', horario: '09:00', profissional: '', observacoes: '', telefone: '' })
  }

  return (
    <div className="space-y-4 p-4">
      {sucesso && confirmado && (
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-md">
          <div className="flex flex-col items-center gap-1 bg-emerald-600 px-6 py-5 text-center text-white">
            <CheckCircle2 size={32} className="mb-1 opacity-90" />
            <div className="text-xl font-extrabold">Agendado com sucesso!</div>
            <div className="text-[13px] font-medium opacity-80">Seu agendamento foi confirmado</div>
          </div>
          <div className="mx-6 mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Número de protocolo</div>
            <div className="mt-1 font-mono text-2xl font-extrabold tracking-widest text-emerald-800">{protocolo}</div>
            <div className="mt-0.5 text-[10px] text-emerald-500">Guarde este número</div>
          </div>
          <div className="divide-y divide-slate-100 px-6 py-3">
            {([['Paciente', confirmado.nome],['Especialidade', confirmado.especialidade],['Médico', confirmado.profissional || 'A definir'],['Data e hora', confirmado.dataAgendamento ? confirmado.dataAgendamento.split('-').reverse().join('/') + ' às ' + confirmado.horario : confirmado.horario],['Local','Policlínica Municipal']] as [string,string][]).map(([l,v]) => (
              <div key={l} className="flex items-center justify-between py-2.5">
                <span className="text-[12px] text-slate-400">{l}</span>
                <span className="text-[13px] font-bold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="px-6 pb-4">
            <button onClick={() => { setSucesso(false); setConfirmado(null) }} className="w-full rounded-xl border border-slate-200 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-50">Fechar</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-[15px] font-bold text-slate-900">
          <CalendarDays size={18} className="text-brand-600" /> Agendar Consulta
        </div>
        <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
          <div className="field md:col-span-2"><label className="label">Nome completo *</label><input className="input" placeholder="Nome do paciente" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
          <div className="field"><label className="label">CPF</label><input className="input" placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} /></div>
          <div className="field"><label className="label">Data de nascimento *</label><input type="date" className="input" value={form.dataNascimento} onChange={e => setForm({ ...form, dataNascimento: e.target.value })} /></div>
          <div className="field"><label className="label">Sexo</label><select className="input" value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })}><option>Masculino</option><option>Feminino</option><option>Outro</option></select></div>
          <div className="field"><label className="label">Município *</label><input className="input" placeholder="Cidade" value={form.municipio} onChange={e => setForm({ ...form, municipio: e.target.value })} /></div>
          <div className="field"><label className="label">WhatsApp / Telefone</label><input className="input" placeholder="(99) 99999-9999" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
          <div className="field"><label className="label">Data agendamento *</label><input type="date" className="input" value={form.dataAgendamento} onChange={e => setForm({ ...form, dataAgendamento: e.target.value })} /></div>
          <div className="field"><label className="label">Horário</label><select className="input" value={form.horario} onChange={e => setForm({ ...form, horario: e.target.value })}>{HORARIOS.map(h => <option key={h}>{h}</option>)}</select></div>
          <div className="field"><label className="label">Profissional</label><input className="input" placeholder="Profissional responsável" value={form.profissional} onChange={e => setForm({ ...form, profissional: e.target.value })} /></div>
          <div className="field"><label className="label">Especialidade</label><select className="input" value={form.especialidade} onChange={e => setForm({ ...form, especialidade: e.target.value })}>{ESPS.map(e => <option key={e}>{e}</option>)}</select></div>
          <div className="field md:col-span-2"><label className="label">Observações</label><textarea className="input min-h-[72px] resize-none" placeholder="Observações adicionais..." value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
        </div>
        <button onClick={salvar} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-[14px] font-bold text-white hover:bg-brand-700">
          <CalendarDays size={16} /> Agendar consulta
        </button>
      </div>

      {lista.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-[13px] font-bold text-slate-700">Consultas Agendadas ({lista.length})</div>
          <div className="space-y-2">
            {[...lista].reverse().slice(0, 10).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
                <div><div className="text-[13px] font-semibold text-slate-900">{a.nome}</div><div className="text-[11px] text-slate-500">{a.especialidade} · {a.municipio}</div></div>
                <div className="text-right"><div className="text-[11px] font-bold text-brand-600">{a.dataAgendamento ? a.dataAgendamento.split('-').reverse().join('/') : ''}</div><div className="text-[10px] text-slate-400">{a.horario}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


function waUrl(tel: string, msg: string) {
  const t = tel.replace(/\D/g, '')
  return t ? `https://wa.me/55${t}?text=${msg}` : `https://wa.me/?text=${msg}`
}

function fmtData(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function msgLembrete(a: any, dia: 'hoje' | 'amanha') {
  const quando = dia === 'hoje' ? 'HOJE' : 'amanhã'
  return encodeURIComponent(
    `Olá, ${a.nome}! 👋\n\nLembramos que você tem consulta marcada para *${quando}* (${fmtData(a.dataAgendamento)}) às *${a.horario}*.\n\n🏥 Especialidade: ${a.especialidade}\n📍 Policlínica Municipal — Alto Alegre do Maranhão\n\nChegue com 15 minutos de antecedência com documento de identidade e cartão do SUS. Até logo! 😊`
  )
}

function LembretesTab() {
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [enviados, setEnviados] = useState<number[]>([])

  useEffect(() => {
    function carregar() {
      try {
        const raw = localStorage.getItem('agendamentos_consultas')
        setAgendamentos(raw ? JSON.parse(raw) : [])
      } catch { setAgendamentos([]) }
    }
    carregar()
    window.addEventListener('storage', carregar)
    return () => window.removeEventListener('storage', carregar)
  }, [])

  function getAmanha() {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }

  function getHoje() {
    return new Date().toISOString().slice(0, 10)
  }

  const amanha = getAmanha()
  const hoje = getHoje()
  const deAmanha = [...agendamentos]
    .filter(a => a.dataAgendamento === amanha && a.status !== 'cancelado')
    .sort((a, b) => a.horario.localeCompare(b.horario))
  const deHoje = [...agendamentos]
    .filter(a => a.dataAgendamento === hoje && a.status !== 'cancelado')
    .sort((a, b) => a.horario.localeCompare(b.horario))

  function marcar(id: number) {
    setEnviados(prev => prev.includes(id) ? prev : [...prev, id])
  }

  function renderCard(a: any, dia: 'hoje' | 'amanha') {
    const enviado = enviados.includes(a.id)
    const url = waUrl(a.telefone || '', msgLembrete(a, dia))
    return (
      <div key={a.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${enviado ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-900">{a.nome}</span>
            {enviado && <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            {a.especialidade} · {a.horario}{a.profissional ? ` · ${a.profissional}` : ''}
          </div>
          {a.telefone ? (
            <div className="mt-0.5 text-[11px] text-slate-400">{a.telefone}</div>
          ) : (
            <div className="mt-0.5 text-[11px] text-amber-500">⚠ Sem telefone cadastrado</div>
          )}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => marcar(a.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors ${enviado ? 'border border-emerald-300 bg-emerald-100 text-emerald-700' : 'bg-green-500 text-white hover:bg-green-600'}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {enviado ? 'Reenviado' : 'Enviar'}
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
        <BellRing size={18} className="text-brand-600" />
        <div>
          <div className="text-[13px] font-bold text-brand-900">Lembretes de Consulta via WhatsApp</div>
          <div className="text-[11px] text-brand-600">Clique em "Enviar" para abrir o WhatsApp com a mensagem já preenchida</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[22px] font-extrabold text-brand-700">{deAmanha.length}</div>
          <div className="text-[10px] text-brand-500">consultas amanhã</div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-[12px] font-bold uppercase tracking-widest text-slate-500">
            Amanhã — {fmtData(amanha)} ({deAmanha.length})
          </span>
        </div>
        {deAmanha.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-[13px] text-slate-400">
            Nenhuma consulta agendada para amanhã
          </div>
        ) : (
          <div className="space-y-2">{deAmanha.map(a => renderCard(a, 'amanha'))}</div>
        )}
      </div>

      {deHoje.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-slate-500">
              Hoje — {fmtData(hoje)} ({deHoje.length})
            </span>
          </div>
          <div className="space-y-2">{deHoje.map(a => renderCard(a, 'hoje'))}</div>
        </div>
      )}

      {agendamentos.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          <BellRing size={32} className="mx-auto mb-3 opacity-30" />
          <div className="text-sm">Nenhum agendamento cadastrado ainda.</div>
          <div className="mt-1 text-[12px]">Agende consultas pelo Prontuário.</div>
        </div>
      )}
    </div>
  )
}

export default function RecepcaoPage() {
  const usuario = useUsuario(['recepcionista'])
  const [aba, setAba] = useState<'fila' | 'cadastro' | 'painel' | 'tv' | 'lembretes' | 'agendar'>('fila')
  const [fila, setFila] = useState(() => {
    const now = Date.now()
    return FILA_DEMO.map((f, i) => ({
      ...f,
      chegada: new Date(now - (FILA_DEMO.length - i) * 8 * 60 * 1000).toISOString(),
    }))
  })
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgTipo, setMsgTipo] = useState<'ok' | 'busca' | 'aviso' | 'erro'>('ok')
  const [buscandoCadSUS, setBuscandoCadSUS] = useState(false)
  const [cpfEncontrado, setCpfEncontrado] = useState(false)
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([])
  const [mostrarResultados, setMostrarResultados] = useState(false)

  // Painel TV
  const [chamadaAtual, setChamadaAtual] = useState<any>(null)
  const [historico, setHistorico] = useState<any[]>([])
  const [hora, setHora] = useState('')
  const [pisc, setPisc] = useState(false)
  const [autoMode, setAutoMode] = useState(false)

  // Ficha de impressão
  const fichaRef = useRef<HTMLDivElement>(null)
  const [fichaImprimir, setFichaImprimir] = useState<{ nome: string; num: string; esp: string; chegada: string } | null>(null)
  const handlePrint = useReactToPrint({ contentRef: fichaRef })

  useEffect(() => {
    if (!localStorage.getItem('pacientes_triagem')) {
      localStorage.setItem('pacientes_triagem', JSON.stringify([]))
    }
  }, [])

  // Carrega agendamentos de hoje e insere na fila se ainda não estiverem
  useEffect(() => {
    try {
      const stored = localStorage.getItem('agendamentos')
      if (!stored) return
      const hoje = new Date().toISOString().slice(0, 10)
      const agendados: any[] = JSON.parse(stored).filter((a: any) => a.data === hoje)
      if (agendados.length === 0) return
      setFila((filaAtual) => {
        const idsExistentes = new Set(filaAtual.map((f) => f.id))
        const novos = agendados
          .filter((a) => !idsExistentes.has(`ag_${a.id}`))
          .map((a, i) => ({
            id: `ag_${a.id}`,
            num: String(100 + i + filaAtual.length).padStart(3, '0'),
            nome: a.nome,
            esp: a.esp,
            status: 'aguardando_triagem' as const,
            cons: 'Agendado',
            chegada: `${a.data}T${a.hora}:00`,
          }))
        return novos.length > 0 ? [...filaAtual, ...novos] : filaAtual
      })
    } catch {}
  }, [])

  // Sincroniza fila com o painel TV
  useEffect(() => {
    const tvFila = fila.filter((f) => ['aguardando_triagem', 'aguardando_medico'].includes(f.status))
    localStorage.setItem('tv_fila', JSON.stringify(tvFila))
  }, [fila])

  useEffect(() => {
    const t = setInterval(() => setHora(new Date().toLocaleTimeString('pt-BR')), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!autoMode) return
    const aguardandoFila = fila.filter((f) => f.status === 'aguardando_triagem' || f.status === 'aguardando_medico')
    if (aguardandoFila.length === 0) return
    const t = setInterval(() => chamarPaciente(aguardandoFila[0]), 12000)
    return () => clearInterval(t)
  }, [autoMode, fila])

  if (!usuario) return null

  function avisar(texto: string, tipo: 'ok' | 'busca' | 'aviso' | 'erro' = 'ok', ms = 3000) {
    setMsg(texto)
    setMsgTipo(tipo)
    if (ms) setTimeout(() => setMsg(''), ms)
  }

  const buscarPorCPF = async (cpf: string) => {
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) return null
    setBuscandoCadSUS(true)
    avisar('Buscando paciente no CadSUS por CPF...', 'busca', 0)
    try {
      const paciente = await buscarPacienteCadSUS(cpfLimpo, 'cpf')
      if (paciente) {
        setForm((f) => ({
          ...f,
          nome: paciente.nome,
          nascimento: paciente.dataNascimento,
          sexo: paciente.sexo,
          municipio: paciente.municipio,
          cns: paciente.cns || '',
          telefone: paciente.telefone || '',
          endereco: paciente.endereco || '',
          cpf: cpfLimpo,
        }))
        setCpfEncontrado(true)
        setMostrarResultados(false)
        avisar(`Paciente encontrado no CadSUS: ${paciente.nome}`, 'ok')
        return paciente
      }
      avisar('CPF não encontrado no CadSUS. Preencha os dados manualmente.', 'aviso')
      return null
    } catch (error) {
      console.error('Erro na busca do CadSUS:', error)
      avisar('Erro ao consultar CadSUS. Preencha os dados manualmente.', 'erro')
      return null
    } finally {
      setBuscandoCadSUS(false)
    }
  }

  const buscarPorNome = async (nome: string) => {
    if (nome.length < 3) return
    setBuscandoCadSUS(true)
    avisar('Buscando pacientes no CadSUS...', 'busca', 0)
    try {
      const resultados = await buscarPacienteCadSUS(nome, 'nome')
      if (resultados && resultados.length > 0) {
        setResultadosBusca(resultados)
        setMostrarResultados(true)
        avisar(`Encontrados ${resultados.length} paciente(s) no CadSUS. Selecione um abaixo.`, 'busca')
      } else {
        setResultadosBusca([])
        setMostrarResultados(false)
        avisar('Nenhum paciente encontrado no CadSUS. Preencha os dados manualmente.', 'aviso')
      }
    } catch (error) {
      console.error('Erro na busca por nome:', error)
      setResultadosBusca([])
      setMostrarResultados(false)
      avisar('Erro ao consultar CadSUS. Preencha os dados manualmente.', 'erro')
    } finally {
      setBuscandoCadSUS(false)
    }
  }

  const handleCpfChange = (cpf: string) => {
    setForm((f) => ({ ...f, cpf }))
    setCpfEncontrado(false)
    if ((window as any).cpfTimeout) clearTimeout((window as any).cpfTimeout)
    ;(window as any).cpfTimeout = setTimeout(async () => {
      const cpfLimpo = cpf.replace(/\D/g, '')
      if (cpfLimpo.length === 11) await buscarPorCPF(cpf)
    }, 500)
  }

  const handleNomeChange = (nome: string) => {
    setForm((f) => ({ ...f, nome }))
    setCpfEncontrado(false)
    setMostrarResultados(false)
    if ((window as any).nomeTimeout) clearTimeout((window as any).nomeTimeout)
    ;(window as any).nomeTimeout = setTimeout(async () => {
      if (nome.length >= 3) await buscarPorNome(nome)
    }, 500)
  }

  const selecionarPacienteResultado = (paciente: any) => {
    setForm({
      nome: paciente.nome,
      cpf: paciente.cpf || '',
      nascimento: paciente.dataNascimento || '',
      sexo: paciente.sexo || 'M',
      municipio: paciente.municipio || '',
      especialidade: form.especialidade,
      cns: paciente.cns || '',
      telefone: paciente.telefone || '',
      endereco: paciente.endereco || '',
    })
    setCpfEncontrado(true)
    setMostrarResultados(false)
    setResultadosBusca([])
    avisar(`Paciente "${paciente.nome}" selecionado do CadSUS.`, 'ok')
  }

  const aguardando = fila.filter((f) => ['aguardando_triagem', 'aguardando_medico'].includes(f.status)).length
  const atendimento = fila.filter((f) => f.status === 'em_atendimento').length
  const triagem = fila.filter((f) => f.status === 'em_triagem').length
  const finalizados = fila.filter((f) => f.status === 'finalizado').length

  function avancarStatus(id: string) {
    const paciente = fila.find((f) => f.id === id)
    const novoStatus = PROX_STATUS[paciente?.status || '']
    setFila((f) => f.map((item) => (item.id === id ? { ...item, status: novoStatus || item.status } : item)))
    if (paciente && novoStatus === 'em_triagem') enviarParaTriagemStorage(paciente)
  }

  const enviarParaTriagemStorage = (paciente: any) => {
    const pacienteParaTriagem = {
      id: paciente.id,
      num: paciente.num,
      nome: paciente.nome,
      esp: paciente.esp,
      status: 'aguardando_triagem',
      cons: paciente.cons,
      chegada: new Date().toISOString(),
      sinais_vitais: null,
      queixa: '',
      risco: null,
      dados_triagem: null,
    }
    const triagemPacientes = JSON.parse(localStorage.getItem('pacientes_triagem') || '[]')
    const existe = triagemPacientes.some((p: any) => p.id === paciente.id)
    if (!existe) {
      triagemPacientes.push(pacienteParaTriagem)
      localStorage.setItem('pacientes_triagem', JSON.stringify(triagemPacientes))
      avisar(`Paciente ${paciente.nome} enviado para triagem.`, 'ok')
    }
  }

  function enviarParaTriagem(paciente: any) {
    setFila((f) => f.map((item) => (item.id === paciente.id ? { ...item, status: 'em_triagem' } : item)))
    enviarParaTriagemStorage(paciente)
  }

  function chamarPaciente(paciente: any) {
    setChamadaAtual(paciente)
    setHistorico((h) => [paciente, ...h].slice(0, 5))
    setPisc(true)
    setTimeout(() => setPisc(false), 1500)
    localStorage.setItem('tv_chamada_atual', JSON.stringify({ ...paciente, timestamp: new Date().toISOString() }))
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(`${paciente.nome}, dirija-se ao ${paciente.cons}.`)
      u.lang = 'pt-BR'
      u.rate = 0.9
      window.speechSynthesis.speak(u)
    }
    avancarStatus(paciente.id)
  }

  async function salvarPaciente(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome) {
      avisar('Nome do paciente é obrigatório.', 'erro')
      return
    }
    setSalvando(true)
    await new Promise((r) => setTimeout(r, 800))

    const novoId = String(Date.now())
    const novoNum = String(20 + fila.length).padStart(3, '0')
    const chegadaAgora = new Date().toISOString()
    const novoPaciente = {
      id: novoId, num: novoNum, nome: form.nome,
      esp: form.especialidade || 'Clinica Medica',
      status: 'aguardando_triagem', cons: 'Aguardando sala',
      chegada: chegadaAgora,
    }

    const pacientesStorage = localStorage.getItem('pacientes')
    const pacientes = pacientesStorage ? JSON.parse(pacientesStorage) : []
    const existe = pacientes.find((p: any) => p.cpf === form.cpf)
    if (!existe && form.cpf) {
      pacientes.push({
        id: novoId, num: novoNum, nome: form.nome, cpf: form.cpf,
        dataNascimento: form.nascimento, sexo: form.sexo, municipio: form.municipio,
        cns: form.cns, telefone: form.telefone, endereco: form.endereco,
        criado_em: new Date().toISOString(),
        fonte: cpfEncontrado ? 'cadsus' : 'manual',
      })
      localStorage.setItem('pacientes', JSON.stringify(pacientes))
    }

    setFila((f) => [...f, novoPaciente])
    setFichaImprimir({ nome: form.nome, num: novoNum, esp: form.especialidade || 'Clinica Medica', chegada: chegadaAgora })
    avisar(`Paciente ${form.nome} cadastrado! Ficha #${novoNum} emitida.${cpfEncontrado ? ' Dados importados do CadSUS.' : ''}`, 'ok')
    setForm(FORM_VAZIO)
    setCpfEncontrado(false)
    setMostrarResultados(false)
    setResultadosBusca([])
    setSalvando(false)
    setTimeout(() => setAba('fila'), 4000)
  }

  const MSG_CLS = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    busca: 'border-sky-200 bg-sky-50 text-sky-800',
    aviso: 'border-amber-200 bg-amber-50 text-amber-800',
    erro: 'border-rose-200 bg-rose-50 text-rose-800',
  }

  const KPIS = [
    { label: 'Aguardando', valor: aguardando, cls: 'text-amber-500' },
    { label: 'Em triagem', valor: triagem, cls: 'text-sky-500' },
    { label: 'Atendimento', valor: atendimento, cls: 'text-brand-600' },
    { label: 'Finalizados', valor: finalizados, cls: 'text-violet-500' },
  ]

  const TABS = [
    { id: 'fila', label: 'Fila do dia', icon: ClipboardList },
    { id: 'painel', label: 'Painel de chamadas', icon: Tv },
    { id: 'cadastro', label: 'Novo paciente', icon: UserPlus },
    { id: 'tv', label: 'TV', icon: MonitorPlay },
    { id: 'lembretes', label: 'Lembretes', icon: BellRing },
    { id: 'agendar', label: 'Agendar', icon: CalendarDays },
  ] as const

  return (
    <AppShell usuario={usuario} title="Recepção">
      <div className="p-5">
        {msg && (
          <div className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-semibold ${MSG_CLS[msgTipo]}`}>
            {msgTipo === 'busca' ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            {msg}
          </div>
        )}

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className="card px-5 py-4">
              <div className="kpi-label">{k.label}</div>
              <div className={`kpi-value ${k.cls}`}>{k.valor}</div>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="card overflow-hidden">
          <div className="flex border-b border-slate-200 px-2">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setAba(tab.id)}
                  className={`tab flex items-center gap-2 ${aba === tab.id ? 'tab-active' : ''}`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="p-5">
            {/* FILA */}
            {aba === 'fila' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <button onClick={() => { const now = Date.now(); setFila(FILA_DEMO.map((f, i) => ({ ...f, chegada: new Date(now - (FILA_DEMO.length - i) * 8 * 60 * 1000).toISOString() }))) }} className="btn-ghost btn-sm">
                    <RefreshCw size={13} /> Resetar fila
                  </button>
                  <span className="text-xs text-slate-500">
                    Total: {fila.filter((f) => f.status !== 'finalizado').length} pacientes
                  </span>
                </div>

                <div className="space-y-2">
                  {fila.filter((f) => f.status !== 'finalizado').map((f) => {
                    const cfg = STATUS_CFG[f.status] || STATUS_CFG.aguardando_triagem
                    const podeChamar = ['aguardando_triagem', 'aguardando_medico'].includes(f.status)
                    const aguardandoTriagem = f.status === 'aguardando_triagem'
                    return (
                      <div key={f.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <span className="min-w-12 font-mono text-base font-extrabold text-brand-600">#{f.num}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-slate-900">{f.nome}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            {f.esp} · {f.cons}
                            <TempoEspera chegada={(f as any).chegada} />
                          </div>
                        </div>
                        <span className={cfg.cls}>{cfg.label}</span>
                        {aguardandoTriagem && (
                          <button onClick={() => enviarParaTriagem(f)} className="btn-info btn-sm">
                            <Stethoscope size={13} /> Enviar p/ triagem
                          </button>
                        )}
                        {podeChamar && !aguardandoTriagem && (
                          <button onClick={() => { chamarPaciente(f); setAba('painel') }} className="btn-info btn-sm">
                            <Megaphone size={13} /> Chamar
                          </button>
                        )}
                        <button onClick={() => avancarStatus(f.id)} className="btn-primary btn-sm">
                          Avançar <ArrowRight size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>

                {fila.filter((f) => f.status !== 'finalizado').length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-400" />
                    <div className="text-sm font-semibold">Fila vazia! Todos atendidos.</div>
                  </div>
                )}
              </div>
            )}

            {/* PAINEL */}
            {aba === 'painel' && (
              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div>
                  <div
                    className={`mb-4 rounded-2xl border-2 p-6 transition-all duration-300 ${
                      pisc ? 'border-brand-400 bg-navy-800' : 'border-navy-800 bg-navy-900'
                    }`}
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-400" />
                      <span className="text-[11px] font-bold tracking-widest text-brand-400 uppercase">
                        {chamadaAtual ? 'Chamando agora' : 'Aguardando chamada'}
                      </span>
                      <span className="ml-auto font-mono text-sm font-bold text-white">{hora}</span>
                    </div>
                    {chamadaAtual ? (
                      <>
                        <div className="font-mono text-7xl leading-none font-extrabold text-white">#{chamadaAtual.num}</div>
                        <div className="mt-3 text-2xl font-bold text-white">{chamadaAtual.nome}</div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-brand-400">
                          <MapPin size={16} /> {chamadaAtual.cons} — {chamadaAtual.esp}
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-lg text-slate-500">Clique em &quot;Chamar&quot; em um paciente da fila</div>
                    )}
                  </div>

                  <div className="kpi-label">Próximos na fila</div>
                  <div className="mt-2 space-y-2">
                    {fila.filter((f) => ['aguardando_triagem', 'aguardando_medico'].includes(f.status)).map((f, i) => (
                      <div
                        key={f.id}
                        className={`grid grid-cols-[60px_1fr_auto] items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
                          i === 0 ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <span className="font-mono text-lg font-extrabold text-brand-600">#{f.num}</span>
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold text-slate-900">{f.nome}</div>
                          <div className="text-[11px] text-slate-400">{f.esp} · {f.cons}</div>
                        </div>
                        <button onClick={() => chamarPaciente(f)} className="btn-info btn-sm">
                          <Megaphone size={13} /> Chamar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lateral */}
                <div className="space-y-3">
                  <div className="rounded-xl bg-navy-900 p-4">
                    <div className="mb-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase">Controles</div>
                    <button
                      onClick={() => {
                        const aguard = fila.filter((f) => ['aguardando_triagem', 'aguardando_medico'].includes(f.status))
                        if (aguard.length > 0) chamarPaciente(aguard[0])
                      }}
                      className="btn-info mb-2 w-full"
                    >
                      <Megaphone size={15} /> Chamar próximo
                    </button>
                    <button
                      onClick={() => setAutoMode((a) => !a)}
                      className={`btn w-full text-white ${autoMode ? 'bg-brand-700 hover:bg-brand-800' : 'bg-navy-800 hover:bg-navy-800/80'}`}
                    >
                      Auto: {autoMode ? 'Ligado' : 'Desligado'}
                    </button>
                    {autoMode && (
                      <div className="mt-2 text-center text-[10px] text-slate-500">Chamando automaticamente a cada 12s</div>
                    )}
                  </div>

                  <div className="rounded-xl bg-navy-900 p-4">
                    <div className="mb-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase">Indicadores</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { l: 'Aguardando', v: aguardando },
                        { l: 'Atendimento', v: atendimento },
                        { l: 'Finalizados', v: finalizados },
                        { l: 'Total', v: fila.length },
                      ].map((k) => (
                        <div key={k.l} className="rounded-lg border border-white/10 bg-navy-950 px-3 py-2.5">
                          <div className="mb-1 text-[9px] text-slate-500">{k.l}</div>
                          <div className="text-xl font-bold text-white">{k.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-navy-900 p-4">
                    <div className="mb-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase">Últimas chamadas</div>
                    {historico.length === 0 && (
                      <div className="py-2 text-center text-xs text-slate-500">Nenhuma ainda</div>
                    )}
                    <div className="space-y-1.5">
                      {historico.map((p, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-navy-950 px-2.5 py-1.5">
                          <div>
                            <div className="font-mono text-xs font-semibold text-brand-300">#{p.num}</div>
                            <div className="text-[10px] text-slate-400">{p.nome.split(' ')[0]}</div>
                          </div>
                          <span className="rounded-md bg-brand-800 px-2 py-0.5 text-[10px] font-bold text-brand-200">Chamado</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TV */}
            {aba === 'tv' && (
              <div className="space-y-4">
                {/* Controles rápidos */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const aguard = fila.filter((f) => ['aguardando_triagem', 'aguardando_medico'].includes(f.status))
                      if (aguard.length > 0) chamarPaciente(aguard[0])
                    }}
                    className="btn-info btn-sm"
                  >
                    <Megaphone size={14} /> Chamar próximo
                  </button>
                  <button
                    onClick={() => setAutoMode((a) => !a)}
                    className={`btn btn-sm text-white ${autoMode ? 'bg-brand-600 hover:bg-brand-700' : 'bg-slate-600 hover:bg-slate-700'}`}
                  >
                    Auto: {autoMode ? 'Ligado ✓' : 'Desligado'}
                  </button>
                  {autoMode && (
                    <span className="text-[11px] text-slate-500">Chamando automaticamente a cada 12s</span>
                  )}
                  <a
                    href="/tv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost btn-sm ml-auto"
                  >
                    <ExternalLink size={13} /> Abrir TV em tela cheia
                  </a>
                </div>

                {/* Preview da TV em iframe */}
                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-inner" style={{ height: 520 }}>
                  <iframe
                    src="/tv"
                    className="h-full w-full"
                    style={{ border: 'none', pointerEvents: 'none' }}
                    title="Painel de TV"
                  />
                </div>

                {/* Fila resumida para chamar */}
                <div>
                  <div className="mb-2 text-[11px] font-bold tracking-widest text-slate-500 uppercase">Pacientes na fila</div>
                  <div className="space-y-1.5">
                    {fila.filter((f) => ['aguardando_triagem', 'aguardando_medico'].includes(f.status)).map((f) => (
                      <div key={f.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                        <span className="min-w-12 font-mono text-base font-extrabold text-brand-600">#{f.num}</span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-900">{f.nome}</div>
                          <div className="text-[11px] text-slate-400">{f.esp} · {f.cons}</div>
                        </div>
                        <button onClick={() => chamarPaciente(f)} className="btn-info btn-sm">
                          <Megaphone size={13} /> Chamar
                        </button>
                      </div>
                    ))}
                    {fila.filter((f) => ['aguardando_triagem', 'aguardando_medico'].includes(f.status)).length === 0 && (
                      <div className="py-6 text-center text-sm text-slate-400">Fila vazia</div>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* LEMBRETES */}
            {aba === 'lembretes' && (
              <LembretesTab />
            )}

            {aba === 'agendar' && <AgendamentoTab />}

            {/* CADASTRO */}
            {aba === 'cadastro' && (
              <form onSubmit={salvarPaciente}>
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                  <Search size={18} className="shrink-0 text-sky-700" />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-sky-900">Busca automática no CadSUS</div>
                    <div className="text-[11px] text-sky-700">
                      Digite o nome ou CPF e os dados serão preenchidos automaticamente
                    </div>
                  </div>
                  {buscandoCadSUS && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-700">
                      <Loader2 size={13} className="animate-spin" /> Buscando...
                    </span>
                  )}
                  {cpfEncontrado && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={13} /> CadSUS
                    </span>
                  )}
                </div>

                {mostrarResultados && resultadosBusca.length > 0 && (
                  <div className="card mb-4 overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
                      Selecione um paciente encontrado no CadSUS:
                    </div>
                    {resultadosBusca.map((paciente, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selecionarPacienteResultado(paciente)}
                        className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-brand-50"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">{paciente.nome}</div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {paciente.cpf && `CPF: ${paciente.cpf} · `}
                            {paciente.municipio}
                          </div>
                        </div>
                        <span className="btn-primary btn-sm">Selecionar</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
                  <div className="field md:col-span-2">
                    <label className="label">Nome completo *</label>
                    <input className="input" value={form.nome} onChange={(e) => handleNomeChange(e.target.value)} required placeholder="Digite o nome para buscar no CadSUS" />
                  </div>
                  <div className="field">
                    <label className="label">CPF</label>
                    <input
                      className={`input ${cpfEncontrado ? 'border-emerald-400' : ''}`}
                      value={form.cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="field">
                    <label className="label">Data de nascimento *</label>
                    <input className="input" type="date" value={form.nascimento} onChange={(e) => setForm((f) => ({ ...f, nascimento: e.target.value }))} required />
                  </div>
                  <div className="field">
                    <label className="label">Sexo</label>
                    <select className="input" value={form.sexo} onChange={(e) => setForm((f) => ({ ...f, sexo: e.target.value }))}>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="I">Outro</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="label">Município *</label>
                    <input className="input" value={form.municipio} onChange={(e) => setForm((f) => ({ ...f, municipio: e.target.value }))} required placeholder="Cidade" />
                  </div>
                  <div className="field">
                    <label className="label">CNS (CadSUS)</label>
                    <input className="input" value={form.cns} onChange={(e) => setForm((f) => ({ ...f, cns: e.target.value }))} placeholder="Número do Cartão SUS" />
                  </div>
                  <div className="field">
                    <label className="label">Telefone</label>
                    <input className="input" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="field">
                    <label className="label">Endereço</label>
                    <input className="input" value={form.endereco} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} placeholder="Rua, número, bairro" />
                  </div>
                  <div className="field md:col-span-2">
                    <label className="label">Especialidade</label>
                    <select className="input" value={form.especialidade} onChange={(e) => setForm((f) => ({ ...f, especialidade: e.target.value }))}>
                      <option value="">Selecionar...</option>
                      {['Clinica Medica', 'Cardiologia', 'Pediatria', 'Neurologia', 'Ginecologia', 'Ortopedia', 'Dermatologia', 'Psicologia', 'Nutricao', 'Fisioterapia'].map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={salvando} className="btn-primary mt-2 w-full py-3">
                  {salvando ? (<><Loader2 size={16} className="animate-spin" /> Cadastrando...</>) : 'Cadastrar e encaminhar para triagem'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Modal — Ficha de atendimento */}
      {fichaImprimir && (
        <div className="modal-overlay" onClick={() => setFichaImprimir(null)}>
          <div className="modal-panel max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
            <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
            <div className="mb-1 text-base font-bold text-slate-900">Ficha emitida!</div>
            <div className="mb-5 text-sm text-slate-500">Paciente cadastrado na fila.</div>

            {/* Conteúdo imprimível */}
            <div
              ref={fichaRef}
              className="mb-5 rounded-xl border border-dashed border-slate-300 p-5 text-left"
            >
              <div className="mb-3 text-center">
                <div className="text-sm font-bold">PoliclínicaMed</div>
                <div className="text-[11px] text-slate-400">Gestão Municipal de Saúde</div>
              </div>
              <div className="mb-4 text-center font-mono text-6xl font-extrabold text-brand-600">
                #{fichaImprimir.num}
              </div>
              <div className="space-y-1.5 text-[13px] text-slate-800">
                <div><span className="font-bold">Paciente:</span> {fichaImprimir.nome}</div>
                <div><span className="font-bold">Especialidade:</span> {fichaImprimir.esp}</div>
                <div>
                  <span className="font-bold">Horário:</span>{' '}
                  {new Date(fichaImprimir.chegada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="mt-4 text-center text-[11px] text-slate-400">
                Aguarde ser chamado(a) pelo painel de chamadas
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => handlePrint()} className="btn-primary flex-1">
                <Printer size={15} /> Imprimir ficha
              </button>
              <button onClick={() => setFichaImprimir(null)} className="btn-secondary">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
