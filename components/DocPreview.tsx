'use client'

/**
 * Preview imprimível de documentos médicos.
 *
 * IMPORTANTE: este componente usa estilos inline de propósito.
 * O HTML é copiado via innerHTML para uma janela de impressão,
 * onde as classes do Tailwind não existem — os estilos precisam
 * estar embutidos nos elementos.
 */

export type DocTipo = 'receita' | 'atestado' | 'declaracao' | 'exames' | 'encaminhamento'

export interface MedItem {
  id: string
  med: string
  dose: string
  pos: string
  dur: string
  showSuggestions?: boolean
  suggestions?: any[]
  loading?: boolean
}

export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="180" height="52">
  <rect x="1" y="1" width="418" height="118" rx="16" ry="16" fill="white" stroke="#e0e0e0" stroke-width="1.5"/>
  <rect x="12" y="12" width="46" height="46" rx="4" fill="#3d7a5a"/>
  <circle cx="35" cy="35" r="10" fill="none" stroke="white" stroke-width="2.5"/>
  <line x1="35" y1="20" x2="35" y2="17" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <line x1="35" y1="53" x2="35" y2="50" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <line x1="20" y1="35" x2="17" y2="35" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <line x1="53" y1="35" x2="50" y2="35" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <line x1="24" y1="24" x2="22" y2="22" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <line x1="48" y1="48" x2="46" y2="46" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <line x1="46" y1="24" x2="48" y2="22" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <line x1="22" y1="48" x2="24" y2="46" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <rect x="62" y="12" width="46" height="46" rx="4" fill="#5a9e72"/>
  <path d="M70 20 Q80 28 72 36 Q64 44 78 52" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <path d="M82 20 Q90 28 95 36 Q100 44 95 52" fill="none" stroke="#4a8a62" stroke-width="3" stroke-linecap="round"/>
  <rect x="12" y="62" width="46" height="46" rx="4" fill="#6db88a"/>
  <line x1="35" y1="100" x2="35" y2="78" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <path d="M35 78 Q25 68 20 72" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M35 78 Q45 68 50 72" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M35 78 Q30 65 28 60" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M35 78 Q40 65 42 60" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="62" y="62" width="46" height="46" rx="4" fill="#2d6b4a"/>
  <line x1="68" y1="78" x2="102" y2="78" stroke="#5a9e72" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="68" y1="84" x2="102" y2="84" stroke="#5a9e72" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="68" y1="90" x2="102" y2="90" stroke="#5a9e72" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="68" y1="96" x2="102" y2="96" stroke="#5a9e72" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M68 76 Q85 64 102 76" fill="#3d7a5a"/>
  <line x1="118" y1="14" x2="118" y2="106" stroke="#e0e0e0" stroke-width="1"/>
  <text x="130" y="38" font-family="Arial, sans-serif" font-size="13" font-weight="400" fill="#3d7a5a" letter-spacing="3">PREFEITURA DE</text>
  <text x="130" y="68" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#2d6b4a" letter-spacing="1">ALTO ALEGRE</text>
  <text x="130" y="94" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="#2d6b4a" letter-spacing="1">DO MARANH&#xC3;O</text>
  <text x="131" y="111" font-family="Arial, sans-serif" font-size="12" font-style="italic" fill="#3d7a5a" letter-spacing="2">Cuidando da nossa gente!</text>
