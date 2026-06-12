'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Printer, Pill, ClipboardList, FileCheck2, FlaskConical, ArrowRightLeft,
  Plus, X, type LucideIcon,
} from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useUsuario } from '@/lib/auth'
import DocPreview, { imprimirElemento, type DocTipo, type MedItem } from '@/components/DocPreview'

const TIPOS: { id: DocTipo; label: string; icon: LucideIcon; ativo: string }[] = [
  { id: 'receita', label: 'Receituário', icon: Pill, ativo: 'border-sky-600 bg-sky-50 text-sky-800' },
  { id: 'atestado', label: 'Atestado', icon: ClipboardList, ativo: 'border-amber-600 bg-amber-50 text-amber-800' },
  { id: 'declaracao', label: 'Declaração', icon: FileCheck2, ativo: 'border-lime-600 bg-lime-50 text-lime-800' },
  { id: 'exames', label: 'Exames', icon: FlaskConical, ativo: 'border-emerald-600 bg-emerald-50 text-emerald-800' },
  { id: 'encaminhamento', label: 'Encaminham.', icon: ArrowRightLeft, ativo: 'border-pink-600 bg-pink-50 text-pink-800' },
]

export default function DocumentosPage() {
  const router = useRouter()
  const usuario = useUsuario()
  const printRef = useRef<HTMLDivElement>(null)
  const [tipo, setTipo] = useState<DocTipo>('receita')

  // Dados compartilhados
  const [paciente, setPaciente] = useState('Joao Santos')
  const [cpf, setCpf] = useState('987.654.321-00')
  const [medico, setMedico] = useState('Dr. Roberto Nunes')
  const [crm, setCrm] = useState('CRM/MA 12345')

  // Receituário
  const [tipoRec, setTipoRec] = useState('simples')
  const [itens, setItens] = useState<MedItem[]>([{ id: '1', med: '', dose: '', pos: '', dur: '' }])
  const [obs, setObs] = useState('')

  // Atestado
  const [dias, setDias] = useState('2')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10))
  const [cid, setCid] = useState('')
  const [exibirCid, setExibirCid] = useState('nao')

  // Declaração
  const [dataDoc, setDataDoc] = useState(new Date().toISOString().slice(0, 10))
  const [entrada, setEntrada] = useState('09:00')
  const [saida, setSaida] = useState('10:30')

  // Exames
  const [tipoExame, setTipoExame] = useState('Laboratoriais')
  const [exames, setExames] = useState(['', '', '', ''])
  const [hipotese, setHipotese] = useState('')
  const [urgente, setUrgente] = useState(false)

  // Encaminhamento
  const [especialidade, setEspec] = useState('Cardiologia')
  const [tipoEnc, setTipoEnc] = useState('Especialista')
  const [prioridade, setPriori] = useState('Alta')
  const [justificativa, setJustif] = useState('')

  if (!usuario) return null

  function addItem() {
    setItens((i) => [...i, { id: Date.now().toString(), med: '', dose: '', pos: '', dur: '' }])
  }
  function rmItem(id: string) {
    setItens((i) => i.filter((x) => x.id !== id))
  }
  function updItem(id: string, k: keyof MedItem, v: string) {
    setItens((i) => i.map((x) => (x.id === id ? { ...x, [k]: v } : x)))
  }

  const dados = {
    paciente, cpf, medico, crm,
    tipoRec, itens, obs,
    dias, dataInicio, cid, exibirCid,
    dataDoc, entrada, saida,
    tipoExame, exames, hipotese, urgente,
    especialidade, tipoEnc, prioridade, justificativa,
  }

  return (
    <AppShell
      usuario={usuario}
      title="Emissão de Documentos"
      actions={
        <div className="flex gap-2">
          <button onClick={() => router.push('/prontuario')} className="btn-secondary btn-sm">
            <ArrowLeft size={13} /> Prontuário
          </button>
          <button onClick={() => imprimirElemento(printRef.current)} className="btn-info btn-sm">
            <Printer size={13} /> Imprimir / PDF
          </button>
        </div>
      }
    >
      <div className="grid h-full grid-cols-1 overflow-hidden lg:grid-cols-[320px_1fr]">
        {/* Formulário */}
        <div className="overflow-y-auto border-r border-slate-200 bg-white p-4">
          <div className="mb-4">
            <div className="label">Tipo de documento</div>
            <div className="grid grid-cols-2 gap-1.5">
              {TIPOS.map((t) => {
                const Icon = t.icon
                const ativo = tipo === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTipo(t.id)}
                    className={`flex items-center gap-2 rounded-lg border-[1.5px] px-2.5 py-2.5 text-[11px] font-bold transition-all ${
                      ativo ? t.ativo : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={14} />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card mb-4 bg-slate-50 p-3.5">
            <div className="label">Paciente</div>
            <div className="field mb-2.5">
              <label className="label">Nome</label>
              <input className="input" value={paciente} onChange={(e) => setPaciente(e.target.value)} />
            </div>
            <div className="mb-0">
              <label className="label">CPF</label>
              <input className="input" value={cpf} onChange={(e) => setCpf(e.target.value)} />
            </div>
          </div>

          <div className="card mb-4 bg-slate-50 p-3.5">
            <div className="label">Médico</div>
            <div className="field mb-2.5">
              <label className="label">Nome</label>
              <input className="input" value={medico} onChange={(e) => setMedico(e.target.value)} />
            </div>
            <div className="mb-0">
              <label className="label">CRM</label>
              <input className="input" value={crm} onChange={(e) => setCrm(e.target.value)} />
            </div>
          </div>

          {tipo === 'receita' && (
            <div>
              <div className="field">
                <label className="label">Tipo de receituário</label>
                <select className="input" value={tipoRec} onChange={(e) => setTipoRec(e.target.value)}>
                  <option value="simples">Simples</option>
                  <option value="especial">Controle Especial</option>
                  <option value="continuo">Uso Contínuo</option>
                </select>
              </div>
              <div className="label">Medicamentos</div>
              {itens.map((item, i) => (
                <div key={item.id} className="relative mb-2 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <div className="text-[10px] font-bold text-sky-700">Medicamento {i + 1}</div>
                  {itens.length > 1 && (
                    <button onClick={() => rmItem(item.id)} className="absolute top-1.5 right-2 text-slate-400 hover:text-rose-500">
                      <X size={14} />
                    </button>
                  )}
                  <input className="input" placeholder="Nome do medicamento" value={item.med} onChange={(e) => updItem(item.id, 'med', e.target.value)} />
                  <input className="input" placeholder="Dosagem (ex: 50mg)" value={item.dose} onChange={(e) => updItem(item.id, 'dose', e.target.value)} />
                  <input className="input" placeholder="Posologia (ex: 1 cp 2x/dia)" value={item.pos} onChange={(e) => updItem(item.id, 'pos', e.target.value)} />
                  <input className="input" placeholder="Duração (ex: por 7 dias)" value={item.dur} onChange={(e) => updItem(item.id, 'dur', e.target.value)} />
                </div>
              ))}
              <button onClick={addItem} className="btn-ghost btn-sm mb-3 w-full">
                <Plus size={13} /> Adicionar medicamento
              </button>
              <div className="field">
                <label className="label">Observações</label>
                <textarea className="input min-h-14 resize-y" value={obs} onChange={(e) => setObs(e.target.value)} />
              </div>
            </div>
          )}

          {tipo === 'atestado' && (
            <div>
              <div className="field">
                <label className="label">Dias de afastamento</label>
                <input type="number" className="input" min="1" value={dias} onChange={(e) => setDias(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">A partir de</label>
                <input type="date" className="input" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">CID (opcional)</label>
                <input className="input" placeholder="Ex: I10" value={cid} onChange={(e) => setCid(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Exibir CID no documento?</label>
                <select className="input" value={exibirCid} onChange={(e) => setExibirCid(e.target.value)}>
                  <option value="nao">Não (padrão)</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
            </div>
          )}

          {tipo === 'declaracao' && (
            <div>
              <div className="field">
                <label className="label">Data</label>
                <input type="date" className="input" value={dataDoc} onChange={(e) => setDataDoc(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Horário de entrada</label>
                <input type="time" className="input" value={entrada} onChange={(e) => setEntrada(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Horário de saída</label>
                <input type="time" className="input" value={saida} onChange={(e) => setSaida(e.target.value)} />
              </div>
            </div>
          )}

          {tipo === 'exames' && (
            <div>
              <div className="field">
                <label className="label">Tipo de exame</label>
                <select className="input" value={tipoExame} onChange={(e) => setTipoExame(e.target.value)}>
                  <option>Laboratoriais</option><option>Ultrassonografia</option>
                  <option>Raio-X</option><option>Tomografia</option>
                  <option>Ressonancia</option><option>ECG</option>
                </select>
              </div>
              <div className="label">Exames solicitados</div>
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
                <Plus size={13} /> Adicionar exame
              </button>
              <div className="field">
                <label className="label">Hipótese diagnóstica (CID)</label>
                <input className="input" placeholder="Ex: I20.0" value={hipotese} onChange={(e) => setHipotese(e.target.value)} />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
                <input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} className="accent-brand-600" />
                Marcar como urgente
              </label>
            </div>
          )}

          {tipo === 'encaminhamento' && (
            <div>
              <div className="field">
                <label className="label">Tipo</label>
                <select className="input" value={tipoEnc} onChange={(e) => setTipoEnc(e.target.value)}>
                  <option>Especialista</option><option>TFD</option><option>Hospital</option><option>Contrarreferencia</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Especialidade</label>
                <select className="input" value={especialidade} onChange={(e) => setEspec(e.target.value)}>
                  <option>Cardiologia</option><option>Neurologia</option><option>Ortopedia</option>
                  <option>Oncologia</option><option>Psiquiatria</option><option>Dermatologia</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Prioridade</label>
                <select className="input" value={prioridade} onChange={(e) => setPriori(e.target.value)}>
                  <option>Alta</option><option>Media</option><option>Baixa</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Justificativa clínica</label>
                <textarea
                  className="input min-h-20 resize-y"
                  value={justificativa}
                  onChange={(e) => setJustif(e.target.value)}
                  placeholder="Descreva a justificativa clínica..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="overflow-y-auto bg-slate-200/60 p-6">
          <div className="kpi-label mb-4 text-center">Prévia do documento</div>
          <div ref={printRef}>
            <DocPreview tipo={tipo} dados={dados} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
