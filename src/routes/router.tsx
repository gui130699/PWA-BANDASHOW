import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../components/layout/AdminLayout'
import { ClientLayout } from '../components/layout/ClientLayout'
import { AdminAgendaPage } from '../pages/admin/AdminAgendaPage'
import { AdminClientsPage } from '../pages/admin/AdminClientsPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminMembersPage } from '../pages/admin/AdminMembersPage'
import { AdminPaymentsPage } from '../pages/admin/AdminPaymentsPage'
import { AdminQuoteDetailPage } from '../pages/admin/AdminQuoteDetailPage'
import { AdminQuotesPage } from '../pages/admin/AdminQuotesPage'
import { AdminServicesPage } from '../pages/admin/AdminServicesPage'
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage'
import { AdminSuppliersPage } from '../pages/admin/AdminSuppliersPage'
import { AdminAccessPage } from '../pages/auth/AdminAccessPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ClientDashboardPage } from '../pages/client/ClientDashboardPage'
import { ClientPaymentsPage } from '../pages/client/ClientPaymentsPage'
import { ClientQuoteDetailPage } from '../pages/client/ClientQuoteDetailPage'
import { ClientQuotesPage } from '../pages/client/ClientQuotesPage'
import { NewQuotePage } from '../pages/client/NewQuotePage'
import { HomePage } from '../pages/public/HomePage'
import { RequestQuotePage } from '../pages/public/RequestQuotePage'
import { ProtectedRoute } from './ProtectedRoute'

const basename = import.meta.env.BASE_URL === '/' ? '/' : import.meta.env.BASE_URL.replace(/\/$/, '')

function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-night-950 px-4 text-center text-white">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-300">404</p>
        <h1 className="mt-3 text-4xl font-semibold">Pagina nao encontrada</h1>
        <p className="mt-3 text-slate-400">Volte para o inicio ou acesse seu painel.</p>
      </div>
    </div>
  )
}

export const router = createBrowserRouter(
  [
    { path: '/', element: <HomePage /> },
    { path: '/login', element: <LoginPage /> },
    { path: '/cadastro', element: <RegisterPage /> },
    { path: '/admin/acesso', element: <AdminAccessPage /> },
    { path: '/solicitar-orcamento', element: <RequestQuotePage /> },
    {
      element: <ProtectedRoute role="client" />,
      children: [
        {
          path: '/cliente',
          element: <ClientLayout />,
          children: [
            { index: true, element: <ClientDashboardPage /> },
            { path: 'novo-orcamento', element: <NewQuotePage /> },
            { path: 'orcamentos', element: <ClientQuotesPage /> },
            { path: 'orcamentos/:id', element: <ClientQuoteDetailPage /> },
            { path: 'pagamentos', element: <ClientPaymentsPage /> },
          ],
        },
      ],
    },
    {
      element: <ProtectedRoute role="admin" />,
      children: [
        {
          path: '/admin',
          element: <AdminLayout />,
          children: [
            { index: true, element: <Navigate replace to="/admin/dashboard" /> },
            { path: 'dashboard', element: <AdminDashboardPage /> },
            { path: 'agenda', element: <AdminAgendaPage /> },
            { path: 'orcamentos', element: <AdminQuotesPage /> },
            { path: 'orcamentos/:id', element: <AdminQuoteDetailPage /> },
            { path: 'servicos', element: <AdminServicesPage /> },
            { path: 'integrantes', element: <AdminMembersPage /> },
            { path: 'fornecedores', element: <AdminSuppliersPage /> },
            { path: 'pagamentos', element: <AdminPaymentsPage /> },
            { path: 'clientes', element: <AdminClientsPage /> },
            { path: 'configuracoes', element: <AdminSettingsPage /> },
          ],
        },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ],
  { basename },
)
