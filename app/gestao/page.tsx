'use client'
import { useState } from 'react'
import { FileSpreadsheet, FileDown } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useUsuario } from '@/lib/auth'

const PROD = [
  { nome: 'Dr. Roberto Nunes', esp: 'Clinica Medica', consultas: 82, meta: 80, pct: 103 },
  { nome: 'Dra. Fernanda Lima', esp: 'Pediatria', consultas: 50, meta: 50, pct: 100 },
  { nome: 'Dr. Carlos Mendes', esp: 'Cardiologia', consultas: 56, meta: 60, pct: 93 },
  { nome: 'Dra. Carla Souza', esp: 'Ginecologia', consultas: 43, meta: 50, pct: 86 },
  { nome: 'Dr. Marcos Silva', esp: 'Ortopedia', consultas: 37, meta: 40, pct: 93 },
  { nome: 'Dr. Paulo Mendes', esp: 'Neurologia', consultas: 27, meta: 40, pct: 68 },
]

const ESPS = [
  { esp: 'Clinica Medica', val: 82, cor: '#0369a1' },
  { esp: 'Cardiologia', val: 56, cor: '#0ea5e9' },
  { esp: 'Pediatria', val: 50, cor: '#059669' },
  { esp: 'Ginecologia', val: 43, cor: '#be185d' },
  { esp: 'Ortopedia', val: 37, cor: '#65a30d' },
  { esp: 'Neurologia', val: 27, cor: '#b45309' },
  { esp: 'Demais', val: 52, cor: '#94a3b8' },
]

const ABAS = [
  { id: 'dashboard', l: 'Dashboard' },
  { id: 'producao', l: 'Produção' },
  { id: 'bpa', l: 'BPA' },
  { id: 'apac', l: 'APAC' },
  { id: 'relatorios', l: 'Relatórios' },
]

const BPA_DATA = [
  { cbo: '225120', proc: 'Consulta Clinica Medica', cid: 'I10', qtd: 82, status: 'Validado', cls: 'badge-green' },
  { cbo: '225125', proc: 'Consulta Cardiologia', cid: 'I20.0', qtd: 56, status: 'Validado', cls: 'badge-green' },
  { cbo: '225133', proc: 'Consulta Pediatria', cid: 'J18', qtd: 50, status: 'Pendente', cls: 'badge-yellow' },
  { cbo: '225145', proc: 'Consulta Ginecologia', cid: 'N94', qtd: 43, status: 'Validado', cls: 'badge-green' },
  { cbo: '225150', proc: 'Consulta Ortopedia', cid: 'M54', qtd: 37, status: 'Pendente', cls: 'badge-yellow' },
]

const APAC_DATA = [
  { num: '350001/26', pac: 'Maria Silva', proc: 'Cateterismo cardiaco', cid: 'I20.0', val: '30/06/2026', status: 'Aprovada', cls: 'badge-green' },
  { num: '350002/26', pac: 'Jose Almeida', proc: 'Dialise peritoneal', cid: 'N18.5', val: '31/07/2026', status: 'Em análise', cls: 'badge-blue' },
  { num: '350003/26', pac: 'Ana Ferreira', proc: 'Quimioterapia', cid: 'C50.9', val: '31/08/2026', status: 'Aprovada', cls: 'badge-green' },
  { num: '350004/26', pac: 'Carlos Mota', proc: 'Ressonancia coluna', cid: 'M51.1', val: '15/06/2026', status: 'Vencida', cls: 'badge-red' },
]

const maxVal = Math.max(...ESPS.map((e) => e.val))

