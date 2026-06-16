import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { cn } from '@/lib/cn'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-md">
      <div className="flex gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600',
          )}
        >
          <AlertTriangle size={20} />
        </span>
        {description && <p className="pt-1.5 text-sm text-slate-600">{description}</p>}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            'inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer',
            variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700',
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
