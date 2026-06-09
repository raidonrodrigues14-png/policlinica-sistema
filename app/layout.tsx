import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PoliclinicaMed',
  description: 'Sistema de Gestao Municipal de Saude',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
