export const kpiData = {
  totalClients: { value: '1.240', trend: '+12%', isPositive: true },
  activeLeads: { value: '85', trend: '+5%', isPositive: true },
  ongoingDeals: { value: '42', trend: '-2%', isPositive: false },
  conversionRate: { value: '18.5%', trend: '+1.2%', isPositive: true },
  pipelineValue: { value: 'R$ 450.000', trend: '+R$ 50k', isPositive: true },
}

export type Priority = 'Alta' | 'Média' | 'Baixa'

export interface Deal {
  id: string
  company: string
  value: number
  priority: Priority
  contact: string
}

export interface KanbanColumn {
  id: string
  title: string
  deals: Deal[]
}

export const kanbanBoardData: KanbanColumn[] = [
  {
    id: 'prospeccao',
    title: 'Prospecção',
    deals: [
      { id: '1', company: 'TechNova', value: 15000, priority: 'Alta', contact: 'João Silva' },
      {
        id: '2',
        company: 'Indústrias ABC',
        value: 8500,
        priority: 'Média',
        contact: 'Maria Costa',
      },
      {
        id: '3',
        company: 'Comércio Local',
        value: 3000,
        priority: 'Baixa',
        contact: 'Pedro Santos',
      },
    ],
  },
  {
    id: 'qualificacao',
    title: 'Qualificação',
    deals: [
      { id: '4', company: 'GlobalCorp', value: 45000, priority: 'Alta', contact: 'Ana Souza' },
      { id: '5', company: 'StartupX', value: 12000, priority: 'Média', contact: 'Lucas Lima' },
    ],
  },
  {
    id: 'proposta',
    title: 'Proposta Enviada',
    deals: [
      { id: '6', company: 'Mega Varejo', value: 28000, priority: 'Alta', contact: 'Carla Dias' },
      {
        id: '7',
        company: 'Construtora XYZ',
        value: 55000,
        priority: 'Alta',
        contact: 'Roberto Alves',
      },
      {
        id: '8',
        company: 'Serviços Já',
        value: 4500,
        priority: 'Baixa',
        contact: 'Fernanda Rocha',
      },
    ],
  },
  {
    id: 'negociacao',
    title: 'Negociação',
    deals: [
      {
        id: '9',
        company: 'Logística BR',
        value: 32000,
        priority: 'Média',
        contact: 'Carlos Moura',
      },
    ],
  },
  {
    id: 'ganho',
    title: 'Fechado/Ganho',
    deals: [
      {
        id: '10',
        company: 'Agência Criativa',
        value: 18000,
        priority: 'Alta',
        contact: 'Juliana Mendes',
      },
      {
        id: '11',
        company: 'Educação Plus',
        value: 9500,
        priority: 'Média',
        contact: 'Marcos Paulo',
      },
    ],
  },
  {
    id: 'perdido',
    title: 'Perdido',
    deals: [
      {
        id: '12',
        company: 'Finanças SA',
        value: 22000,
        priority: 'Alta',
        contact: 'Patrícia Gomes',
      },
    ],
  },
]

export const clientsData = [
  {
    id: '1',
    name: 'TechNova',
    contact: 'João Silva',
    email: 'joao@technova.com',
    status: 'Ativo',
    lastInteraction: '2023-10-25',
  },
  {
    id: '2',
    name: 'Indústrias ABC',
    contact: 'Maria Costa',
    email: 'maria@abc.com',
    status: 'Inativo',
    lastInteraction: '2023-09-15',
  },
  {
    id: '3',
    name: 'GlobalCorp',
    contact: 'Ana Souza',
    email: 'ana@globalcorp.com',
    status: 'Ativo',
    lastInteraction: '2023-10-26',
  },
  {
    id: '4',
    name: 'Mega Varejo',
    contact: 'Carla Dias',
    email: 'carla@megavarejo.com',
    status: 'Ativo',
    lastInteraction: '2023-10-20',
  },
  {
    id: '5',
    name: 'StartupX',
    contact: 'Lucas Lima',
    email: 'lucas@startupx.com',
    status: 'Prospect',
    lastInteraction: '2023-10-27',
  },
]

export const tasksData = [
  {
    id: '1',
    title: 'Ligar para João da TechNova',
    dueDate: 'Hoje',
    status: 'Pendente',
    priority: 'Alta',
  },
  {
    id: '2',
    title: 'Enviar proposta para GlobalCorp',
    dueDate: 'Amanhã',
    status: 'Pendente',
    priority: 'Alta',
  },
  {
    id: '3',
    title: 'Follow-up com Indústrias ABC',
    dueDate: '28/10/2023',
    status: 'Concluído',
    priority: 'Média',
  },
  {
    id: '4',
    title: 'Reunião de alinhamento Mega Varejo',
    dueDate: '30/10/2023',
    status: 'Pendente',
    priority: 'Média',
  },
]

export const proposalsData = [
  { id: 'PROP-001', client: 'Mega Varejo', value: 28000, status: 'Enviada', date: '20/10/2023' },
  {
    id: 'PROP-002',
    client: 'Construtora XYZ',
    value: 55000,
    status: 'Em Análise',
    date: '22/10/2023',
  },
  { id: 'PROP-003', client: 'TechNova', value: 15000, status: 'Aprovada', date: '15/10/2023' },
  { id: 'PROP-004', client: 'Finanças SA', value: 22000, status: 'Recusada', date: '10/10/2023' },
]
