import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  Users,
  CalendarDays,
  Package,
  Wallet,
  Bot,
  Activity,
  Info,
  CheckCheck,
  Trash2,
} from 'lucide-react'
import {
  notificationsService,
  type AppNotification,
  type NotificationTipo,
} from '@/services/notifications'
import { tempoRelativo } from '@/lib/format'
import { cn } from '@/lib/cn'

// Identidade visual de cada tipo de evento (mesma paleta do restante do app).
const TIPO_META: Record<NotificationTipo, { icon: typeof Bell; classes: string }> = {
  paciente: { icon: Users, classes: 'bg-brand-50 text-brand-600' },
  consulta: { icon: CalendarDays, classes: 'bg-sky-50 text-sky-600' },
  estoque: { icon: Package, classes: 'bg-amber-50 text-amber-600' },
  financeiro: { icon: Wallet, classes: 'bg-emerald-50 text-emerald-600' },
  automacao: { icon: Bot, classes: 'bg-violet-50 text-violet-600' },
  clinico: { icon: Activity, classes: 'bg-rose-50 text-rose-600' },
  sistema: { icon: Info, classes: 'bg-slate-100 text-slate-500' },
}

export function NotificationsBell() {
  const [items, setItems] = useState<AppNotification[]>(() => notificationsService.list())
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => notificationsService.subscribe(setItems), [])

  // fecha com Escape ou ao clicar/tocar fora do sino e do painel
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const alvo = e.target as Node
      if (rootRef.current && !rootRef.current.contains(alvo)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  const naoLidas = items.filter((n) => !n.lida).length

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={naoLidas > 0 ? `Notificações (${naoLidas} não lidas)` : 'Notificações'}
        aria-expanded={open}
        className={cn(
          'relative rounded-lg p-2 transition-colors cursor-pointer',
          open ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
        )}
      >
        <Bell size={19} />
        {naoLidas > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
            {naoLidas > 99 ? '99+' : naoLidas}
          </span>
        )}
      </button>

      {open && (
          <div
            className="absolute right-0 top-full z-50 mt-2 flex max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">
                Notificações
                {naoLidas > 0 && (
                  <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    {naoLidas} nova{naoLidas === 1 ? '' : 's'}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1">
                {naoLidas > 0 && (
                  <button
                    type="button"
                    onClick={() => notificationsService.markAllRead()}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 cursor-pointer"
                  >
                    <CheckCheck size={14} /> Marcar lidas
                  </button>
                )}
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => notificationsService.clear()}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                    aria-label="Limpar notificações"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Bell size={22} />
                </span>
                <p className="text-sm font-medium text-slate-600">Nada por aqui ainda</p>
                <p className="text-xs text-slate-400">
                  As atividades da clínica — cadastros, consultas, estoque — aparecem aqui.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50 overflow-y-auto">
                {items.map((n) => {
                  const meta = TIPO_META[n.tipo] ?? TIPO_META.sistema
                  const Icon = meta.icon
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => notificationsService.markRead(n.id)}
                        className={cn(
                          'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer',
                          n.lida ? 'hover:bg-slate-50' : 'bg-brand-50/40 hover:bg-brand-50/70',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                            meta.classes,
                          )}
                        >
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              'block truncate text-sm',
                              n.lida ? 'font-medium text-slate-600' : 'font-semibold text-slate-800',
                            )}
                          >
                            {n.titulo}
                          </span>
                          {n.descricao && (
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              {n.descricao}
                            </span>
                          )}
                          <span className="mt-0.5 block text-[11px] text-slate-400">
                            {tempoRelativo(n.criadoEm)}
                          </span>
                        </span>
                        {!n.lida && (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-hidden />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
      )}
    </div>
  )
}
