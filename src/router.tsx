import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PatientsPage } from '@/features/patients/PatientsPage'
import { PatientDetailPage } from '@/features/patients/PatientDetailPage'
import { AutomationsPage } from '@/features/automations/AutomationsPage'
import { StockPage } from '@/features/stock/StockPage'
import { AgendaPage } from '@/features/agenda/AgendaPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'pacientes', element: <PatientsPage /> },
      { path: 'pacientes/:id', element: <PatientDetailPage /> },
      { path: 'agenda', element: <AgendaPage /> },
      { path: 'estoque', element: <StockPage /> },
      { path: 'automacoes', element: <AutomationsPage /> },
    ],
  },
])
