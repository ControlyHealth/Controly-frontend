import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PatientsPage } from '@/features/patients/PatientsPage'
import { PatientDetailPage } from '@/features/patients/PatientDetailPage'
import { AutomationsPage } from '@/features/automations/AutomationsPage'
import { InboxPage } from '@/features/inbox/InboxPage'
import { StockPage } from '@/features/stock/StockPage'
import { AgendaPage } from '@/features/agenda/AgendaPage'
import { FinancePage } from '@/features/finance/FinancePage'
import { LoginPage } from '@/features/auth/LoginPage'
import { PlansPage } from '@/features/plans/PlansPage'
import { RequireAuth } from '@/features/auth/RequireAuth'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/planos', element: <PlansPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'pacientes', element: <PatientsPage /> },
      { path: 'pacientes/:id', element: <PatientDetailPage /> },
      { path: 'mensagens', element: <InboxPage /> },
      { path: 'agenda', element: <AgendaPage /> },
      { path: 'estoque', element: <StockPage /> },
      { path: 'financas', element: <FinancePage /> },
      { path: 'automacoes', element: <AutomationsPage /> },
    ],
  },
])
