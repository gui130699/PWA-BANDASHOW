import { BarChart3, CalendarDays, ClipboardList, TrendingUp, WalletCards } from 'lucide-react'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, DataTable, StatusBadge } from '../../components/ui'
import { useCollection } from '../../hooks/useCollection'
import type { Payment, Quote } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'

function monthKey(dateValue?: string) {
  if (!dateValue) return 'Sem data'
  const date = new Date(`${dateValue}T00:00:00`)
  return Number.isNaN(date.getTime()) ? 'Sem data' : `${date.getMonth() + 1}/${date.getFullYear()}`
}

export function AdminDashboardPage() {
  const { data: quotes, loading: quotesLoading } = useCollection<Quote>('quotes')
  const { data: payments } = useCollection<Payment>('payments')

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const monthQuotes = quotes.filter((quote) => {
      const date = new Date(`${quote.event.date}T00:00:00`)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    const receivedMonth = payments
      .filter((payment) => payment.status === 'confirmado')
      .reduce((sum, payment) => sum + payment.amount, 0)

    return [
      {
        label: 'Em analise',
        value: quotes.filter((quote) => quote.status === 'em_analise').length,
        icon: ClipboardList,
      },
      {
        label: 'Eventos agendados',
        value: quotes.filter((quote) => quote.status === 'agendado').length,
        icon: CalendarDays,
      },
      {
        label: 'Entradas pendentes',
        value: payments.filter((payment) => payment.type === 'entrada_50' && payment.status !== 'confirmado').length,
        icon: WalletCards,
      },
      {
        label: 'Recebido no mes',
        value: formatCurrency(receivedMonth),
        icon: TrendingUp,
      },
      {
        label: 'Previsto no mes',
        value: formatCurrency(monthQuotes.reduce((sum, quote) => sum + quote.total, 0)),
        icon: BarChart3,
      },
      {
        label: 'Lucro estimado',
        value: formatCurrency(monthQuotes.reduce((sum, quote) => sum + quote.estimatedProfit, 0)),
        icon: TrendingUp,
      },
    ]
  }, [payments, quotes])

  const chartData = useMemo(() => {
    const grouped = new Map<string, { month: string; receita: number; custos: number }>()
    quotes.forEach((quote) => {
      const key = monthKey(quote.event.date)
      const current = grouped.get(key) || { month: key, receita: 0, custos: 0 }
      grouped.set(key, {
        month: key,
        receita: current.receita + quote.total,
        custos: current.custos + quote.totalCosts,
      })
    })
    return Array.from(grouped.values()).slice(0, 6)
  }, [quotes])

  const upcoming = [...quotes]
    .filter((quote) => ['agendado', 'entrada_confirmada'].includes(quote.status))
    .sort((a, b) => a.event.date.localeCompare(b.event.date))
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label}>
              <Icon className="mb-4 h-7 w-7 text-gold-300" />
              <p className="text-2xl font-semibold text-white">{item.value}</p>
              <p className="mt-1 text-sm text-slate-400">{item.label}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Receita e custos por mes">
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: '#0d111c', border: '1px solid rgba(255,255,255,0.12)' }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Bar dataKey="receita" fill="#f7b731" radius={[4, 4, 0, 0]} />
                <Bar dataKey="custos" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Proximos eventos">
          <DataTable
            columns={[
              { header: 'Data', cell: (quote) => formatDate(quote.event.date) },
              { header: 'Cliente', cell: (quote) => quote.clientSnapshot.name },
              { header: 'Status', cell: (quote) => <StatusBadge status={quote.status} /> },
            ]}
            data={upcoming}
            emptyTitle="Nenhum evento agendado"
            getRowKey={(quote) => quote.id}
            loading={quotesLoading}
          />
        </Card>
      </div>
    </div>
  )
}