</svg>`

export const UNIDADE = {
  prefeitura: 'PREFEITURA MUNICIPAL',
  secretaria: 'Secretaria Municipal de Saude',
  unidade: 'Policlinica Municipal',
  cnes: '1234567',
  endereco: 'Av. Principal, 100 - Centro',
  municipio: 'Alto Alegre do Maranhao - MA',
  telefone: '(99) 3333-4444',
}

export function imprimirElemento(el: HTMLElement | null) {
  if (!el) return
  const html = el.innerHTML
  const w = window.open('', '_blank', 'width=700,height=900')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><title>Documento</title>
  <style>body{margin:20px;font-family:Arial,sans-serif;}@media print{body{margin:0;}}</style>
  </head><body>${html}<script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
  w.document.close()
}

export default function DocPreview({ tipo, dados }: { tipo: DocTipo; dados: any }) {
  const estilos = {
    papel: { background: '#fff', border: '1px solid #d0d0d0', borderRadius: 4, padding: '28px 32px', maxWidth: 520, margin: '0 auto', fontFamily: 'Arial,sans-serif', color: '#111', fontSize: 13 },
    header: { borderBottom: '2px solid #1a3a6e', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    logo: { display: 'flex', alignItems: 'center', gap: 10 },
    logoBox: { width: 40, height: 40, background: '#1a3a6e', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 700 },
    org: { fontSize: 12, fontWeight: 700, color: '#1a3a6e', lineHeight: 1.3 },
    orgSub: { fontSize: 10, color: '#555', marginTop: 2 },
    badge: { textAlign: 'center' as const, background: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: 4, padding: '8px 12px', marginBottom: 16 },
    badgeTitle: { fontSize: 14, fontWeight: 700, color: '#1a3a6e', letterSpacing: '.04em', textTransform: 'uppercase' as const },
    badgeSub: { fontSize: 10, color: '#666', marginTop: 2 },
    pacBox: { background: '#f5f7fa', border: '1px solid #e0e4ea', borderRadius: 4, padding: '10px 14px', marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
    pacField: { fontSize: 10, color: '#666' },
    pacVal: { fontSize: 12, fontWeight: 600, color: '#111', marginTop: 1 },
    secTitle: { fontSize: 10, fontWeight: 700, color: '#1a3a6e', letterSpacing: '.06em', textTransform: 'uppercase' as const, margin: '12px 0 8px', borderBottom: '1px solid #e0e4ea', paddingBottom: 4 },
    footer: { marginTop: 28, borderTop: '1px solid #e0e4ea', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
    assinatura: { textAlign: 'center' as const },
    linha: { width: 160, borderTop: '1px solid #111', margin: '0 auto 4px' },
    dr: { fontSize: 11, fontWeight: 700, color: '#111' },
    crm: { fontSize: 10, color: '#555' },
    valida: { fontSize: 9, color: '#888', textAlign: 'center' as const, marginTop: 12 },
    carimbo: { width: 80, height: 50, border: '1px dashed #bbb', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#bbb', textAlign: 'center' as const, padding: 4 },
    qr: { width: 44, height: 44, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#999', textAlign: 'center' as const },
  }

  const hoje = new Date().toLocaleDateString('pt-BR')

  const Header = () => (
    <div style={estilos.header}>
      <div style={estilos.logo}>
        <div dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
      </div>
      <div style={estilos.qr}>QR<br />Code</div>
    </div>
  )

  const PacienteBox = () => (
    <div style={estilos.pacBox}>
      <div><div style={estilos.pacField}>Paciente</div><div style={estilos.pacVal}>{dados.paciente || '—'}</div></div>
      <div><div style={estilos.pacField}>Data</div><div style={estilos.pacVal}>{hoje}</div></div>
      <div><div style={estilos.pacField}>CPF</div><div style={estilos.pacVal}>{dados.cpf || '—'}</div></div>
      <div><div style={estilos.pacField}>Medico</div><div style={estilos.pacVal}>{dados.medico || '—'}</div></div>
    </div>
  )

  const Rodape = () => (
    <>
      <div style={estilos.footer}>
        <div style={estilos.carimbo}>Carimbo do profissional</div>
        <div style={estilos.assinatura}>
          <div style={estilos.linha} />
          <div style={estilos.dr}>{dados.medico || 'Dr. —'}</div>
          <div style={estilos.crm}>{dados.crm || 'CRM —'}</div>
        </div>
        <div style={{ fontSize: 10, color: '#555', textAlign: 'right' }}>
          {UNIDADE.municipio}<br />{hoje}
        </div>
      </div>
      <div style={estilos.valida}>Valide em: policlinica.municipio.gov.br/validar · CNES {UNIDADE.cnes}</div>
    </>
  )

  if (tipo === 'receita') return (
    <div style={estilos.papel}>
      <Header />
      <div style={estilos.badge}>
        <div style={estilos.badgeTitle}>
          Receituario Medico {dados.tipoRec === 'especial' ? '— Controle Especial' : dados.tipoRec === 'continuo' ? '— Uso Continuo' : ''}
        </div>
        <div style={estilos.badgeSub}>Valido somente com assinatura e carimbo do profissional</div>
      </div>
      <PacienteBox />
      <div style={estilos.secTitle}>Prescricao medica</div>
      {dados.itens?.filter((m: MedItem) => m.med).map((m: MedItem, i: number) => (
        <div key={m.id} style={{ marginBottom: 10, paddingLeft: 12, borderLeft: '3px solid #1a3a6e' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1a3a6e' }}>{i + 1}.</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '2px 0' }}>{m.med} {m.dose}</div>
          <div style={{ fontSize: 11, color: '#333' }}>{m.pos}</div>
          <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>{m.dur}</div>
        </div>
      ))}
      {dados.obs && (
        <div style={{ background: '#fffef0', border: '1px solid #e8e0b0', borderRadius: 4, padding: 10, margin: '12px 0', fontSize: 11, color: '#555' }}>
          {dados.obs}
        </div>
      )}
      <Rodape />
    </div>
  )

  if (tipo === 'atestado') {
    const diasExt: Record<number, string> = { 1: 'um', 2: 'dois', 3: 'tres', 4: 'quatro', 5: 'cinco', 6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez', 15: 'quinze', 30: 'trinta' }
    const d = parseInt(dados.dias) || 1
    return (
      <div style={estilos.papel}>
        <Header />
        <div style={estilos.badge}>
          <div style={estilos.badgeTitle}>Atestado Medico</div>
          <div style={estilos.badgeSub}>Documento valido para fins legais e trabalhistas</div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.85, color: '#222', margin: '16px 0' }}>
          Atesto para os devidos fins que o(a) paciente <strong>{dados.paciente || '—'}</strong>,
          portador(a) do CPF <strong>{dados.cpf || '—'}</strong>,
          encontra-se sob meus cuidados medicos, necessitando de afastamento de suas
          atividades por <strong>{d} ({diasExt[d] || d}) dia{d > 1 ? 's' : ''}</strong>,
          a partir de <strong>{dados.dataInicio || hoje}</strong>
          {dados.cid && dados.exibirCid === 'sim' ? `, em razao do diagnostico ${dados.cid}` : ''}.
        </div>
        <Rodape />
      </div>
    )
  }

  if (tipo === 'declaracao') return (
    <div style={estilos.papel}>
      <Header />
      <div style={estilos.badge}><div style={estilos.badgeTitle}>Declaracao de Comparecimento</div></div>
      <div style={{ fontSize: 13, lineHeight: 1.85, color: '#222', margin: '16px 0' }}>
        Declaramos para os devidos fins que o(a) Sr.(a) <strong>{dados.paciente || '—'}</strong>,
        portador(a) do CPF <strong>{dados.cpf || '—'}</strong>,
        compareceu a esta unidade de saude no dia <strong>{dados.dataDoc || hoje}</strong>,
        no horario das <strong>{dados.entrada || '—'}</strong> as <strong>{dados.saida || '—'}</strong>,
        para atendimento medico ambulatorial.
      </div>
      <Rodape />
    </div>
  )

  if (tipo === 'exames') return (
    <div style={estilos.papel}>
      <Header />
      <div style={estilos.badge}><div style={estilos.badgeTitle}>Solicitacao de Exames {dados.tipoExame}</div></div>
      <PacienteBox />
      <div style={estilos.secTitle}>Exames solicitados</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 12, color: '#222', marginBottom: 14 }}>
        {dados.exames?.filter((e: string) => e).map((e: string, i: number) => (
          <div key={i}>• {e}{dados.urgente ? <strong style={{ color: '#A32D2D' }}> (URGENTE)</strong> : null}</div>
        ))}
      </div>
      {dados.hipotese && (
        <div style={{ fontSize: 12, marginBottom: 10 }}><strong>Hipotese diagnostica:</strong> {dados.hipotese}</div>
      )}
      <Rodape />
    </div>
  )

  if (tipo === 'encaminhamento') return (
    <div style={estilos.papel}>
      <Header />
      <div style={estilos.badge}><div style={estilos.badgeTitle}>Encaminhamento Medico</div></div>
      <PacienteBox />
      <div style={estilos.secTitle}>Dados do encaminhamento</div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, marginBottom: 4 }}><strong>Especialidade:</strong> {dados.especialidade || '—'}</div>
        <div style={{ fontSize: 12, marginBottom: 4 }}><strong>Tipo:</strong> {dados.tipoEnc || '—'}</div>
        <div style={{ fontSize: 12, marginBottom: 4 }}>
          <strong>Prioridade:</strong>{' '}
          <span style={{ color: dados.prioridade === 'Alta' ? '#A32D2D' : '#166534', fontWeight: 700 }}>{dados.prioridade || '—'}</span>
        </div>
      </div>
      <div style={estilos.secTitle}>Justificativa clinica</div>
      <div style={{ fontSize: 12, color: '#333', lineHeight: 1.6, marginBottom: 14 }}>{dados.justificativa || '—'}</div>
      <Rodape />
    </div>
  )

  return null
}
