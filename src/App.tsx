import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'

// Pages
import Index from './pages/Index'
import Clientes from './pages/Clientes'
import Prospeccao from './pages/Prospeccao'
import Funil from './pages/Funil'
import Tarefas from './pages/Tarefas'
import Propostas from './pages/Propostas'
import Configuracoes from './pages/Configuracoes'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/prospeccao" element={<Prospeccao />} />
          <Route path="/funil" element={<Funil />} />
          <Route path="/tarefas" element={<Tarefas />} />
          <Route path="/propostas" element={<Propostas />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
