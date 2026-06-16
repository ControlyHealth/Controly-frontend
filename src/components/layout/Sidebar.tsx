import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Bot, Package, CalendarDays, LogOut, ChevronUp } from 'lucide-react'
import Logo from "../../assets/favicon.png"
import { userService } from '@/services/user'
import { initials } from '@/lib/format'
import { cn } from '@/lib/cn'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pacientes', label: 'Pacientes', icon: Users, end: false },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, end: false },
  { to: '/estoque', label: 'Estoque', icon: Package, end: false },
  { to: '/automacoes', label: 'Automações', icon: Bot, end: false },
]

export function Sidebar() {
  const navigate = useNavigate()
  const user = userService.current()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    userService.logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <img src={Logo} alt="logo" />
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
      <div className="border-t border-slate-100 p-3">
        {menuOpen && (
          <button
            type="button"
            onClick={handleLogout}
            className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
          >
            <LogOut size={16} /> Sair
          </button>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-50 cursor-pointer"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {user ? initials(user.nome) : '?'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-800">
              {user?.nome ?? 'Visitante'}
            </span>
            <span className="block truncate text-xs text-slate-400">
              {user?.cargo ?? 'Gestão Odontológica'}
            </span>
          </span>
          <ChevronUp
            size={16}
            className={cn('shrink-0 text-slate-400 transition-transform', menuOpen ? '' : 'rotate-180')}
          />
        </button>
      </div>
    </aside>
  )
}
