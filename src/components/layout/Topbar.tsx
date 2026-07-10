import { useLocation } from 'react-router-dom'
import { NotificationsBell } from './NotificationsBell'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/pacientes': 'Pacientes',
  '/mensagens': 'Mensagens',
  '/agenda': 'Agenda',
  '/estoque': 'Gerenciamento de estoque',
  '/financas': 'Finanças',
  '/automacoes': 'Automações via WhatsApp',
  '/perfil': 'Meu perfil',
}

export function Topbar() {
  const { pathname } = useLocation()
  const title =
    titles[pathname] ??
    (pathname.startsWith('/pacientes') ? 'Detalhes do paciente' : 'Controly')

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-8">
      <h1 className="truncate text-lg font-semibold text-slate-800">{title}</h1>
      <NotificationsBell />
    </header>
  )
}
