import { cn } from '@/lib/cn'

/**
 * Placeholders de carregamento. Use enquanto dados assíncronos chegam.
 * Envolva a área em carregamento com `aria-busy` e `aria-hidden` nos skeletons.
 *
 * Ex.:
 *   {loading ? <SkeletonTable rows={5} cols={4} /> : <Table ... />}
 */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-slate-200/70', className)} />
}

/** Bloco de linhas de texto (a última mais curta). */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

/** Card genérico (ícone/avatar + título + linhas). */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  )
}

/** Lista de itens (ex.: contas a receber, pacientes). */
export function SkeletonList({ items = 4, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-busy="true">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/** Tabela (cabeçalho + linhas). */
export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white', className)} aria-busy="true">
      <div className="flex gap-4 border-b border-slate-100 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-slate-50 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-4 flex-1', c === 0 && 'max-w-[40%]')} />
          ))}
        </div>
      ))}
    </div>
  )
}
