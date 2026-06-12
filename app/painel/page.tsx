import { redirect } from 'next/navigation'

/**
 * O painel de chamadas vive dentro da Recepção (aba "Painel de chamadas").
 * Esta rota é mantida apenas por compatibilidade com links antigos.
 */
export default function PainelPage() {
  redirect('/recepcao')
}
