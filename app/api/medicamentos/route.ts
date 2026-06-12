import { NextRequest } from 'next/server'

/**
 * Proxy para a consulta de medicamentos da ANVISA.
 *
 * O navegador não consegue chamar a API da ANVISA diretamente (CORS),
 * então esta rota faz a consulta pelo servidor e devolve um formato
 * simplificado para o autocomplete do receituário.
 *
 * Atenção: a API da ANVISA não é oficialmente documentada e pode mudar.
 * Em caso de falha, a rota devolve uma lista vazia e o front usa o
 * fallback local.
 */

export interface MedicamentoResultado {
  nome: string
  apresentacao: string
  laboratorio: string
  registro: string
}

const ANVISA_URL = 'https://consultas.anvisa.gov.br/api/consulta/medicamentos'

function extrairResultados(data: any): MedicamentoResultado[] {
  // A lista pode vir em data.content (paginada) ou ser o próprio array.
  const lista: any[] = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : []

  const vistos = new Set<string>()
  const resultados: MedicamentoResultado[] = []

  for (const item of lista) {
    const nome: string =
      item?.nomeProduto || item?.nomeComercial || item?.nome || item?.principioAtivo || ''
    if (!nome) continue

    const chave = nome.toUpperCase()
    if (vistos.has(chave)) continue
    vistos.add(chave)

    resultados.push({
      nome,
      apresentacao: item?.apresentacao || item?.formaFarmaceutica || item?.classe || '',
      laboratorio:
        item?.razaoSocial || item?.empresa?.razaoSocial || item?.empresa || item?.detentor || '',
      registro: String(item?.numeroRegistro || item?.registro || item?.processo?.numero || ''),
    })

    if (resultados.length >= 15) break
  }

  return resultados
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return Response.json({ resultados: [] })
  }

  try {
    const url = new URL(ANVISA_URL)
    url.searchParams.set('count', '20')
    url.searchParams.set('page', '1')
    url.searchParams.set('filter[nomeProduto]', q)

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        // A API pública da ANVISA exige este header.
        Authorization: 'Guest',
        'User-Agent': 'Mozilla/5.0 (compatible; PoliclinicaMed/1.0)',
      },
      // Evita travar o autocomplete se a ANVISA estiver lenta.
      signal: AbortSignal.timeout(8000),
      // Resultados podem ser reaproveitados por 1 dia.
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      console.warn(`ANVISA respondeu status ${res.status} para "${q}"`)
      return Response.json({ resultados: [] })
    }

    const data = await res.json()
    return Response.json({ resultados: extrairResultados(data) })
  } catch (error) {
    console.error('Erro ao consultar a ANVISA:', error)
    return Response.json({ resultados: [] })
  }
}