export default function GestaoPage() {
  const usuario = useUsuario()
  const [aba, setAba] = useState('dashboard')

  if (!usuario) return null

  const pctCls = (p: number) => (p >= 100 ? 'badge-green' : p >= 85 ? 'badge-yellow' : 'badge-red')

  return (
    <AppShell
      usuario={usuario}
      title="Painel Administrativo"
      actions={
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm">
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button className="btn-info btn-sm">
            <FileDown size={13} /> PDF
          </button>
        </div>
      }
    >
      <div className="flex border-b border-slate-200 bg-white px-5">
        {ABAS.map((a) => (
          <button key={a.id} onClick={() => setAba(a.id)} className={`tab ${aba === a.id ? 'tab-active' : ''}`}>
            {a.l}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* DASHBOARD */}
        {aba === 'dashboard' && (
          <div>
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { l: 'Consultas no mês', v: '347', sub: '+12% vs maio', cls: 'text-sky-700' },
                { l: 'Tempo médio espera', v: '18 min', sub: '-4min vs maio', cls: 'text-brand-600' },
                { l: 'Taxa absenteísmo', v: '8%', sub: 'Acima da meta', cls: 'text-amber-500' },
                { l: 'Especialidades ativas', v: '6', sub: 'Estável', cls: 'text-violet-500' },
              ].map((k) => (
                <div key={k.l} className="card px-5 py-4">
                  <div className="kpi-label">{k.l}</div>
                  <div className={`kpi-value ${k.cls}`}>{k.v}</div>
                  <div className="mt-1.5 text-[11px] text-slate-400">{k.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Gráfico de especialidades */}
              <div className="card-pad">
                <div className="card-title">Consultas por especialidade</div>
                <div className="space-y-2.5">
                  {ESPS.map((e) => (
                    <div key={e.esp} className="flex items-center gap-2.5">
                      <span className="w-28 shrink-0 truncate text-[11px] text-slate-500">{e.esp}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(e.val / maxVal) * 100}%`, background: e.cor }}
                        />
                      </div>
                      <span className="min-w-6 text-right text-[11px] font-bold text-slate-900">{e.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Produção por profissional */}
              <div className="card-pad">
                <div className="card-title">Produção por profissional</div>
                <div className="space-y-2">
                  {PROD.map((p) => (
                    <div key={p.nome} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-900">{p.nome.split(' ').slice(0, 2).join(' ')}</div>
                        <div className="text-[10px] text-slate-400">{p.esp}</div>
                      </div>
                      <span className="text-xs font-bold text-slate-900">{p.consultas}</span>
                      <span className={pctCls(p.pct)}>{p.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUÇÃO */}
        {aba === 'producao' && (
          <div className="card-pad">
            <div className="card-title">Produção detalhada — Junho 2026</div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Profissional', 'Especialidade', 'Consultas', 'Meta', '% Meta', 'T. médio'].map((h) => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROD.map((p) => (
                  <tr key={p.nome} className="hover:bg-slate-50">
                    <td className="table-td font-semibold">{p.nome}</td>
                    <td className="table-td">{p.esp}</td>
                    <td className="table-td font-bold">{p.consultas}</td>
                    <td className="table-td">{p.meta}</td>
                    <td className="table-td"><span className={pctCls(p.pct)}>{p.pct}%</span></td>
                    <td className="table-td">22 min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BPA */}
        {aba === 'bpa' && (
          <div className="card-pad">
            <div className="card-title">BPA — Boletim de Produção Ambulatorial</div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  {['CBO', 'Procedimento', 'CID', 'Qtd', 'Competência', 'Status'].map((h) => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BPA_DATA.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="table-td font-mono text-sky-700">{r.cbo}</td>
                    <td className="table-td">{r.proc}</td>
                    <td className="table-td font-mono text-slate-500">{r.cid}</td>
                    <td className="table-td font-bold">{r.qtd}</td>
                    <td className="table-td">06/2026</td>
                    <td className="table-td"><span className={r.cls}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* APAC */}
        {aba === 'apac' && (
          <div className="card-pad">
            <div className="card-title">APAC — Procedimentos de Alto Custo</div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Nº APAC', 'Paciente', 'Procedimento', 'CID', 'Validade', 'Status'].map((h) => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {APAC_DATA.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="table-td font-mono text-xs text-sky-700">{r.num}</td>
                    <td className="table-td font-semibold">{r.pac}</td>
                    <td className="table-td">{r.proc}</td>
                    <td className="table-td font-mono text-slate-500">{r.cid}</td>
                    <td className="table-td">{r.val}</td>
                    <td className="table-td"><span className={r.cls}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RELATÓRIOS */}
        {aba === 'relatorios' && (
          <div className="card-pad">
            <div className="card-title">Exportar relatórios</div>
            <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-3">
              {['Produção individual', 'Por profissional', 'Por período', 'BPA consolidado', 'APAC vigentes', 'Absenteísmo'].map((r) => (
                <button
                  key={r}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-[13px] font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button className="btn bg-lime-700 text-white hover:bg-lime-800">
                <FileSpreadsheet size={15} /> Exportar em Excel
              </button>
              <button className="btn-info">
                <FileDown size={15} /> Exportar em PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
