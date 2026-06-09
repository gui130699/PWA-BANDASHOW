import { ClipboardList, Home, PlusCircle, WalletCards } from 'lucide-react'
import { DashboardLayout } from './DashboardLayout'

const clientItems = [
  { label: 'Início', to: '/cliente', icon: Home },
  { label: 'Novo orçamento', to: '/cliente/novo-orcamento', icon: PlusCircle },
  { label: 'Meus orçamentos', to: '/cliente/orcamentos', icon: ClipboardList },
  { label: 'Pagamentos', to: '/cliente/pagamentos', icon: WalletCards },
]

export function ClientLayout() {
  return (
    <DashboardLayout
      items={clientItems}
      subtitle="Solicitacoes, status e pagamentos Pix"
      title="Painel do Cliente"
    />
  )
}
