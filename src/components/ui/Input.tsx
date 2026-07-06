import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

/**
 * Sistema único de campos do design system.
 * Estilo alinhado ao das telas de auth (rounded-xl, fundo suave, ring azul),
 * com suporte a ícone e estado de erro. Todos os formulários usam estes.
 */

const base =
  'w-full rounded-xl border bg-slate-50/60 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60'

function stateCls(error?: boolean) {
  return error
    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
    : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
}

export function Field({
  label,
  children,
  hint,
  error,
}: {
  label?: string
  children: ReactNode
  hint?: string
  error?: string
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-500">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  )
}

export function Input({
  className,
  icon,
  error,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode; error?: boolean }) {
  if (icon) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input className={cn(base, stateCls(error), 'py-2.5 pl-10 pr-3', className)} {...rest} />
      </div>
    )
  }
  return <input className={cn(base, stateCls(error), 'px-3 py-2.5', className)} {...rest} />
}

export function Textarea({
  className,
  error,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return <textarea className={cn(base, stateCls(error), 'min-h-24 resize-y px-3 py-2.5', className)} {...rest} />
}

export function Select({
  className,
  children,
  error,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode; error?: boolean }) {
  return (
    <select className={cn(base, stateCls(error), 'cursor-pointer px-3 py-2.5', className)} {...rest}>
      {children}
    </select>
  )
}
