'use client'
import { useEffect, useState, useRef } from 'react'
import {
  Stethoscope, Inbox, Plus, X, CheckCircle2, Save, Loader2, Printer,
  ClipboardList, Activity, FlaskConical, SearchCheck, Pill, ArrowRightLeft,
  CalendarDays, Clock, Microscope, ChevronLeft, ChevronRight, UserRound,
  History, Video, VideoOff, Mic, MicOff, PhoneOff, MonitorSmartphone,
  type LucideIcon,
} from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useUsuario, iniciais } from '@/lib/auth'
import DocPreview, { imprimirElemento, type DocTipo, type MedItem } from '@/components/DocPreview'

// ── CID-10 base (fallback local) ───────────────────────────────
const CID10_BASE: Record<string, string> = {
  'A00': 'Colera', 'A01': 'Febres tifoide e paratifoide', 'A02': 'Outras infeccoes por Salmonella',
  'A09': 'Diarreia e gastroenterite', 'A15': 'Tuberculose respiratoria',
  'B20': 'Doenca pelo HIV', 'B34': 'Infeccao viral de localizacao nao especificada',
  'C50': 'Neoplasia maligna da mama', 'C53': 'Neoplasia maligna do colo do utero',
  'C61': 'Neoplasia maligna da prostata', 'C80': 'Neoplasia maligna sem especificacao de localizacao',
  'D50': 'Anemias por deficiencia de ferro', 'D64': 'Outras anemias',
  'E10': 'Diabetes mellitus tipo 1', 'E11': 'Diabetes mellitus tipo 2',
  'E14': 'Diabetes mellitus nao especificado', 'E66': 'Obesidade',
  'E78': 'Disturbios do metabolismo de lipoproteinas',
  'F32': 'Episodios depressivos', 'F41': 'Outros transtornos ansiosos',
  'G40': 'Epilepsia', 'G43': 'Enxaqueca',
  'H10': 'Conjuntivite', 'H52': 'Disturbios da acomodacao e da refracao',
  'I10': 'Hipertensao essencial', 'I20': 'Angina pectoris', 'I20.0': 'Angina instavel',
  'I21': 'Infarto agudo do miocardio', 'I25': 'Doenca isquemica cronica do coracao',
  'I48': 'Fibrilacao e flutter atrial', 'I50': 'Insuficiencia cardiaca',
  'J00': 'Rinofaringite aguda (resfriado comum)', 'J06': 'Infeccao aguda das vias aereas superiores',
  'J11': 'Gripe', 'J18': 'Pneumonia nao especificada',
  'J20': 'Bronquite aguda', 'J44': 'Doenca pulmonar obstrutiva cronica',
  'J45': 'Asma', 'J46': 'Estado de mal asmatico',
  'K21': 'Doenca do refluxo gastroesofagico', 'K25': 'Ulcera gastrica',
  'K29': 'Gastrite e duodenite', 'K35': 'Apendicite aguda',
  'K57': 'Doenca diverticular do intestino', 'K80': 'Colelitíase',
  'L20': 'Dermatite atopica', 'L30': 'Outras dermatites',
  'M10': 'Gota', 'M17': 'Gonartrose', 'M54': 'Dorsalgia', 'M54.5': 'Dor lombar baixa',
  'N18': 'Doenca renal cronica', 'N18.5': 'Doenca renal cronica estagio 5',
  'N20': 'Calculo do rim e do ureter', 'N39': 'Outros disturbios do aparelho urinario',
  'N94': 'Dores e outras afeccoes associadas aos orgaos genitais femininos',
  'O00': 'Gravidez ectopica', 'O24': 'Diabetes mellitus na gravidez',
  'O80': 'Parto unico espontaneo', 'O82': 'Parto por cesarea',
  'R00': 'Anormalidades do batimento cardiaco', 'R05': 'Tosse',
  'R06': 'Anormalidades da respiracao', 'R07': 'Dor de garganta e no peito',
  'R10': 'Dor abdominal e pelvica', 'R51': 'Cefaleia',
  'R52': 'Dor nao classificada em outra parte', 'R73': 'Glicemia elevada',
  'S06': 'Traumatismo intracraniano', 'S72': 'Fratura do femur',
  'T14': 'Traumatismo de regiao nao especificada do corpo',
  'Z00': 'Exame geral', 'Z13': 'Rastreamento de outras doencas',
  'Z23': 'Necessidade de imunizacao', 'Z34': 'Supervisao de gravidez normal',
}

function buscarCIDLocal(q: string) {
  if (!q || q.length < 2) return []
  const ql = q.toLowerCase()
  return Object.entries(CID10_BASE)
    .filter(([cod, desc]) => cod.toLowerCase().includes(ql) || desc.toLowerCase().includes(ql))
    .slice(0, 8)
}

// ── Busca CID-10 via API RNDS (com fallback local) ─────────────
async function buscarCIDRNDS(q: string): Promise<[string, string][]> {
  if (!q || q.length < 2) return []
  try {
    const fhirUrl = new URL('https://rnds.saude.gov.br/fhir/CodeSystem/$lookup')
    fhirUrl.searchParams.append('system', 'http://www.saude.gov.br/fhir/r4/CodeSystem/BRCID10')
    fhirUrl.searchParams.append('code', q)
    const response = await fetch(fhirUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/fhir+json' },
    })
    if (response.ok) {
      const data = await response.json()
      if (data.parameter) {
        const display = data.parameter.find((p: any) => p.name === 'display')?.valueString
        if (display) return [[q, display]]
      }
    }
  } catch (error) {
    console.error('Erro na API FHIR RNDS:', error)
  }

  try {
    const datasusUrl = `https://apisus.saude.gov.br/fhir/CodeSystem/BRCID10?code=${encodeURIComponent(q)}`
    const response = await fetch(datasusUrl, { headers: { Accept: 'application/json' } })
    if (response.ok) {
      const data = await response.json()
      if (data.entry) {
        return data.entry.map((entry: any) => [entry.resource.code, entry.resource.display || entry.resource.name])
      }
    }
  } catch (error) {
    console.error('Erro na API DataSUS:', error)
  }

  return buscarCIDLocal(q)
}

// ── Sinais vitais ──────────────────────────────────────────────
const VITAIS = [
  { k: 'pas', l: 'PA Sistólica', u: 'mmHg', min: 40, max: 300, ok: 120, at: 139 },
  { k: 'pad', l: 'PA Diastólica', u: 'mmHg', min: 20, max: 200, ok: 80, at: 89 },
  { k: 'fc', l: 'Freq. Cardíaca', u: 'bpm', min: 20, max: 300, ok: 100, at: 120 },
  { k: 'temp', l: 'Temperatura', u: '°C', min: 30, max: 45, ok: 37.2, at: 38.9 },
  { k: 'sat', l: 'Saturação O₂', u: '%', min: 50, max: 100, ok: 95, at: 90 },
  { k: 'glic', l: 'Glicemia', u: 'mg/dL', min: 10, max: 600, ok: 99, at: 125 },
  { k: 'peso', l: 'Peso', u: 'kg', min: 1, max: 300, ok: 0, at: 0 },
  { k: 'alt', l: 'Altura', u: 'cm', min: 30, max: 250, ok: 0, at: 0 },
]

function stVital(k: string, v: string) {
  const vt = VITAIS.find((x) => x.k === k)
  if (!vt || !v) return ''
  const n = parseFloat(v)
  if (k === 'sat') return n >= 95 ? 'normal' : n >= 90 ? 'atencao' : 'alerta'
  if (!vt.ok) return 'normal'
  return n <= vt.ok ? 'normal' : n <= vt.at ? 'atencao' : 'alerta'
}

const ST: Record<string, { badge: string; border: string; t: string }> = {
  normal: { badge: 'badge-green', border: 'border-slate-200', t: 'Normal' },
  atencao: { badge: 'badge-yellow', border: 'border-amber-400', t: 'Atenção' },
  alerta: { badge: 'badge-red', border: 'border-rose-400', t: 'Alerta' },
}

const ABAS: { id: string; l: string; icon: LucideIcon }[] = [
  { id: 'historico', l: 'Histórico', icon: History },
  { id: 'anamnese', l: 'Anamnese', icon: ClipboardList },
  { id: 'exame', l: 'Exame Físico', icon: Activity },
  { id: 'resultados', l: 'Resultados', icon: FlaskConical },
  { id: 'diagnostico', l: 'Diagnósticos', icon: SearchCheck },
  { id: 'conduta', l: 'Conduta', icon: Pill },
  { id: 'encaminh', l: 'Encaminham.', icon: ArrowRightLeft },
  { id: 'teleconsulta', l: 'Teleconsulta', icon: MonitorSmartphone },
  { id: 'registroTardio', l: 'Registro Tardio', icon: Clock },
  { id: 'resultadosExames', l: 'Result. Exames', icon: Microscope },
]

const ESPECIALISTAS_TELE = [
  { id: 'tc1', nome: 'Dr. André Carvalho',   esp: 'Cardiologia',    crm: 'CRM/MA 12345', status: 'disponivel', avatar: 'AC' },
  { id: 'tc2', nome: 'Dra. Fernanda Lima',   esp: 'Neurologia',     crm: 'CRM/MA 23456', status: 'disponivel', avatar: 'FL' },
  { id: 'tc3', nome: 'Dr. Ricardo Souza',    esp: 'Ortopedia',      crm: 'CRM/MA 34567', status: 'ocupado',    avatar: 'RS' },
  { id: 'tc4', nome: 'Dra. Camila Torres',   esp: 'Dermatologia',   crm: 'CRM/MA 45678', status: 'disponivel', avatar: 'CT' },
  { id: 'tc5', nome: 'Dr. Paulo Mendes',     esp: 'Endocrinologia', crm: 'CRM/MA 56789', status: 'offline',    avatar: 'PM' },
  { id: 'tc6', nome: 'Dra. Juliana Costa',   esp: 'Psiquiatria',    crm: 'CRM/MA 67890', status: 'disponivel', avatar: 'JC' },
  { id: 'tc7', nome: 'Dr. Marcos Dias',      esp: 'Urologia',       crm: 'CRM/MA 78901', status: 'ocupado',    avatar: 'MD' },
  { id: 'tc8', nome: 'Dra. Beatriz Nunes',   esp: 'Ginecologia',    crm: 'CRM/MA 89012', status: 'disponivel', avatar: 'BN' },
]

