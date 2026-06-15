import { useLocation, Link } from 'react-router-dom'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/pacientes': 'Pacientes',
  '/agenda': 'Agenda',
  '/estoque': 'Gerenciamento de estoque',
  '/automacoes': 'Automações via WhatsApp',
}

export function Topbar() {
  const { pathname } = useLocation()
  const title =
    titles[pathname] ??
    (pathname.startsWith('/pacientes') ? 'Detalhes do paciente' : 'Controly')

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur md:px-8">
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      <Link
        to="/pacientes"
        className="md:hidden text-sm font-medium text-brand-600"
      >
        Pacientes
      </Link>
    </header>
  )
}
