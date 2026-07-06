/**
 * Store de toasts sem dependência externa.
 *
 * API imperativa no estilo `sonner`: `toast.success('...')` de qualquer lugar
 * (componentes, serviços, handlers). O componente <Toaster/> assina o store e
 * renderiza. Auto-dismiss por duração; 0 = fica até o usuário fechar.
 */
import { uid } from '@/lib/id'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  variant: ToastVariant
  message: string
  duration: number
}

type Listener = (items: ToastItem[]) => void

let items: ToastItem[] = []
const listeners = new Set<Listener>()

function emit(): void {
  for (const l of listeners) l(items)
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener)
  listener(items)
  return () => {
    listeners.delete(listener)
  }
}

export function dismissToast(id: string): void {
  items = items.filter((t) => t.id !== id)
  emit()
}

function push(variant: ToastVariant, message: string, duration: number): string {
  const id = uid()
  items = [...items, { id, variant, message, duration }]
  emit()
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration)
  }
  return id
}

export const toast = {
  success: (message: string, duration = 3500) => push('success', message, duration),
  error: (message: string, duration = 5000) => push('error', message, duration),
  info: (message: string, duration = 3500) => push('info', message, duration),
  dismiss: dismissToast,
}
