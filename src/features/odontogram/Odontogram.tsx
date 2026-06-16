import { useState } from 'react'
import type { Odontograma, ToothStatus, OrtoMarker } from '@/types'
import { UPPER_ARCH, LOWER_ARCH } from '@/data/teeth'
import { odontogramService } from '@/services/odontogram'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RotateCcw, MousePointerClick } from 'lucide-react'
import { Tooth } from './Tooth'
import { ToothPanel } from './ToothPanel'
import { Legend } from './Legend'

export function Odontogram({ pacienteId }: { pacienteId: string }) {
  const [chart, setChart] = useState<Odontograma>(() => odontogramService.get(pacienteId))
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  function handleSave(
    numero: number,
    patch: { status: ToothStatus; orto: OrtoMarker; observacao: string },
  ) {
    const updated = odontogramService.setTooth(pacienteId, numero, patch)
    setChart({ ...updated, dentes: { ...updated.dentes } })
    setSelected(null)
  }

  function handleReset() {
    setChart(odontogramService.reset(pacienteId))
    setSelected(null)
    setConfirmReset(false)
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Odontograma</h3>
          <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={14} /> Reiniciar
          </Button>
        </div>

        <div className="space-y-4 overflow-x-auto">
          {/* Arcada superior */}
          <div>
            <p className="mb-1 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
              Arcada superior
            </p>
            <div className="flex min-w-max justify-center gap-0.5">
              {UPPER_ARCH.map((n, i) => (
                <div key={n} className={i === 8 ? 'ml-3' : ''}>
                  <Tooth
                    numero={n}
                    record={chart.dentes[n]}
                    arch="upper"
                    selected={selected === n}
                    onClick={() => setSelected(n)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* faixa de gengiva */}
          <div
            className="h-5 rounded-full"
            style={{
              background:
                'radial-gradient(60% 120% at 50% 50%, rgba(244,143,154,0.55), rgba(248,180,189,0.18) 70%, transparent 100%)',
            }}
          />

          {/* Arcada inferior */}
          <div>
            <div className="flex min-w-max justify-center gap-0.5">
              {LOWER_ARCH.map((n, i) => (
                <div key={n} className={i === 8 ? 'ml-3' : ''}>
                  <Tooth
                    numero={n}
                    record={chart.dentes[n]}
                    arch="lower"
                    selected={selected === n}
                    onClick={() => setSelected(n)}
                  />
                </div>
              ))}
            </div>
            <p className="mt-1 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
              Arcada inferior
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <Legend />
        </div>
      </Card>

      <Card className="p-5">
        {selected ? (
          <ToothPanel
            numero={selected}
            record={chart.dentes[selected]}
            onSave={(patch) => handleSave(selected, patch)}
            onClose={() => setSelected(null)}
          />
        ) : (
          <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
              <MousePointerClick size={26} />
            </span>
            <p className="text-sm font-medium text-slate-600">Selecione um dente</p>
            <p className="mt-1 text-xs text-slate-400">
              Clique em qualquer dente do mapa para registrar a condição e adicionar observações.
            </p>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmReset}
        title="Reiniciar odontograma"
        description="Todas as marcações deste paciente serão apagadas. Esta ação não pode ser desfeita."
        confirmLabel="Reiniciar"
        onConfirm={handleReset}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  )
}
