import { STATUS_META, STATUS_ORDER, ORTO_META, ORTO_ORDER } from '@/data/teeth'
import { cn } from '@/lib/cn'

export function Legend() {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Condição
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {STATUS_ORDER.map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={cn('h-3 w-3 rounded-full', STATUS_META[s].dot)} />
              {STATUS_META[s].label}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Ortodontia
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {ORTO_ORDER.map((m) => (
            <span key={m} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={cn('h-3 w-3 rounded-full', ORTO_META[m].dot)} />
              {ORTO_META[m].label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
