import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Bot, Activity } from 'lucide-react'
import { cn } from '@/lib/cn'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pacientes', label: 'Pacientes', icon: Users, end: false },
  { to: '/automacoes', label: 'Automações', icon: Bot, end: false },
]

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Activity size={18} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-800">Controly</p>
          <p className="text-xs text-slate-400">Gestão Odontológica</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-4">
        <p className="text-xs text-slate-400">
          Clínica Controly
          <br />
          v0.1.0 · dados locais
        </p>
      </div>
    </aside>
  )
}
