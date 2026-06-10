import { useState } from 'react'
import type { Odontograma, ToothStatus } from '@/types'
import { UPPER_ARCH, LOWER_ARCH } from '@/data/teeth'
import { odontogramService } from '@/services/odontogram'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RotateCcw } from 'lucide-react'
import { Tooth } from './Tooth'
import { ToothPanel } from './ToothPanel'
import { Legend } from './Legend'

export function Odontogram({ pacienteId }: { pacienteId: string }) {
  const [chart, setChart] = useState<Odontograma>(() => odontogramService.get(pacienteId))
  const [selected, setSelected] = useState<number | null>(null)

  function handleSave(numero: number, patch: { status: ToothStatus; observacao: string }) {
    const updated = odontogramService.setTooth(pacienteId, numero, patch)
    setChart({ ...updated, dentes: { ...updated.dentes } })
    setSelected(null)
  }

  function handleReset() {
    if (confirm('Reiniciar o odontograma deste paciente? Todas as marcações serão apagadas.')) {
      setChart(odontogramService.reset(pacienteId))
      setSelected(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Odontograma</h3>
          <Button variant="ghost" size="sm" onClick={handleReset}>
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
                    selected={selected === n}
                    onClick={() => setSelected(n)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200" />

          {/* Arcada inferior */}
          <div>
            <div className="flex min-w-max justify-center gap-0.5">
              {LOWER_ARCH.map((n, i) => (
                <div key={n} className={i === 8 ? 'ml-3' : ''}>
                  <Tooth
                    numero={n}
                    record={chart.dentes[n]}
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
            <div className="mb-2 text-4xl">🦷</div>
            <p className="text-sm font-medium text-slate-600">Selecione um dente</p>
            <p className="mt-1 text-xs text-slate-400">
              Clique em qualquer dente do mapa para registrar a condição e adicionar observações.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
