import {
  CalendarDays,
  Gauge,
  HandCoins,
  Settings,
  Truck,
  Users,
  WalletCards,
  ClipboardList,
  Music,
} from 'lucide-react'
import { DashboardLayout } from './DashboardLayout'

const adminItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: Gauge },
  { label: 'Agenda', to: '/admin/agenda', icon: CalendarDays },
  { label: 'Orçamentos', to: '/admin/orcamentos', icon: ClipboardList },
  { label: 'Serviços', to: '/admin/servicos', icon: Music },
  { label: 'Integrantes', to: '/admin/integrantes', icon: Users },
  { label: 'Fornecedores', to: '/admin/fornecedores', icon: Truck },
  { label: 'Pagamentos', to: '/admin/pagamentos', icon: HandCoins },
  { label: 'Clientes', to: '/admin/clientes', icon: WalletCards },
  { label: 'Configurações', to: '/admin/configuracoes', icon: Settings },
]

export function AdminLayout() {
  return (
    <DashboardLayout
      items={adminItems}
      subtitle="Agenda, orçamentos, custos e pagamentos"
      title="Painel Administrativo"
    />
  )
}
