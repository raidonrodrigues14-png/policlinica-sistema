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

/** Protege a página: redireciona para /login se não houver sessão. */
export function useUsuario(): Usuario | null {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    const u = getUsuario()
    if (!u) {
      router.replace('/login')
      return
    }
    setUsuario(u)
  }, [router])

  return usuario
}
