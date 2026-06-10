import type { ToothRecord } from '@/types'
import { STATUS_META } from '@/data/teeth'
import { cn } from '@/lib/cn'

export function Tooth({
  numero,
  record,
  selected,
  onClick,
}: {
  numero: number
  record?: ToothRecord
  selected: boolean
  onClick: () => void
}) {
  const status = record?.status ?? 'saudavel'
  const meta = STATUS_META[status]
  const hasNote = !!record?.observacao?.trim()
  const ausente = status === 'ausente'

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Dente ${numero} — ${meta.label}`}
      className={cn(
        'group relative flex flex-col items-center gap-1 rounded-lg p-1 transition',
        selected ? 'bg-brand-100 ring-2 ring-brand-500' : 'hover:bg-slate-100',
      )}
    >
      <svg width="34" height="42" viewBox="0 0 34 42" className="shrink-0">
        {/* coroa */}
        <path
          d="M6 14 C6 6, 12 2, 17 2 C22 2, 28 6, 28 14 C28 20, 24 24, 17 24 C10 24, 6 20, 6 14 Z"
          fill={meta.fill}
          stroke={meta.stroke}
          strokeWidth="2"
          strokeDasharray={ausente ? '3 3' : undefined}
        />
        {/* raízes */}
        <path
          d="M11 23 L9 39 M17 24 L17 40 M23 23 L25 39"
          fill="none"
          stroke={meta.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={ausente ? '3 3' : undefined}
          opacity={ausente ? 0.5 : 1}
        />
      </svg>
      <span className="text-[11px] font-medium tabular-nums text-slate-500">{numero}</span>
      {hasNote && (
        <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />
      )}
    </button>
  )
}
