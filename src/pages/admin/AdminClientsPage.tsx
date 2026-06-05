import { Card, DataTable } from '../../components/ui'
import { useCollection } from '../../hooks/useCollection'
import type { Client } from '../../types'
import { formatDate } from '../../utils/format'

export function AdminClientsPage() {
  const { data: clients, loading } = useCollection<Client>('clients')

  return (
    <Card title="Clientes">
      <DataTable
        columns={[
          { header: 'Nome', cell: (client) => client.name },
          { header: 'Documento', cell: (client) => client.document },
          { header: 'Contato', cell: (client) => `${client.phone} - ${client.email}` },
          { header: 'Cidade', cell: (client) => `${client.city}/${client.state}` },
          { header: 'Cadastro', cell: (client) => formatDate(client.createdAt) },
        ]}
        data={clients}
        emptyTitle="Nenhum cliente cadastrado"
        getRowKey={(client) => client.id}
        loading={loading}
      />
    </Card>
  )
}
