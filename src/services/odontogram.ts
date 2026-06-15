import type { Odontograma, ToothRecord, ToothStatus, OrtoMarker } from '@/types'
import { readStore, writeStore } from '@/lib/storage'
import { ALL_TEETH } from '@/data/teeth'

const KEY = 'odontogramas'

type Store = Record<string, Odontograma>

function load(): Store {
  return readStore<Store>(KEY, {})
}

function persist(store: Store): void {
  writeStore(KEY, store)
}

function emptyChart(pacienteId: string): Odontograma {
  const dentes: Record<number, ToothRecord> = {}
  const now = new Date().toISOString()
  for (const numero of ALL_TEETH) {
    dentes[numero] = { numero, status: 'saudavel', atualizadoEm: now }
  }
  return { pacienteId, dentes, atualizadoEm: now }
}

export const odontogramService = {
  get(pacienteId: string): Odontograma {
    const store = load()
    return store[pacienteId] ?? emptyChart(pacienteId)
  },
  setTooth(
    pacienteId: string,
    numero: number,
    patch: { status?: ToothStatus; orto?: OrtoMarker; observacao?: string },
  ): Odontograma {
    const store = load()
    const chart = store[pacienteId] ?? emptyChart(pacienteId)
    const prev = chart.dentes[numero] ?? {
      numero,
      status: 'saudavel' as ToothStatus,
      atualizadoEm: new Date().toISOString(),
    }
    const now = new Date().toISOString()
    chart.dentes[numero] = {
      ...prev,
      ...patch,
      numero,
      atualizadoEm: now,
    }
    chart.atualizadoEm = now
    store[pacienteId] = chart
    persist(store)
    return chart
  },
  reset(pacienteId: string): Odontograma {
    const store = load()
    const fresh = emptyChart(pacienteId)
    store[pacienteId] = fresh
    persist(store)
    return fresh
  },
}
