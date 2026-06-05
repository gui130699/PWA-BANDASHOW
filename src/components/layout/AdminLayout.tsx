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
  { label: 'Orcamentos', to: '/admin/orcamentos', icon: ClipboardList },
  { label: 'Servicos', to: '/admin/servicos', icon: Music },
  { label: 'Integrantes', to: '/admin/integrantes', icon: Users },
  { label: 'Fornecedores', to: '/admin/fornecedores', icon: Truck },
  { label: 'Pagamentos', to: '/admin/pagamentos', icon: HandCoins },
  { label: 'Clientes', to: '/admin/clientes', icon: WalletCards },
  { label: 'Configuracoes', to: '/admin/configuracoes', icon: Settings },
]

export function AdminLayout() {
  return (
    <DashboardLayout
      items={adminItems}
      subtitle="Agenda, orcamentos, custos e pagamentos"
      title="Painel Administrativo"
    />
  )
}