// ── Busca de medicamentos (ANVISA via rota interna, fallback local) ──
async function buscarMedicamentosANVISA(termo: string): Promise<any[]> {
  if (!termo || termo.length < 2) return []
  try {
    const response = await fetch(`/api/medicamentos?q=${encodeURIComponent(termo)}`)
    if (!response.ok) {
      console.warn(`Busca de medicamentos retornou status ${response.status}`)
      return buscarMedicamentosLocal(termo)
    }
    const data = await response.json()
    const resultados = Array.isArray(data?.resultados) ? data.resultados : []
    if (resultados.length === 0) return buscarMedicamentosLocal(termo)
    return resultados
  } catch (error) {
    console.error('Erro ao buscar medicamentos:', error)
    return buscarMedicamentosLocal(termo)
  }
}

function buscarMedicamentosLocal(termo: string): any[] {
  const medicamentosLocais = [
    { nome: 'Paracetamol 500mg', codigo: '123456', apresentacao: 'Comprimido', laboratorio: 'Genérico' },
    { nome: 'Paracetamol 750mg', codigo: '123457', apresentacao: 'Comprimido', laboratorio: 'Genérico' },
    { nome: 'Ibuprofeno 400mg', codigo: '123459', apresentacao: 'Comprimido', laboratorio: 'Genérico' },
    { nome: 'Dipirona Sódica 500mg', codigo: '123462', apresentacao: 'Comprimido', laboratorio: 'Genérico' },
    { nome: 'Amoxicilina 500mg', codigo: '123465', apresentacao: 'Cápsula', laboratorio: 'Genérico' },
    { nome: 'Losartana Potássica 50mg', codigo: '123468', apresentacao: 'Comprimido', laboratorio: 'Genérico' },
    { nome: 'Metformina 500mg', codigo: '123472', apresentacao: 'Comprimido', laboratorio: 'Genérico' },
    { nome: 'Omeprazol 20mg', codigo: '123481', apresentacao: 'Cápsula', laboratorio: 'Genérico' },
  ]
  const termoLower = termo.toLowerCase()
  return medicamentosLocais.filter((m) => m.nome.toLowerCase().includes(termoLower))
}

const TIPOS_SERVICO = [
  'ADM. MEDICAMENTO', 'DEMANDA ESPONTÂNEA', 'NEBULIZAÇÃO', 'VACINA',
  'ARBOVIROSES', 'ESCUTA INICIAL', 'ODONTOLOGIA', 'CURATIVO', 'EXAMES', 'PROCEDIMENTOS',
]
const LOCAIS_ATENDIMENTO = ['UBS', 'DOMICÍLIO', 'ESCOLA', 'COMUNIDADE', 'UNIDADE MÓVEL']
const JUSTIFICATIVAS = [
  'Faltas de energia elétrica', 'PEC indisponível', 'Computador inoperante',
  'Sistema offline', 'Problemas de rede', 'Outros',
]
const ESPECIALIDADES = [
  'Clínica Geral', 'Cardiologia', 'Pediatria', 'Ginecologia', 'Ortopedia',
  'Neurologia', 'Dermatologia', 'Oftalmologia', 'Psiquiatria', 'Urologia',
]

const VITAIS_VAZIO = { pas: '', pad: '', fc: '', temp: '', sat: '', glic: '', peso: '', alt: '' }

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`input min-h-[68px] resize-y ${props.className ?? ''}`} />
}

