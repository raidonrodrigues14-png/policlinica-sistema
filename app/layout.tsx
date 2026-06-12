import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'PoliclínicaMed — Gestão Municipal de Saúde',
    template: '%s · PoliclínicaMed',
  },
  description:
    'Sistema de prontuário eletrônico e gestão da Policlínica Municipal de Alto Alegre do Maranhão.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
