import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './hooks/use-auth'
import { AuroProvider } from './hooks/use-auro'

// Pages
import Index from './pages/Index'
import Clientes from './pages/Clientes'
import Prospeccao from './pages/Prospeccao'
import Funil from './pages/Funil'
import Relatorios from './pages/Relatorios'
import Tarefas from './pages/Tarefas'
import Propostas from './pages/Propostas'
import PropostaForm from './pages/PropostaForm'
import PropostaView from './pages/PropostaView'
import Configuracoes from './pages/Configuracoes'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import ClienteDetail from './pages/ClienteDetail'
import LeadDetail from './pages/LeadDetail'
import Usuarios from './pages/Usuarios'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Index />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/prospeccao" element={<Prospeccao />} />
      <Route path="/funil" element={<Funil />} />
      <Route path="/relatorios" element={<Relatorios />} />
      <Route path="/tarefas" element={<Tarefas />} />
      <Route path="/propostas" element={<Propostas />} />
      <Route path="/propostas/nova" element={<PropostaForm />} />
      <Route path="/propostas/:id/editar" element={<PropostaForm />} />
      <Route path="/propostas/:id" element={<PropostaView />} />
      <Route path="/configuracoes" element={<Configuracoes />} />
      <Route path="/usuarios" element={<Usuarios />} />
      <Route path="/clientes/:id" element={<ClienteDetail />} />
      <Route path="/leads/:id" element={<LeadDetail />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
)

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AuroProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuroProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
