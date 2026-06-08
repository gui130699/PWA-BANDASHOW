import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { Loading } from './components/ui'
import { AuthProvider } from './contexts/AuthContext'
import { router } from './routes/router'

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loading label="Carregando pagina..." />}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  )
}
