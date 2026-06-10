import { STATUS_META, STATUS_ORDER } from '@/data/teeth'
import { cn } from '@/lib/cn'

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {STATUS_ORDER.map((s) => (
        <span key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className={cn('h-3 w-3 rounded-full', STATUS_META[s].dot)} />
          {STATUS_META[s].label}
        </span>
      ))}
    </div>
  )
}
