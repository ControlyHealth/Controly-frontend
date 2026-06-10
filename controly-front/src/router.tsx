import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PatientsPage } from '@/features/patients/PatientsPage'
import { PatientDetailPage } from '@/features/patients/PatientDetailPage'
import { AutomationsPage } from '@/features/automations/AutomationsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'pacientes', element: <PatientsPage /> },
      { path: 'pacientes/:id', element: <PatientDetailPage /> },
      { path: 'automacoes', element: <AutomationsPage /> },
    ],
  },
])
