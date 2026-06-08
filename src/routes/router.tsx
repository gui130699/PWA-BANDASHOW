import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../components/layout/AdminLayout'
import { ClientLayout } from '../components/layout/ClientLayout'
import { ProtectedRoute } from './ProtectedRoute'

const AdminAgendaPage = lazy(() =>
  import('../pages/admin/AdminAgendaPage').then((module) => ({ default: module.AdminAgendaPage })),
)
const AdminClientsPage = lazy(() =>
  import('../pages/admin/AdminClientsPage').then((module) => ({ default: module.AdminClientsPage })),
)
const AdminDashboardPage = lazy(() =>
  import('../pages/admin/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })),
)
const AdminMembersPage = lazy(() =>
  import('../pages/admin/AdminMembersPage').then((module) => ({ default: module.AdminMembersPage })),
)
const AdminPaymentsPage = lazy(() =>
  import('../pages/admin/AdminPaymentsPage').then((module) => ({ default: module.AdminPaymentsPage })),
)
const AdminQuoteDetailPage = lazy(() =>
  import('../pages/admin/AdminQuoteDetailPage').then((module) => ({ default: module.AdminQuoteDetailPage })),
)
const AdminQuotesPage = lazy(() =>
  import('../pages/admin/AdminQuotesPage').then((module) => ({ default: module.AdminQuotesPage })),
)
const AdminServicesPage = lazy(() =>
  import('../pages/admin/AdminServicesPage').then((module) => ({ default: module.AdminServicesPage })),
)
const AdminSettingsPage = lazy(() =>
  import('../pages/admin/AdminSettingsPage').then((module) => ({ default: module.AdminSettingsPage })),
)
const AdminSuppliersPage = lazy(() =>
  import('../pages/admin/AdminSuppliersPage').then((module) => ({ default: module.AdminSuppliersPage })),
)
const AdminAccessPage = lazy(() =>
  import('../pages/auth/AdminAccessPage').then((module) => ({ default: module.AdminAccessPage })),
)
const LoginPage = lazy(() =>
  import('../pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('../pages/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })),
)
const ClientDashboardPage = lazy(() =>
  import('../pages/client/ClientDashboardPage').then((module) => ({ default: module.ClientDashboardPage })),
)
const ClientPaymentsPage = lazy(() =>
  import('../pages/client/ClientPaymentsPage').then((module) => ({ default: module.ClientPaymentsPage })),
)
const ClientQuoteDetailPage = lazy(() =>
  import('../pages/client/ClientQuoteDetailPage').then((module) => ({ default: module.ClientQuoteDetailPage })),
)
const ClientQuotesPage = lazy(() =>
  import('../pages/client/ClientQuotesPage').then((module) => ({ default: module.ClientQuotesPage })),
)
const NewQuotePage = lazy(() =>
  import('../pages/client/NewQuotePage').then((module) => ({ default: module.NewQuotePage })),
)
const HomePage = lazy(() =>
  import('../pages/public/HomePage').then((module) => ({ default: module.HomePage })),
)
const RequestQuotePage = lazy(() =>
  import('../pages/public/RequestQuotePage').then((module) => ({ default: module.RequestQuotePage })),
)

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