export default function ProntuarioPage() {
  const usuario = useUsuario(['medico'])
  const [aba, setAba] = useState('anamnese')
  const [salvo, setSalvo] = useState(false)

  // Modal de documentos
  const [showDocModal, setShowDocModal] = useState(false)
  const [docTipo, setDocTipo] = useState<DocTipo>('receita')
  const printRef = useRef<HTMLDivElement>(null)

  const [docPaciente, setDocPaciente] = useState('')
  const [docCpf, setDocCpf] = useState('')
  const [docMedico, setDocMedico] = useState('')
  const [docCrm, setDocCrm] = useState('')

  // Receituário
  const [tipoRec, setTipoRec] = useState('simples')
  const [itens, setItens] = useState<MedItem[]>([{ id: '1', med: '', dose: '', pos: '', dur: '', showSuggestions: false, suggestions: [], loading: false }])
  const [obs, setObs] = useState('')

  // Atestado
  const [dias, setDias] = useState('2')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10))
  const [cid, setCid] = useState('')
  const [exibirCid] = useState('nao')

  // Declaração
  const [dataDoc, setDataDoc] = useState(new Date().toISOString().slice(0, 10))
  const [entrada, setEntrada] = useState('09:00')
  const [saida, setSaida] = useState('10:30')

  // Exames
  const [tipoExame, setTipoExame] = useState('Laboratoriais')
  const [exames, setExames] = useState(['', '', '', ''])
  const [hipotese, setHipotese] = useState('')
  const [urgente, setUrgente] = useState(false)

  // Encaminhamento (documento)
  const [especialidade, setEspec] = useState('Cardiologia')
  const [tipoEnc, setTipoEnc] = useState('Especialista')
  const [prioridade, setPriori] = useState('Alta')
  const [justificativa, setJustif] = useState('')

  // Agendamento de consulta

  // Registro tardio
  const [registroTardio, setRegistroTardio] = useState({
    cidadao: '', dataAtendimento: '', horaAtendimento: '15:00',
    localAtendimento: 'UBS', justificativa: '', motivo: '',
  })
  const [registrosTardios, setRegistrosTardios] = useState<any[]>([])
  const [filtroRegistros, setFiltroRegistros] = useState('todos')
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')

  // Resultados de exames
  const [resultadoExame, setResultadoExame] = useState({
    exame: '', dataRealizacao: '', dataResultado: '', resultado: 'Normal', descricao: '',
  })
  const [examesRealizados, setExamesRealizados] = useState<any[]>([])

  // Teleconsulta
  const [teleEsp, setTeleEsp] = useState<any>(null)
  const [teleAtiva, setTeleAtiva] = useState(false)
  const [teleMudo, setTeleMudo] = useState(false)
  const [teleCamOff, setTeleCamOff] = useState(false)
  const [teleNota, setTeleNota] = useState('')
  const [teleHistorico, setTeleHistorico] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('teleconsultas') || '[]') } catch { return [] }
  })
  const [teleTempo, setTeleTempo] = useState(0)
  const teleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [teleFiltroEsp, setTeleFiltroEsp] = useState('')
  const [teleUltima, setTeleUltima] = useState<any>(null)
  const telePrintRef = useRef<HTMLDivElement>(null)
  const [teleRoomId, setTeleRoomId] = useState('')
  const [teleLinkCopiado, setTeleLinkCopiado] = useState(false)

  // Fila de pacientes
  const [filaMedica, setFilaMedica] = useState<any[]>([])
  const [pacienteAtual, setPacienteAtual] = useState<any>(null)
  const [finalizado, setFinalizado] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [buscaPaciente, setBuscaPaciente] = useState('')
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([])
  const [novoPaciente, setNovoPaciente] = useState({ nome: '', idade: '', sexo: 'Feminino', cpf: '', telefone: '' })

  // Anamnese
  const [queixa, setQueixa] = useState('')
  const [hda, setHda] = useState('')
  const [antPes, setAntPes] = useState('')
  const [antFam, setAntFam] = useState('')
  const [habitos, setHabitos] = useState('')
  const [alergias, setAlergias] = useState('')
  const [meds, setMeds] = useState('')

  // Exame físico
  const [vitais, setVitais] = useState<Record<string, string>>(VITAIS_VAZIO)
  const [egeral, setEgeral] = useState('')
  const [cardio, setCardio] = useState('')
  const [resp, setResp] = useState('')
  const [abd, setAbd] = useState('')
  const [neuro, setNeuro] = useState('')
  const [ext, setExt] = useState('')

  // Diagnósticos
  const [cids, setCids] = useState<any[]>([])
  const [cidBusca, setCidBusca] = useState('')
  const [cidResultados, setCidResult] = useState<[string, string][]>([])
  const [cidTipo, setCidTipo] = useState('secundario')
  const [cidLoading, setCidLoading] = useState(false)

  // Conduta
  const [trat, setTrat] = useState('')
  const [orient, setOrient] = useState('')
  const [retorno, setRetorno] = useState('7 dias')
  const [proced] = useState('')

  // Encaminhamentos
  const [encs, setEncs] = useState<any[]>([])
  const [novoEnc, setNovoEnc] = useState({ esp: 'Cardiologia', tipo: 'Especialista', pri: 'Alta', just: '' })

  // Histórico de atendimentos
  const [historicoPaciente, setHistoricoPaciente] = useState<any[]>([])

  // ── Carregamento de dados do localStorage ────────────────────
  const carregarRegistrosTardios = () => {
    const stored = localStorage.getItem('registros_tardios')
    if (stored) setRegistrosTardios(JSON.parse(stored))
  }
  const carregarExamesRealizados = () => {
    const stored = localStorage.getItem('exames_realizados')
    if (stored) setExamesRealizados(JSON.parse(stored))
  }
  const carregarHistoricoPaciente = (nome: string) => {
    const stored = localStorage.getItem('historico_atendimentos')
    if (!stored) { setHistoricoPaciente([]); return }
    const todos: any[] = JSON.parse(stored)
    setHistoricoPaciente(todos.filter((h) => h.paciente?.nome === nome).reverse())
  }

  const carregarPacientesMedicos = () => {
    const pacientesStorage = localStorage.getItem('pacientes_triagem')
    if (pacientesStorage) {
      const pacientes = JSON.parse(pacientesStorage)
      setFilaMedica(pacientes.filter((p: any) => p.status === 'aguardando_medico'))
    } else {
      setFilaMedica([])
    }
  }

  useEffect(() => {
    if (!usuario) return
    carregarPacientesMedicos()
    carregarRegistrosTardios()
    carregarExamesRealizados()

    const hoje = new Date()
    const seteDiasAtras = new Date()
    seteDiasAtras.setDate(hoje.getDate() - 7)
    setPeriodoInicio(seteDiasAtras.toISOString().slice(0, 10))
    setPeriodoFim(hoje.toISOString().slice(0, 10))

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pacientes_triagem') carregarPacientesMedicos()
      if (e.key === 'registros_tardios') carregarRegistrosTardios()
      if (e.key === 'exames_realizados') carregarExamesRealizados()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [usuario])

  if (!usuario) return null

  // ── Ações ────────────────────────────────────────────────────
  const salvarRegistroTardio = () => {
    if (!registroTardio.cidadao || !registroTardio.dataAtendimento || !registroTardio.justificativa) {
      alert('Preencha todos os campos obrigatórios')
      return
    }
    const novoRegistro = {
      id: Date.now(), ...registroTardio,
      dataRegistro: new Date().toISOString(), status: 'registrado', profissional: usuario?.nome,
    }
    const stored = localStorage.getItem('registros_tardios')
    const registros = stored ? JSON.parse(stored) : []
    registros.push(novoRegistro)
    localStorage.setItem('registros_tardios', JSON.stringify(registros))
    alert('Registro tardio salvo com sucesso!')
    setRegistroTardio({ cidadao: '', dataAtendimento: '', horaAtendimento: '15:00', localAtendimento: 'UBS', justificativa: '', motivo: '' })
    carregarRegistrosTardios()
  }

  const salvarResultadoExame = () => {
    if (!resultadoExame.exame || !resultadoExame.dataRealizacao) {
      alert('Preencha o nome do exame e a data de realização')
      return
    }
    const novoResultado = {
      id: Date.now(), ...resultadoExame,
      paciente: pacienteAtual?.nome || '', cpf: pacienteAtual?.cpf || '',
      dataRegistro: new Date().toISOString(), profissional: usuario?.nome,
    }
    const stored = localStorage.getItem('exames_realizados')
    const exs = stored ? JSON.parse(stored) : []
    exs.push(novoResultado)
    localStorage.setItem('exames_realizados', JSON.stringify(exs))
    alert('Resultado de exame salvo com sucesso!')
    setResultadoExame({ exame: '', dataRealizacao: '', dataResultado: '', resultado: 'Normal', descricao: '' })
    carregarExamesRealizados()
  }

  const buscarPacientesExistentes = (termo: string) => {
    if (!termo || termo.length < 2) {
      setResultadosBusca([])
      return
    }
    const pacientesStorage = localStorage.getItem('pacientes')
    if (pacientesStorage) {
      const pacientes = JSON.parse(pacientesStorage)
      setResultadosBusca(
        pacientes
          .filter((p: any) => p.nome.toLowerCase().includes(termo.toLowerCase()) || p.cpf?.includes(termo))
          .slice(0, 5)
      )
    }
  }

  const selecionarPacienteExistente = (paciente: any) => {
    setPacienteAtual({
      ...paciente,
      id: paciente.id,
      nome: paciente.nome,
      num: paciente.num || `P${String(paciente.id).slice(-4)}`,
      esp: paciente.esp || 'Consulta médica',
      dados_triagem: paciente.dados_triagem || null,
    })
    localStorage.setItem('paciente_em_atendimento', JSON.stringify({ nome: paciente.nome, cpf: paciente.cpf || '' }))
    setShowModal(false)
    setBuscaPaciente('')
    setResultadosBusca([])
    setFinalizado(false)
    setDocPaciente(paciente.nome)
    setDocCpf(paciente.cpf || '')
    setRegistroTardio((prev) => ({ ...prev, cidadao: paciente.nome }))
    carregarHistoricoPaciente(paciente.nome)
    setAba('historico')
    if (paciente.dados_triagem) carregarDadosTriagem(paciente)
  }

  const criarNovoPaciente = () => {
    if (!novoPaciente.nome) {
      alert('Preencha o nome do paciente')
      return
    }
    const pacientesStorage = localStorage.getItem('pacientes')
    const pacientes = pacientesStorage ? JSON.parse(pacientesStorage) : []
    const novoId = Date.now()
    const paciente = {
      id: novoId,
      num: `P${String(novoId).slice(-6)}`,
      nome: novoPaciente.nome,
      idade: novoPaciente.idade,
      sexo: novoPaciente.sexo,
      cpf: novoPaciente.cpf,
      telefone: novoPaciente.telefone,
      esp: 'Consulta médica',
      status: 'em_atendimento',
      dados_triagem: null,
      criado_em: new Date().toISOString(),
    }
    pacientes.push(paciente)
    localStorage.setItem('pacientes', JSON.stringify(pacientes))
    localStorage.setItem('paciente_em_atendimento', JSON.stringify({ nome: paciente.nome, cpf: paciente.cpf || '' }))
    setPacienteAtual(paciente)
    setDocPaciente(paciente.nome)
    setDocCpf(paciente.cpf || '')
    setRegistroTardio((prev) => ({ ...prev, cidadao: paciente.nome }))
    setShowModal(false)
    setNovoPaciente({ nome: '', idade: '', sexo: 'Feminino', cpf: '', telefone: '' })
    setFinalizado(false)
  }

  const carregarDadosTriagem = (paciente: any) => {
    if (paciente.dados_triagem) {
      const dados = paciente.dados_triagem
      if (dados.sinais_vitais) {
        setVitais({
          pas: dados.sinais_vitais.pas || '',
          pad: dados.sinais_vitais.pad || '',
          fc: dados.sinais_vitais.fc || '',
          temp: dados.sinais_vitais.temp || '',
          sat: dados.sinais_vitais.sat || '',
          glic: dados.sinais_vitais.glic || '',
          peso: dados.sinais_vitais.peso || '',
          alt: dados.sinais_vitais.altura || '',
        })
      }
      if (dados.queixa) setQueixa(dados.queixa)
    }
  }

  const selecionarPaciente = (paciente: any) => {
    setPacienteAtual(paciente)
    setDocPaciente(paciente.nome)
    setDocCpf(paciente.cpf || '')
    setRegistroTardio((prev) => ({ ...prev, cidadao: paciente.nome }))
    setFinalizado(false)
    carregarHistoricoPaciente(paciente.nome)
    setAba('historico')
    carregarDadosTriagem(paciente)
    atualizarStatusPaciente(paciente.id, 'em_atendimento')
  }

  const atualizarStatusPaciente = (pacienteId: string, novoStatus: string) => {
    const pacientesStorage = localStorage.getItem('pacientes_triagem')
    if (pacientesStorage) {
      let pacientes = JSON.parse(pacientesStorage)
      pacientes = pacientes.map((p: any) => (p.id === pacienteId ? { ...p, status: novoStatus } : p))
      localStorage.setItem('pacientes_triagem', JSON.stringify(pacientes))
      carregarPacientesMedicos()
    }
  }

  const finalizarAtendimento = () => {
    if (!pacienteAtual) return
    const prontuario = {
      paciente: pacienteAtual,
      anamnese: { queixa, hda, antPes, antFam, habitos, alergias, meds },
      exame_fisico: { vitais, egeral, cardio, resp, abd, neuro, ext },
      diagnosticos: cids,
      conduta: { trat, orient, retorno, proced },
      encaminhamentos: encs,
      data_atendimento: new Date().toISOString(),
      medico: usuario?.nome,
    }
    const historicoStorage = localStorage.getItem('historico_atendimentos')
    const historico = historicoStorage ? JSON.parse(historicoStorage) : []
    historico.push(prontuario)
    localStorage.setItem('historico_atendimentos', JSON.stringify(historico))

    const pacientesStorage = localStorage.getItem('pacientes_triagem')
    if (pacientesStorage) {
      let pacientes = JSON.parse(pacientesStorage)
      pacientes = pacientes.filter((p: any) => p.id !== pacienteAtual.id)
      localStorage.setItem('pacientes_triagem', JSON.stringify(pacientes))
    }

    localStorage.removeItem('paciente_em_atendimento')
    setFinalizado(true)
    setTimeout(() => {
      setFinalizado(false)
      setPacienteAtual(null)
      limparFormulario()
      carregarPacientesMedicos()
    }, 2000)
  }

  const limparFormulario = () => {
    setQueixa(''); setHda(''); setAntPes(''); setAntFam(''); setHabitos(''); setAlergias(''); setMeds('')
    setVitais(VITAIS_VAZIO)
    setEgeral(''); setCardio(''); setResp(''); setAbd(''); setNeuro(''); setExt('')
    setCids([]); setTrat(''); setOrient(''); setEncs([])
  }

  // ── Medicamentos (receituário) ───────────────────────────────
  async function handleMedChange(id: string, value: string) {
    updItem(id, 'med', value)
    if (value.length >= 1) {
      setItens((items) => items.map((item) => (item.id === id ? { ...item, loading: true, showSuggestions: true } : item)))
      let resultados = []
      if (value.length <= 2) {
        resultados = buscarMedicamentosLocal(value)
      } else {
        resultados = await buscarMedicamentosANVISA(value)
        if (resultados.length === 0) resultados = buscarMedicamentosLocal(value)
      }
      setItens((items) => items.map((item) => (item.id === id ? { ...item, suggestions: resultados, loading: false, showSuggestions: true } : item)))
    } else {
      setItens((items) => items.map((item) => (item.id === id ? { ...item, suggestions: [], showSuggestions: false, loading: false } : item)))
    }
  }

  function selectSuggestion(id: string, medicamento: any) {
    updItem(id, 'med', medicamento.nome)
    setItens((items) => items.map((item) => (item.id === id ? { ...item, suggestions: [], showSuggestions: false, loading: false } : item)))
  }

  function addItem() {
    setItens((i) => [...i, { id: Date.now().toString(), med: '', dose: '', pos: '', dur: '', showSuggestions: false, suggestions: [], loading: false }])
  }
  function rmItem(id: string) {
    setItens((i) => i.filter((x) => x.id !== id))
  }
  function updItem(id: string, k: keyof MedItem, v: string) {
    setItens((i) => i.map((x) => (x.id === id ? { ...x, [k]: v } : x)))
  }

  function abrirDocumento(tipo: DocTipo) {
    setDocMedico(usuario?.nome || 'Dr(a).')
    setDocCrm('CRM/MA 12345')
    setDocTipo(tipo)
    setShowDocModal(true)
  }

  const imc = vitais.peso && vitais.alt
    ? (parseFloat(vitais.peso) / ((parseFloat(vitais.alt) / 100) ** 2)).toFixed(1)
    : null
  const imcC = imc
    ? parseFloat(imc) < 18.5 ? 'Abaixo do peso' : parseFloat(imc) < 25 ? 'Normal' : parseFloat(imc) < 30 ? 'Sobrepeso' : 'Obesidade'
    : null

  function salvar() {
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
    if (pacienteAtual) {
      const progresso = {
        paciente: pacienteAtual,
        anamnese: { queixa, hda, antPes, antFam, habitos, alergias, meds },
        exame_fisico: { vitais, egeral, cardio, resp, abd, neuro, ext },
        diagnosticos: cids,
        conduta: { trat, orient, retorno, proced },
        encaminhamentos: encs,
        ultima_atualizacao: new Date().toISOString(),
      }
      localStorage.setItem(`progresso_${pacienteAtual.id}`, JSON.stringify(progresso))
    }
  }

  async function buscaCID(q: string) {
    setCidBusca(q)
    setCidLoading(true)
    if (!q || q.length < 2) {
      setCidResult([])
      setCidLoading(false)
      return
    }
    try {
      setCidResult(await buscarCIDRNDS(q))
    } catch (error) {
      console.error('Erro na busca CID:', error)
      setCidResult(buscarCIDLocal(q))
    } finally {
      setCidLoading(false)
    }
  }

  function addCID(codigo: string, desc: string) {
    if (cids.find((c) => c.codigo === codigo)) return
    setCids((c) => [...c, { id: Date.now().toString(), codigo, desc, tipo: cidTipo }])
    setCidBusca('')
    setCidResult([])
  }

  function addEnc() {
    if (!novoEnc.just) return
    setEncs((e) => [...e, { ...novoEnc, id: Date.now().toString() }])
    setNovoEnc({ esp: 'Cardiologia', tipo: 'Especialista', pri: 'Alta', just: '' })
  }

  const currentIndex = ABAS.findIndex((a) => a.id === aba)
  const scrollTopo = () => document.querySelector('.prontuario-content')?.scrollTo({ top: 0, behavior: 'smooth' })
  const goToPrevious = () => { if (currentIndex > 0) { setAba(ABAS[currentIndex - 1].id); scrollTopo() } }
  const goToNext = () => { if (currentIndex < ABAS.length - 1) { setAba(ABAS[currentIndex + 1].id); scrollTopo() } }

  const priBadge = (p: string) =>
    ({ Alta: 'badge-red', Media: 'badge-yellow', Baixa: 'badge-green' }[p] || 'badge-gray')

  const DOCS_RAPIDOS: { l: string; tipo: DocTipo; icon: LucideIcon; cls: string }[] = [
    { l: 'Receituário', tipo: 'receita', icon: Pill, cls: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100' },
    { l: 'Exames', tipo: 'exames', icon: FlaskConical, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
    { l: 'Atestado', tipo: 'atestado', icon: ClipboardList, cls: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' },
    { l: 'Encaminh.', tipo: 'encaminhamento', icon: ArrowRightLeft, cls: 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100' },
  ]

  const dadosDocumento = {
    paciente: docPaciente, cpf: docCpf, medico: docMedico, crm: docCrm,
    tipoRec, itens, obs,
    dias, dataInicio, cid, exibirCid,
    dataDoc, entrada, saida,
    tipoExame, exames, hipotese, urgente,
    especialidade, tipoEnc, prioridade, justificativa,
  }

  const registrosFiltrados = registrosTardios
    .filter((r) => {
      if (filtroRegistros === 'meus' && r.profissional !== usuario?.nome) return false
      if (periodoInicio && new Date(r.dataAtendimento) < new Date(periodoInicio)) return false
      if (periodoFim && new Date(r.dataAtendimento) > new Date(periodoFim)) return false
      return true
    })
    .sort((a, b) => new Date(b.dataAtendimento).getTime() - new Date(a.dataAtendimento).getTime())

  return (
    <AppShell
      usuario={usuario}
      title={`Prontuário — Dr(a). ${usuario.nome}`}
      actions={
        <button onClick={salvar} className={`btn-sm btn text-white ${salvo ? 'bg-emerald-700' : 'bg-brand-600 hover:bg-brand-700'}`}>
          {salvo ? <CheckCircle2 size={13} /> : <Save size={13} />}
          {salvo ? 'Salvo!' : 'Salvar progresso'}
        </button>
      }
    >
      <div className="flex h-full overflow-hidden">
        {/* Fila de pacientes */}
        <div className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Stethoscope size={14} className="text-brand-600" /> Aguardando
            </div>
            <span className="badge-gray">{filaMedica.length}</span>
          </div>

          <button onClick={() => setShowModal(true)} className="btn-primary btn-sm mb-4 w-full">
            <Plus size={14} /> Novo atendimento
          </button>

          {filaMedica.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              <Inbox size={32} className="mx-auto mb-2" />
              <div className="text-xs">Nenhum paciente aguardando</div>
            </div>
          )}

          <div className="space-y-2">
            {filaMedica.map((p) => (
              <button
                key={p.id}
                onClick={() => selecionarPaciente(p)}
                className={`w-full rounded-xl border-[1.5px] px-3 py-2.5 text-left transition-colors ${
                  pacienteAtual?.id === p.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="font-mono text-sm font-extrabold text-brand-600">#{p.num}</div>
                <div className="mt-0.5 text-[13px] font-semibold text-slate-900">{p.nome}</div>
                <div className="text-[11px] text-slate-400">{p.esp}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Prontuário */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {!pacienteAtual ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-400">
              <UserRound size={56} strokeWidth={1.25} />
              <div className="text-base font-semibold text-slate-700">Bem-vindo(a), Dr(a). {usuario.nome}</div>
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <Plus size={16} /> Novo atendimento
              </button>
            </div>
          ) : (
            <>
              {/* Cabeçalho do paciente */}
              <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                      {iniciais(pacienteAtual.nome)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-bold text-slate-900">{pacienteAtual.nome}</div>
                      <div className="text-xs text-slate-500">Ficha #{pacienteAtual.num} · {pacienteAtual.esp}</div>
                    </div>
                  </div>
                  <button
                    onClick={finalizarAtendimento}
                    className={`btn text-white ${finalizado ? 'bg-emerald-700' : 'bg-brand-600 hover:bg-brand-700'}`}
                  >
                    {finalizado ? (<><CheckCircle2 size={15} /> Finalizado!</>) : 'Finalizar atendimento'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DOCS_RAPIDOS.map((d) => {
                    const Icon = d.icon
                    return (
                      <button
                        key={d.l}
                        onClick={() => abrirDocumento(d.tipo)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors ${d.cls}`}
                      >
                        <Icon size={13} /> {d.l}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Abas */}
              <div className="flex shrink-0 flex-wrap overflow-x-auto border-b border-slate-200 bg-white px-3">
                {ABAS.map((a, i) => {
                  const Icon = a.icon
                  return (
                    <button
                      key={a.id}
                      onClick={() => setAba(a.id)}
                      className={`tab flex items-center gap-1.5 px-3 ${aba === a.id ? 'tab-active' : ''}`}
                    >
                      <Icon size={14} />
                      <span className="hidden xl:inline">{i + 1}. </span>{a.l}
                    </button>
                  )
                })}
              </div>

              <div className="prontuario-content flex-1 overflow-y-auto p-5">
                {/* ANAMNESE */}
                {aba === 'anamnese' && (
                  <div className="space-y-4">
                    <div className="card-pad">
                      <div className="card-title">Queixa e História da Doença Atual</div>
                      <div className="field">
                        <label className="label">Queixa principal</label>
                        <input className="input" value={queixa} onChange={(e) => setQueixa(e.target.value)} placeholder="Queixa principal do paciente..." />
                      </div>
                      <div className="field">
                        <label className="label">HDA</label>
                        <Textarea className="min-h-[90px]" value={hda} onChange={(e) => setHda(e.target.value)} placeholder="Descreva a história da doença atual..." />
                      </div>
                    </div>
                    <div className="card-pad">
                      <div className="card-title">Antecedentes, Hábitos e Medicamentos</div>
                      <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
                        <div className="field"><label className="label">Antecedentes pessoais</label><Textarea value={antPes} onChange={(e) => setAntPes(e.target.value)} placeholder="Doenças pré-existentes..." /></div>
                        <div className="field"><label className="label">Antecedentes familiares</label><Textarea value={antFam} onChange={(e) => setAntFam(e.target.value)} placeholder="Histórico de doenças na família..." /></div>
                        <div className="field"><label className="label">Hábitos</label><Textarea value={habitos} onChange={(e) => setHabitos(e.target.value)} placeholder="Tabagismo, etilismo..." /></div>
                        <div className="field"><label className="label">Alergias</label><Textarea value={alergias} onChange={(e) => setAlergias(e.target.value)} placeholder="Medicamentos, alimentos..." /></div>
                        <div className="field md:col-span-2"><label className="label">Medicamentos</label><Textarea value={meds} onChange={(e) => setMeds(e.target.value)} placeholder="Medicamentos em uso..." /></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* EXAME FÍSICO */}
                {aba === 'exame' && (
                  <div className="space-y-4">
                    <div className="card-pad">
                      <div className="card-title">Sinais Vitais</div>
                      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                        {VITAIS.map((vt) => {
                          const v = vitais[vt.k] || ''
                          const st = stVital(vt.k, v)
                          const sc = ST[st]
                          return (
                            <div key={vt.k} className="rounded-xl bg-slate-50 px-3 py-2.5">
                              <div className="mb-1 text-[10px] font-semibold text-slate-500">{vt.l}</div>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={v}
                                  onChange={(e) => setVitais((p) => ({ ...p, [vt.k]: e.target.value }))}
                                  className={`input border-[1.5px] py-1.5 text-center font-bold ${sc ? sc.border : ''}`}
                                />
                                <span className="text-[9px] whitespace-nowrap text-slate-400">{vt.u}</span>
                              </div>
                              {sc && v && <span className={`mt-1.5 ${sc.badge}`}>{sc.t}</span>}
                            </div>
                          )
                        })}
                      </div>
                      {imc && (
                        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                          <span className="text-[11px] font-semibold text-slate-500">IMC:</span>
                          <span className="text-xl font-extrabold text-emerald-800">{imc}</span>
                          <span className="text-xs text-slate-500">kg/m² — {imcC}</span>
                        </div>
                      )}
                    </div>
                    <div className="card-pad">
                      <div className="card-title">Exame Físico</div>
                      <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
                        {([['Estado geral', egeral, setEgeral], ['Cardiovascular', cardio, setCardio], ['Respiratório', resp, setResp], ['Abdome', abd, setAbd], ['Neurológico', neuro, setNeuro], ['Extremidades', ext, setExt]] as [string, string, (v: string) => void][]).map(([l, v, fn]) => (
                          <div key={l} className="field">
                            <label className="label">{l}</label>
                            <Textarea value={v} onChange={(e) => fn(e.target.value)} placeholder={`Exame ${l.toLowerCase()}...`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* RESULTADOS (solicitar exames) */}
                {aba === 'resultados' && (
                  <div className="card-pad">
                    <div className="card-title">Solicitar Exames</div>
                    <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
                      <div className="field">
                        <label className="label">Tipo de exame</label>
                        <select className="input">
                          <option>Laboratorial</option><option>Raio-X</option><option>Tomografia</option>
                          <option>Ressonância</option><option>Ultrassonografia</option><option>ECG</option>
                        </select>
                      </div>
                      <div className="field">
                        <label className="label">Data</label>
                        <input type="date" className="input" />
                      </div>
                    </div>
                    <button className="btn-info btn-sm">
                      <Plus size={13} /> Solicitar exame
                    </button>
                  </div>
                )}

                {/* DIAGNÓSTICOS */}
                {aba === 'diagnostico' && (
                  <div className="space-y-4">
                    <div className="card-pad">
                      <div className="card-title flex items-center gap-2">
                        Buscar CID-10 (RNDS)
                        {cidLoading && (
                          <span className="flex items-center gap-1 text-[11px] font-normal text-slate-500">
                            <Loader2 size={12} className="animate-spin" /> Consultando base nacional...
                          </span>
                        )}
                      </div>
                      <div className="relative mb-3">
                        <input
                          className="input pr-32"
                          placeholder="Digite o código ou descrição (ex: I10, A09, diabetes)"
                          value={cidBusca}
                          onChange={(e) => buscaCID(e.target.value)}
                        />
                        <select
                          value={cidTipo}
                          onChange={(e) => setCidTipo(e.target.value)}
                          className="absolute top-0 right-0 h-full cursor-pointer rounded-r-lg border-l border-slate-200 bg-slate-50 px-2 text-xs"
                        >
                          <option value="principal">Principal</option>
                          <option value="secundario">Secundário</option>
                        </select>
                      </div>
                      {cidResultados.length > 0 && (
                        <div className="card overflow-hidden">
                          {cidResultados.map(([cod, desc]) => (
                            <button
                              key={cod}
                              onClick={() => addCID(cod, desc)}
                              className="flex w-full items-center gap-3 border-b border-slate-100 px-3.5 py-2.5 text-left transition-colors last:border-0 hover:bg-brand-50"
                            >
                              <span className="min-w-14 font-mono text-xs font-bold text-sky-700">{cod}</span>
                              <span className="flex-1 text-xs text-slate-900">{desc}</span>
                              <span className="text-[10px] text-slate-400">+ Adicionar</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {cidBusca.length >= 2 && cidResultados.length === 0 && !cidLoading && (
                        <div className="py-5 text-center text-xs text-slate-400">
                          Nenhum diagnóstico encontrado. Verifique o código ou descrição.
                        </div>
                      )}
                    </div>
                    <div className="card-pad">
                      <div className="card-title">Diagnósticos</div>
                      <div className="space-y-1.5">
                        {cids.map((c) => (
                          <div key={c.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                            <span className="min-w-14 font-mono text-xs font-bold text-sky-700">{c.codigo}</span>
                            <span className="flex-1 text-xs text-slate-900">{c.desc}</span>
                            <span className={c.tipo === 'principal' ? 'badge-blue' : 'badge-gray'}>{c.tipo}</span>
                            <button onClick={() => setCids((cs) => cs.filter((x) => x.id !== c.id))} className="text-slate-400 hover:text-rose-500">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {cids.length === 0 && <div className="py-3 text-center text-xs text-slate-400">Nenhum diagnóstico adicionado</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* CONDUTA */}
                {aba === 'conduta' && (
                  <div className="card-pad">
                    <div className="card-title">Plano Terapêutico</div>
                    <div className="field">
                      <label className="label">Tratamento</label>
                      <Textarea className="min-h-[100px]" value={trat} onChange={(e) => setTrat(e.target.value)} placeholder="Descreva o tratamento..." />
                    </div>
                    <div className="field">
                      <label className="label">Orientações</label>
                      <Textarea className="min-h-[100px]" value={orient} onChange={(e) => setOrient(e.target.value)} placeholder="Orientações ao paciente..." />
                    </div>
                    <div className="field">
                      <label className="label">Retorno</label>
                      <select className="input" value={retorno} onChange={(e) => setRetorno(e.target.value)}>
                        <option>7 dias</option><option>15 dias</option><option>30 dias</option>
                        <option>60 dias</option><option>Conforme resultado</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ENCAMINHAMENTOS */}
                {aba === 'encaminh' && (
                  <div className="space-y-4">
                    <div className="card-pad">
                      <div className="card-title">Novo Encaminhamento</div>
                      <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
                        <div className="field">
                          <label className="label">Especialidade</label>
                          <select className="input" value={novoEnc.esp} onChange={(e) => setNovoEnc((p) => ({ ...p, esp: e.target.value }))}>
                            <option>Cardiologia</option><option>Neurologia</option><option>Ortopedia</option>
                            <option>Ginecologia</option><option>Pediatria</option>
                          </select>
                        </div>
                        <div className="field">
                          <label className="label">Prioridade</label>
                          <select className="input" value={novoEnc.pri} onChange={(e) => setNovoEnc((p) => ({ ...p, pri: e.target.value }))}>
                            <option>Alta</option><option>Media</option><option>Baixa</option>
                          </select>
                        </div>
                        <div className="field md:col-span-2">
                          <label className="label">Justificativa</label>
                          <Textarea value={novoEnc.just} onChange={(e) => setNovoEnc((p) => ({ ...p, just: e.target.value }))} placeholder="Justificativa clínica..." />
                        </div>
                      </div>
                      <button onClick={addEnc} className="btn-info btn-sm">
                        <Plus size={13} /> Registrar
                      </button>
                    </div>
                    <div className="card-pad">
                      <div className="card-title">Encaminhamentos</div>
                      <div className="space-y-2">
                        {encs.map((e) => (
                          <div key={e.id} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold text-slate-900">{e.esp}</span>
                                <span className={priBadge(e.pri)}>{e.pri}</span>
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{e.just}</div>
                            </div>
                            <button onClick={() => setEncs((es) => es.filter((x) => x.id !== e.id))} className="text-slate-400 hover:text-rose-500">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {encs.length === 0 && <div className="py-3 text-center text-xs text-slate-400">Nenhum encaminhamento registrado</div>}
                      </div>
                    </div>
                  </div>
                )}

                {/* AGENDAR CONSULTA */}

                {/* REGISTRO TARDIO */}
                {aba === 'registroTardio' && (
                  <div className="space-y-4">
                    <div className="card-pad">
                      <div className="card-title flex items-center gap-2">
                        <Clock size={16} className="text-amber-500" /> Registro Tardio de Atendimento
                      </div>
                      <p className="-mt-2 mb-4 text-xs text-slate-500">
                        Registre os atendimentos na ordem cronológica em que ocorreram.
                      </p>

                      <div className="field">
                        <label className="label">Cidadão *</label>
                        <input className="input" placeholder="Nome do cidadão" value={registroTardio.cidadao} onChange={(e) => setRegistroTardio({ ...registroTardio, cidadao: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
                        <div className="field">
                          <label className="label">Data do atendimento *</label>
                          <input type="date" className="input" value={registroTardio.dataAtendimento} onChange={(e) => setRegistroTardio({ ...registroTardio, dataAtendimento: e.target.value })} />
                        </div>
                        <div className="field">
                          <label className="label">Hora *</label>
                          <select className="input" value={registroTardio.horaAtendimento} onChange={(e) => setRegistroTardio({ ...registroTardio, horaAtendimento: e.target.value })}>
                            {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((h) => <option key={h}>{h}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="field">
                        <label className="label">Local de atendimento *</label>
                        <select className="input" value={registroTardio.localAtendimento} onChange={(e) => setRegistroTardio({ ...registroTardio, localAtendimento: e.target.value })}>
                          {LOCAIS_ATENDIMENTO.map((l) => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label className="label">Justificativa *</label>
                        <select className="input" value={registroTardio.justificativa} onChange={(e) => setRegistroTardio({ ...registroTardio, justificativa: e.target.value })}>
                          <option value="">Selecione...</option>
                          {JUSTIFICATIVAS.map((j) => <option key={j}>{j}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label className="label">Tipo de serviço</label>
                        <select className="input" value={registroTardio.motivo} onChange={(e) => setRegistroTardio({ ...registroTardio, motivo: e.target.value })}>
                          <option value="">Selecione...</option>
                          {TIPOS_SERVICO.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => setRegistroTardio({ cidadao: pacienteAtual?.nome || '', dataAtendimento: '', horaAtendimento: '15:00', localAtendimento: 'UBS', justificativa: '', motivo: '' })}
                          className="btn-ghost"
                        >
                          Limpar campos
                        </button>
                        <button onClick={salvarRegistroTardio} className="btn-primary">
                          <Plus size={15} /> Adicionar
                        </button>
                      </div>
                    </div>

                    <div className="card-pad">
                      <div className="card-title">Registros Tardios</div>
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={filtroRegistros === 'meus'}
                            onChange={() => setFiltroRegistros(filtroRegistros === 'meus' ? 'todos' : 'meus')}
                            className="accent-brand-600"
                          />
                          Ver somente meus registros
                        </label>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          Período:
                          <input type="date" className="input w-36 py-1.5" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
                          até
                          <input type="date" className="input w-36 py-1.5" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
                        </div>
                        <button
                          onClick={() => { setFiltroRegistros('todos'); setPeriodoInicio(''); setPeriodoFim('') }}
                          className="btn-ghost btn-sm"
                        >
                          Limpar filtros
                        </button>
                      </div>

                      {registrosFiltrados.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">Nenhum resultado encontrado.</div>
                      ) : (
                        <div className="space-y-2">
                          {registrosFiltrados.map((r) => (
                            <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                              <div>
                                <div className="text-[13px] font-semibold text-slate-900">{r.cidadao}</div>
                                <div className="text-[11px] text-slate-500">{r.dataAtendimento} {r.horaAtendimento} · {r.localAtendimento}</div>
                                <div className="mt-0.5 text-[10px] text-slate-400">{r.justificativa}</div>
                              </div>
                              <span className="badge-green">{r.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* RESULTADOS DE EXAMES */}
                {aba === 'resultadosExames' && (
                  <div className="space-y-4">
                    <div className="card-pad">
                      <div className="card-title flex items-center gap-2">
                        <Microscope size={16} className="text-emerald-600" /> Adicionar Resultados de Exames
                      </div>

                      <div className="field">
                        <label className="label">Adicionar exame sem solicitação</label>
                        <input className="input" placeholder="Pesquise por exame para inserir o resultado" value={resultadoExame.exame} onChange={(e) => setResultadoExame({ ...resultadoExame, exame: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
                        <div className="field">
                          <label className="label">Exames realizados em</label>
                          <input type="date" className="input" value={resultadoExame.dataRealizacao} onChange={(e) => setResultadoExame({ ...resultadoExame, dataRealizacao: e.target.value })} />
                        </div>
                        <div className="field">
                          <label className="label">Resultados em</label>
                          <input type="date" className="input" value={resultadoExame.dataResultado} onChange={(e) => setResultadoExame({ ...resultadoExame, dataResultado: e.target.value })} />
                        </div>
                      </div>
                      <div className="field">
                        <label className="label">Resultado</label>
                        <select className="input" value={resultadoExame.resultado} onChange={(e) => setResultadoExame({ ...resultadoExame, resultado: e.target.value })}>
                          <option>Normal</option><option>Alterado</option><option>Sugestivo de infecção congênita</option>
                          <option>Outras alterações</option><option>Indeterminado</option><option>Anormal</option>
                        </select>
                      </div>
                      <div className="field">
                        <label className="label">Descrição</label>
                        <Textarea className="min-h-[100px]" placeholder="Descreva os resultados do exame..." value={resultadoExame.descricao} onChange={(e) => setResultadoExame({ ...resultadoExame, descricao: e.target.value })} />
                        <div className="mt-1 text-right text-[10px] text-slate-400">{resultadoExame.descricao.length}/2000 caracteres</div>
                      </div>
                      <div className="flex gap-2.5">
                        <button onClick={() => setResultadoExame({ exame: '', dataRealizacao: '', dataResultado: '', resultado: 'Normal', descricao: '' })} className="btn-ghost">
                          Cancelar
                        </button>
                        <button onClick={salvarResultadoExame} className="btn-primary">
                          <Save size={15} /> Salvar
                        </button>
                      </div>
                    </div>

                    {examesRealizados.length > 0 && (
                      <div className="card-pad">
                        <div className="card-title">Exames Realizados</div>
                        <div className="space-y-2">
                          {examesRealizados
                            .filter((e) => e.paciente === pacienteAtual?.nome)
                            .slice(-5)
                            .reverse()
                            .map((e: any) => (
                              <div key={e.id} className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                                <div className="min-w-0">
                                  <div className="text-[13px] font-semibold text-slate-900">{e.exame}</div>
                                  <div className="text-[11px] text-slate-500">
                                    Realizado: {e.dataRealizacao} · Resultado: {e.dataResultado || 'pendente'}
                                  </div>
                                  <div className="mt-1 text-xs"><strong>Resultado:</strong> {e.resultado}</div>
                                  {e.descricao && <div className="mt-0.5 text-[11px] text-slate-500">{e.descricao.substring(0, 100)}...</div>}
                                </div>
                                <span className={e.resultado === 'Normal' ? 'badge-green' : 'badge-red'}>{e.resultado}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* HISTÓRICO */}
                {aba === 'historico' && (
                  <div className="space-y-4">
                    <div className="card-pad">
                      <div className="card-title flex items-center gap-2">
                        <History size={16} className="text-brand-600" />
                        Histórico de Atendimentos — {pacienteAtual?.nome}
                      </div>

                      {historicoPaciente.length === 0 ? (
                        <div className="py-10 text-center text-slate-400">
                          <History size={36} className="mx-auto mb-2 opacity-40" />
                          <div className="text-sm font-semibold">Nenhum atendimento anterior registrado</div>
                          <div className="mt-1 text-xs">Os atendimentos finalizados aparecerão aqui</div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {historicoPaciente.map((h: any, i: number) => (
                            <details key={i} className="group rounded-xl border border-slate-200 bg-slate-50">
                              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 marker:hidden">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                                  {historicoPaciente.length - i}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[13px] font-semibold text-slate-900">
                                    {h.data_atendimento
                                      ? new Date(h.data_atendimento).toLocaleDateString('pt-BR', {
                                          day: '2-digit', month: 'long', year: 'numeric',
                                        })
                                      : 'Data não registrada'}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {h.medico ? `Dr(a). ${h.medico}` : 'Médico não informado'}
                                    {h.diagnosticos?.length > 0 && (
                                      <> · {h.diagnosticos.map((d: any) => d.codigo).join(', ')}</>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  {h.diagnosticos?.slice(0, 2).map((d: any) => (
                                    <span key={d.id} className="badge-blue">{d.codigo}</span>
                                  ))}
                                  {(h.diagnosticos?.length ?? 0) > 2 && (
                                    <span className="badge-gray">+{h.diagnosticos.length - 2}</span>
                                  )}
                                </div>
                                <ChevronRight size={15} className="shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                              </summary>

                              <div className="border-t border-slate-200 px-4 py-3 text-[13px]">
                                {/* Queixa */}
                                {h.anamnese?.queixa && (
                                  <div className="mb-3">
                                    <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Queixa</div>
                                    <div className="text-slate-700">{h.anamnese.queixa}</div>
                                  </div>
                                )}

                                {/* Diagnósticos */}
                                {h.diagnosticos?.length > 0 && (
                                  <div className="mb-3">
                                    <div className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Diagnósticos</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {h.diagnosticos.map((d: any) => (
                                        <span key={d.id} className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                                          {d.codigo} — {d.desc}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Conduta */}
                                {(h.conduta?.trat || h.conduta?.orient) && (
                                  <div className="mb-3">
                                    <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Conduta</div>
                                    {h.conduta.trat && <div className="text-slate-700"><strong>Tratamento:</strong> {h.conduta.trat}</div>}
                                    {h.conduta.orient && <div className="mt-1 text-slate-700"><strong>Orientações:</strong> {h.conduta.orient}</div>}
                                    {h.conduta.retorno && <div className="mt-1 text-slate-500 text-[11px]">Retorno: {h.conduta.retorno}</div>}
                                  </div>
                                )}

                                {/* Encaminhamentos */}
                                {h.encaminhamentos?.length > 0 && (
                                  <div className="mb-3">
                                    <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Encaminhamentos</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {h.encaminhamentos.map((e: any) => (
                                        <span key={e.id} className={`rounded-md px-2 py-0.5 text-xs font-semibold ${priBadge(e.pri)}`}>
                                          {e.esp} ({e.pri})
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Sinais vitais resumidos */}
                                {h.exame_fisico?.vitais && Object.values(h.exame_fisico.vitais).some((v) => v) && (
                                  <div>
                                    <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Sinais vitais</div>
                                    <div className="flex flex-wrap gap-2">
                                      {[
                                        { k: 'pas', l: 'PA Sis.' }, { k: 'pad', l: 'PA Dia.' },
                                        { k: 'fc', l: 'FC' }, { k: 'temp', l: 'Temp.' },
                                        { k: 'sat', l: 'SpO₂' }, { k: 'glic', l: 'Glicemia' },
                                      ].map(({ k, l }) =>
                                        h.exame_fisico.vitais[k] ? (
                                          <span key={k} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                                            <strong>{l}:</strong> {h.exame_fisico.vitais[k]}
                                          </span>
                                        ) : null
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </details>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => setAba('anamnese')} className="btn-primary">
                        Iniciar consulta <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* TELECONSULTA */}
                {aba === 'teleconsulta' && (
                  <div className="space-y-4">
                    {!teleAtiva ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900">
                              <MonitorSmartphone size={16} className="text-brand-600" />
                              Teleconsulta com Especialistas
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">
                              Conecte-se a um especialista para interconsulta remota
                              {pacienteAtual && <> · Paciente: <strong>{pacienteAtual.nome}</strong></>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                            <span className="font-semibold text-emerald-700">
                              {ESPECIALISTAS_TELE.filter((e) => e.status === 'disponivel').length} online
                            </span>
                          </div>
                        </div>

                        {/* Filtro de especialidade */}
                        <div className="flex flex-wrap gap-2">
                          {['', 'Cardiologia', 'Neurologia', 'Ortopedia', 'Dermatologia', 'Endocrinologia', 'Psiquiatria', 'Urologia', 'Ginecologia'].map((esp) => (
                            <button
                              key={esp}
                              onClick={() => setTeleFiltroEsp(esp)}
                              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                                teleFiltroEsp === esp
                                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {esp === '' ? 'Todos' : esp}
                            </button>
                          ))}
                        </div>

                        {/* Grid de especialistas */}
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {ESPECIALISTAS_TELE.filter((e) => !teleFiltroEsp || e.esp === teleFiltroEsp).map((esp) => {
                            const cfg =
                              esp.status === 'disponivel'
                                ? { dot: 'bg-emerald-400', label: 'Disponivel', color: '#10b981', disabled: false }
                                : esp.status === 'ocupado'
                                ? { dot: 'bg-amber-400', label: 'Em consulta', color: '#f59e0b', disabled: true }
                                : { dot: 'bg-slate-300', label: 'Offline', color: '#94a3b8', disabled: true }
                            return (
                              <div key={esp.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                                <div className="relative shrink-0">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                                    {esp.avatar}
                                  </div>
                                  <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${cfg.dot}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[13px] font-bold text-slate-900">{esp.nome}</div>
                                  <div className="text-[11px] text-slate-500">{esp.esp} · {esp.crm}</div>
                                  <div className="mt-0.5 text-[10px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</div>
                                </div>
                                <button
                                  disabled={cfg.disabled}
                                  onClick={() => {
                                    const roomId = `policlinica-altomr-${esp.id}-${Date.now()}`
                                    setTeleRoomId(roomId)
                                    setTeleEsp(esp)
                                    setTeleAtiva(true)
                                    setTeleTempo(0)
                                    setTeleNota('')
                                    setTeleLinkCopiado(false)
                                    teleTimerRef.current = setInterval(() => setTeleTempo((t) => t + 1), 1000)
                                  }}
                                  className={`btn btn-sm text-white ${cfg.disabled ? 'cursor-not-allowed bg-slate-300' : 'bg-brand-600 hover:bg-brand-700'}`}
                                >
                                  <Video size={13} /> Conectar
                                </button>
                              </div>
                            )
                          })}
                        </div>

                        {/* Historico */}
                        {teleHistorico.length > 0 && (
                          <div className="card-pad">
                            <div className="card-title">Historico de Teleconsultas</div>
                            <div className="space-y-2">
                              {[...teleHistorico].reverse().slice(0, 5).map((h: any) => (
                                <div key={h.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                                    {h.avatar}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[13px] font-semibold text-slate-900">{h.especialista}</div>
                                    <div className="text-[11px] text-slate-500">{h.especialidade} · {h.paciente || '—'}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[11px] font-bold text-slate-700">{h.data}</div>
                                    <div className="text-[10px] text-slate-400">{h.duracao}</div>
                                  </div>
                                  <span className="badge-green">Realizada</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Tela de chamada ativa — Jitsi Meet real */
                      <div className="space-y-3">
                        {/* Barra de status */}
                        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                          <span className="text-[13px] font-bold text-emerald-800">
                            {teleEsp?.nome} · {teleEsp?.esp}
                          </span>
                          <span className="font-mono text-[13px] font-bold text-emerald-700">
                            {String(Math.floor(teleTempo / 60)).padStart(2, '0')}:{String(teleTempo % 60).padStart(2, '0')}
                          </span>

                          {/* Link para compartilhar com o especialista */}
                          <button
                            className="ml-auto flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                            onClick={() => {
                              navigator.clipboard.writeText(`https://meet.jit.si/${teleRoomId}`)
                              setTeleLinkCopiado(true)
                              setTimeout(() => setTeleLinkCopiado(false), 2500)
                            }}
                          >
                            {teleLinkCopiado ? <CheckCircle2 size={13} /> : <Video size={13} />}
                            {teleLinkCopiado ? 'Link copiado!' : 'Copiar link para especialista'}
                          </button>

                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Olá! Sua teleconsulta está pronta. Acesse pelo link:\nhttps://meet.jit.si/${teleRoomId}\n\nClínica: Policlínica Municipal — Alto Alegre do Maranhão`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-green-400 bg-green-500 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-green-600"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp
                          </a>

                          <a
                            href={`https://meet.jit.si/${teleRoomId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                          >
                            <MonitorSmartphone size={13} /> Abrir em nova aba
                          </a>
                        </div>

                        {/* Layout vídeo + notas */}
                        <div className="grid grid-cols-[1fr_260px] gap-3">
                          {/* Jitsi Meet iframe */}
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900" style={{ minHeight: 420 }}>
                            <iframe
                              src={`https://meet.jit.si/${teleRoomId}#config.startWithAudioMuted=${teleMudo}&config.startWithVideoMuted=${teleCamOff}&config.prejoinPageEnabled=false&config.disableDeepLinking=true&userInfo.displayName=${encodeURIComponent(usuario?.nome || 'Medico')}`}
                              allow="camera; microphone; fullscreen; display-capture"
                              className="h-full w-full"
                              style={{ minHeight: 420, border: 'none' }}
                              title="Teleconsulta Jitsi"
                            />
                          </div>

                          {/* Painel lateral */}
                          <div className="flex flex-col gap-3">
                            {/* Info paciente */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Paciente</div>
                              <div className="text-[13px] font-bold text-slate-900">{pacienteAtual?.nome || '—'}</div>
                              <div className="mt-0.5 text-[11px] text-slate-500">{pacienteAtual?.esp || 'Sem especialidade'}</div>
                            </div>

                            {/* Link da sala */}
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Sala da chamada</div>
                              <div className="break-all rounded-lg bg-slate-50 p-2 text-[10px] text-slate-500 select-all">
                                meet.jit.si/{teleRoomId}
                              </div>
                            </div>

                            {/* Notas */}
                            <div className="flex-1 rounded-xl border border-slate-200 bg-white p-3">
                              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                              Notas da interconsulta
                              </div>
                              <textarea
                                className="min-h-[180px] w-full resize-none rounded-lg bg-slate-50 p-2 text-[12px] text-slate-800 outline-none focus:ring-1 focus:ring-brand-400"
                                placeholder="Registre orientacoes, condutas e pareceres do especialista..."
                                value={teleNota}
                                onChange={(e) => setTeleNota(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Botão encerrar */}
                        <div className="flex items-center justify-center gap-3">
                          <button
                            title="Encerrar chamada"
                            className="flex items-center gap-2 rounded-full bg-rose-600 px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-rose-700"
                            onClick={() => {
                              if (teleTimerRef.current) clearInterval(teleTimerRef.current)
                              const dur = `${String(Math.floor(teleTempo / 60)).padStart(2, '0')}:${String(teleTempo % 60).padStart(2, '0')}`
                              const nova = {
                                id: Date.now(),
                                especialista: teleEsp?.nome,
                                especialidade: teleEsp?.esp,
                                crm: teleEsp?.crm,
                                avatar: teleEsp?.avatar,
                                paciente: pacienteAtual?.nome || '',
                                cpf: pacienteAtual?.cpf || '',
                                medico: usuario?.nome || '',
                                data: new Date().toLocaleDateString('pt-BR'),
                                duracao: dur,
                                notas: teleNota,
                              }
                              const hist = [...teleHistorico, nova]
                              setTeleHistorico(hist)
                              localStorage.setItem('teleconsultas', JSON.stringify(hist))
                              if (teleNota.trim()) {
                                const prefixo = `[Teleconsulta ${nova.data} — ${teleEsp?.nome} (${teleEsp?.esp})]:\n`
                                setOrient((prev: string) => prev ? `${prev}\n\n${prefixo}${teleNota}` : `${prefixo}${teleNota}`)
                              }
                              setTeleUltima(nova)
                              setTeleAtiva(false)
                              setTeleEsp(null)
                              setTeleMudo(false)
                              setTeleCamOff(false)
                            }}
                          >
                            <PhoneOff size={18} /> Encerrar chamada
                          </button>
                        </div>

                        {teleNota && (
                          <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-[12px] text-brand-800">
                            <strong>Notas salvas automaticamente</strong> ao encerrar a chamada.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card pós-consulta */}
                    {teleUltima && !teleAtiva && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <span className="text-[13px] font-bold text-emerald-800">
                            Teleconsulta encerrada — {teleUltima.data} · {teleUltima.duracao}
                          </span>
                        </div>
                        <div className="mb-3 text-[12px] text-emerald-700">
                          <strong>{teleUltima.especialista}</strong> ({teleUltima.especialidade})
                          {teleUltima.notas && (
                            <> · Notas exportadas para <strong>Conduta &gt; Orientacoes</strong></>
                          )}
                        </div>

                        {/* Acoes */}
                        <div className="flex flex-wrap gap-2">
                          {/* Imprimir parecer */}
                          <button
                            onClick={() => {
                              const el = telePrintRef.current
                              if (!el) return
                              const html = el.innerHTML
                              const w = window.open('', '_blank', 'width=700,height=900')
                              if (!w) return
                              w.document.write(`<!DOCTYPE html><html><head><title>Parecer</title>
                              <style>body{margin:20px;font-family:Arial,sans-serif;}@media print{body{margin:0;}}</style>
                              </head><body>${html}<script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
                              w.document.close()
                            }}
                            className="btn-primary btn-sm"
                          >
                            <Printer size={13} /> Imprimir Parecer
                          </button>

                          {/* Ir para conduta */}
                          {teleUltima.notas && (
                            <button
                              onClick={() => setAba('conduta')}
                              className="btn-info btn-sm"
                            >
                              <ClipboardList size={13} /> Ver em Conduta
                            </button>
                          )}

                          {/* Limpar card */}
                          <button
                            onClick={() => setTeleUltima(null)}
                            className="btn-ghost btn-sm ml-auto"
                          >
                            <X size={13} /> Fechar
                          </button>
                        </div>

                        {/* Documento oculto para impressao */}
                        <div className="hidden">
                          <div ref={telePrintRef}>
                            <DocPreview
                              tipo="parecer"
                              dados={{
                                paciente: teleUltima.paciente,
                                cpf: teleUltima.cpf,
                                medico: teleUltima.medico,
                                crm: docCrm,
                                especialistaNome: teleUltima.especialista,
                                especialistaEsp: teleUltima.especialidade,
                                especialistaCrm: teleUltima.crm,
                                dataConsulta: teleUltima.data,
                                duracao: teleUltima.duracao,
                                notas: teleUltima.notas,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navegação entre abas */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                  <button onClick={goToPrevious} disabled={currentIndex === 0} className="btn-secondary">
                    <ChevronLeft size={15} /> Anterior
                  </button>
                  <span className="rounded-full bg-slate-100 px-4 py-1.5 text-xs text-slate-500">
                    {currentIndex + 1}/{ABAS.length}
                  </span>
                  <button onClick={goToNext} disabled={currentIndex === ABAS.length - 1} className="btn-primary">
                    Próximo <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Documentos */}
      {showDocModal && (
        <div className="modal-overlay" onClick={() => setShowDocModal(false)}>
          <div className="modal-panel max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Emissão de Documento</h3>
              <button onClick={() => setShowDocModal(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {docTipo === 'receita' && (
              <div>
                <div className="field">
                  <label className="label">Tipo de receituário</label>
                  <select className="input" value={tipoRec} onChange={(e) => setTipoRec(e.target.value)}>
                    <option value="simples">Simples</option>
                    <option value="especial">Controle Especial</option>
                    <option value="continuo">Uso Contínuo</option>
                  </select>
                </div>

                {itens.map((item) => (
                  <div key={item.id} className="relative mb-2 space-y-1.5 rounded-lg bg-slate-50 p-2.5">
                    {itens.length > 1 && (
                      <button onClick={() => rmItem(item.id)} className="absolute top-2 right-2 z-10 text-slate-400 hover:text-rose-500">
                        <X size={14} />
                      </button>
                    )}
                    <div className="relative">
                      <input
                        className="input"
                        placeholder="Medicamento (digite para buscar na base da ANVISA)"
                        value={item.med}
                        onChange={(e) => handleMedChange(item.id, e.target.value)}
                        onFocus={() => {
                          if (item.med && item.med.length >= 1 && (!item.suggestions || item.suggestions.length === 0)) {
                            handleMedChange(item.id, item.med)
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setItens((items) => items.map((i) => (i.id === item.id ? { ...i, showSuggestions: false } : i)))
                          }, 200)
                        }}
                      />
                      {item.loading && (
                        <Loader2 size={14} className="absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-slate-400" />
                      )}
                      {item.showSuggestions && item.suggestions && item.suggestions.length > 0 && (
                        <div className="absolute top-full right-0 left-0 z-50 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-pop">
                          {item.suggestions.map((sug, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectSuggestion(item.id, sug)}
                              className="block w-full border-b border-slate-100 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-brand-50"
                            >
                              <div className="text-[13px] font-medium text-slate-900">{sug.nome}</div>
                              {sug.apresentacao && <div className="text-[10px] text-slate-500">{sug.apresentacao}</div>}
                              {sug.laboratorio && <div className="mt-0.5 text-[9px] text-slate-400">{sug.laboratorio}</div>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input className="input" placeholder="Dosagem (ex: 500mg, 10mg/mL)" value={item.dose} onChange={(e) => updItem(item.id, 'dose', e.target.value)} />
                    <input className="input" placeholder="Posologia (ex: 1 comprimido a cada 8h)" value={item.pos} onChange={(e) => updItem(item.id, 'pos', e.target.value)} />
                    <input className="input" placeholder="Duração (ex: 7 dias, uso contínuo)" value={item.dur} onChange={(e) => updItem(item.id, 'dur', e.target.value)} />
                    <div className="text-[9px] text-slate-400">Dados da ANVISA — Consulta de Produtos</div>
                  </div>
                ))}

                <button onClick={addItem} className="btn-ghost btn-sm mb-3 w-full">
                  <Plus size={13} /> Adicionar medicamento
                </button>

                <div className="field">
                  <label className="label">Observações</label>
                  <Textarea value={obs} onChange={(e) => setObs(e.target.value)} />
                </div>
              </div>
            )}

            {docTipo === 'atestado' && (
              <div>
                <div className="field">
                  <label className="label">Dias de afastamento</label>
                  <input type="number" className="input" value={dias} onChange={(e) => setDias(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Data de início</label>
                  <input type="date" className="input" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">CID (opcional)</label>
                  <input className="input" value={cid} onChange={(e) => setCid(e.target.value)} placeholder="Ex: I10" />
                </div>
              </div>
            )}

            {docTipo === 'declaracao' && (
              <div>
                <div className="field">
                  <label className="label">Data</label>
                  <input type="date" className="input" value={dataDoc} onChange={(e) => setDataDoc(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Entrada</label>
                  <input type="time" className="input" value={entrada} onChange={(e) => setEntrada(e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Saída</label>
                  <input type="time" className="input" value={saida} onChange={(e) => setSaida(e.target.value)} />
                </div>
              </div>
            )}

            {docTipo === 'exames' && (
              <div>
                <div className="field">
                  <label className="label">Tipo</label>
                  <select className="input" value={tipoExame} onChange={(e) => setTipoExame(e.target.value)}>
                    <option>Laboratoriais</option><option>Imagem</option><option>ECG</option>
                  </select>
                </div>
                {exames.map((e, i) => (
                  <input
                    key={i}
                    className="input mb-1.5"
                    placeholder={`Exame ${i + 1}`}
                    value={e}
                    onChange={(ev) => setExames((ex) => ex.map((x, j) => (j === i ? ev.target.value : x)))}
                  />
                ))}
                <button onClick={() => setExames((e) => [...e, ''])} className="btn-ghost btn-sm mb-3 w-full">
                  <Plus size={13} /> Exame
                </button>
                <div className="field">
                  <label className="label">Hipótese diagnóstica</label>
                  <input className="input" value={hipotese} onChange={(e) => setHipotese(e.target.value)} />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
                  <input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} className="accent-brand-600" />
                  Urgente
                </label>
              </div>
            )}

            {docTipo === 'encaminhamento' && (
              <div>
                <div className="field">
                  <label className="label">Especialidade</label>
                  <select className="input" value={especialidade} onChange={(e) => setEspec(e.target.value)}>
                    <option>Cardiologia</option><option>Neurologia</option><option>Ortopedia</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Prioridade</label>
                  <select className="input" value={prioridade} onChange={(e) => setPriori(e.target.value)}>
                    <option>Alta</option><option>Média</option><option>Baixa</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Justificativa</label>
                  <Textarea className="min-h-24" value={justificativa} onChange={(e) => setJustif(e.target.value)} />
                </div>
              </div>
            )}

            <div className="mt-6">
              <div ref={printRef}>
                <DocPreview tipo={docTipo} dados={dadosDocumento} />
              </div>
            </div>

            <div className="mt-6 flex gap-2.5">
              <button onClick={() => setShowDocModal(false)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={() => imprimirElemento(printRef.current)} className="btn-info flex-1">
                <Printer size={15} /> Imprimir / PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Atendimento */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Novo Atendimento</h3>
              <button onClick={() => setShowModal(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="mb-5">
              <label className="label">Buscar paciente existente</label>
              <input
                className="input"
                placeholder="Digite o nome ou CPF..."
                value={buscaPaciente}
                onChange={(e) => { setBuscaPaciente(e.target.value); buscarPacientesExistentes(e.target.value) }}
              />
              {resultadosBusca.length > 0 && (
                <div className="card mt-2 overflow-hidden">
                  {resultadosBusca.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selecionarPacienteExistente(p)}
                      className="block w-full border-b border-slate-100 px-3.5 py-2.5 text-left transition-colors last:border-0 hover:bg-brand-50"
                    >
                      <div className="text-sm font-semibold text-slate-900">{p.nome}</div>
                      <div className="text-[11px] text-slate-500">CPF: {p.cpf || 'Não informado'}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="my-4 text-center text-xs text-slate-400">— ou cadastre um novo —</div>

            <div className="field">
              <label className="label">Nome completo *</label>
              <input className="input" value={novoPaciente.nome} onChange={(e) => setNovoPaciente((p) => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="label">Idade</label>
                <input className="input" value={novoPaciente.idade} onChange={(e) => setNovoPaciente((p) => ({ ...p, idade: e.target.value }))} />
              </div>
              <div className="field">
                <label className="label">Sexo</label>
                <select className="input" value={novoPaciente.sexo} onChange={(e) => setNovoPaciente((p) => ({ ...p, sexo: e.target.value }))}>
                  <option>Feminino</option><option>Masculino</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label className="label">CPF</label>
              <input className="input" value={novoPaciente.cpf} onChange={(e) => setNovoPaciente((p) => ({ ...p, cpf: e.target.value }))} />
            </div>

            <div className="mt-5 flex gap-2.5">
              <button onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={criarNovoPaciente} className="btn-primary flex-1">Iniciar atendimento</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
