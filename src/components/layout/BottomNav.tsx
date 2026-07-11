import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  CalendarDays,
  Package,
  Wallet,
  Bot,
  UserRound,
  LogOut,
  Menu,
  X,
  Lock,
} from 'lucide-react'
import type { Feature } from '@/lib/entitlements'
import { userService } from '@/services/user'
import { inboxService } from '@/services/inbox'
import { initials } from '@/lib/format'
import { cn } from '@/lib/cn'

const mainLinks: { to: string; label: string; icon: typeof Users; end: boolean; feature?: Feature }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pacientes', label: 'Pacientes', icon: Users, end: false },
  { to: '/mensagens', label: 'Mensagens', icon: MessagesSquare, end: false, feature: 'mensagens' },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, end: false },
]

const moreLinks: { to: string; label: string; icon: typeof Users; feature?: Feature }[] = [
  { to: '/estoque', label: 'Estoque', icon: Package },
  { to: '/financas', label: 'Finanças', icon: Wallet },
  { to: '/automacoes', label: 'Automações', icon: Bot, feature: 'automacoes' },
]

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const user = userService.current()
  const naoLidas = inboxService.unreadTotal()

  // fecha a folha "Mais" ao navegar
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  const moreActive = moreLinks.some(({ to }) => pathname.startsWith(to))

  function handleLogout() {
    userService.logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMoreOpen(false)
          }}
        >
          <div className="absolute inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] rounded-t-2xl border-t border-slate-200 bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center gap-3 border-b border-slate-100 px-2 pb-3">
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
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="space-y-1">
              {moreLinks.map(({ to, label, icon: Icon, feature }) => {
                const bloqueado = feature ? !userService.hasFeature(feature) : false
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        bloqueado && 'opacity-70',
                      )
                    }
                  >
                    <Icon size={18} />
                    <span className="flex-1">{label}</span>
                    {bloqueado && <Lock size={13} className="shrink-0 text-slate-400" />}
                  </NavLink>
                )
              })}
              {!userService.isGuest() && (
                <button
                  type="button"
                  onClick={() => { setMoreOpen(false); navigate('/perfil') }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                >
                  <UserRound size={18} /> Editar perfil
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
              >
                <LogOut size={18} /> Sair
              </button>
            </nav>
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegação principal"
      >
        {mainLinks.map(({ to, label, icon: Icon, end, feature }) => {
          const bloqueado = feature ? !userService.hasFeature(feature) : false
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700',
                  bloqueado && 'opacity-70',
                )
              }
            >
              <span className="relative">
                <Icon size={20} />
                {bloqueado ? (
                  <Lock
                    size={11}
                    className="absolute -right-2 -top-1 rounded-full bg-white text-slate-400"
                  />
                ) : (
                  to === '/mensagens' && naoLidas > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                      {naoLidas}
                    </span>
                  )
                )}
              </span>
              {label}
            </NavLink>
          )
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer',
            moreOpen || moreActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <Menu size={20} />
          Mais
        </button>
      </nav>
    </>
  )
}
