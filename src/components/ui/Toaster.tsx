import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { subscribeToasts, dismissToast, type ToastItem, type ToastVariant } from '@/lib/toast'
import { cn } from '@/lib/cn'

const STYLE: Record<ToastVariant, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'ring-emerald-100', iconColor: 'text-emerald-500' },
  error: { icon: AlertCircle, ring: 'ring-red-100', iconColor: 'text-red-500' },
  info: { icon: Info, ring: 'ring-brand-100', iconColor: 'text-brand-500' },
}

/** Renderiza a pilha de toasts. Montar UMA vez, no topo da aplicação. */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => subscribeToasts(setItems), [])

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      <style>{`
        @keyframes toastIn { from { opacity: 0; transform: translateY(12px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        .toast-in { animation: toastIn .22s cubic-bezier(.22,1,.36,1) both }
      `}</style>

      {items.map((t) => {
        const { icon: Icon, ring, iconColor } = STYLE[t.variant]
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg ring-1',
              ring,
            )}
          >
            <Icon size={18} className={cn('mt-0.5 shrink-0', iconColor)} />
            <p className="flex-1 text-sm text-slate-700">{t.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="-mr-1 rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-600 cursor-pointer"
              aria-label="Fechar notificação"
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
