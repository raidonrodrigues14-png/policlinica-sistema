'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export type Perfil = 'recepcionista' | 'enfermeiro' | 'medico' | 'gestor'

export interface Usuario {
  nome: string
  perfil: Perfil
  usuario: string
}

export const PERFIL_COR: Record<Perfil, string> = {
  recepcionista: '#10b981',
  enfermeiro: '#0ea5e9',
  medico: '#ec4899',
  gestor: '#f59e0b',
}

/** Página inicial (e única) de cada perfil. */
export const ROTA_POR_PERFIL: Record<Perfil, string> = {
  recepcionista: '/recepcao',
  enfermeiro: '/triagem',
  medico: '/prontuario',
  gestor: '/gestao',
}

export function getUsuario(): Usuario | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('usuario')
    return raw ? (JSON.parse(raw) as Usuario) : null
  } catch {
    return null
  }
}

export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Protege a página:
 * - sem sessão → redireciona para /login
 * - com sessão, mas perfil não autorizado → redireciona para a página do próprio perfil
 */
export function useUsuario(perfisPermitidos?: Perfil[]): Usuario | null {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const chavePerfis = perfisPermitidos?.join(',') ?? ''

  useEffect(() => {
    const u = getUsuario()
    if (!u) {
      router.replace('/login')
      return
    }
    const perfis = chavePerfis ? (chavePerfis.split(',') as Perfil[]) : null
    if (perfis && !perfis.includes(u.perfil)) {
      router.replace(ROTA_POR_PERFIL[u.perfil] ?? '/login')
      return
    }
    setUsuario(u)
  }, [router, chavePerfis])

  return usuario
}
