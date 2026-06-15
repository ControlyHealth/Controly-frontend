import type { OrthoTreatment } from '@/types'
import { readStore, writeStore } from '@/lib/storage'

const KEY = 'ortho'

type Store = Record<string, OrthoTreatment>

function load(): Store {
  return readStore<Store>(KEY, {})
}

function persist(store: Store): void {
  writeStore(KEY, store)
}

function empty(pacienteId: string): OrthoTreatment {
  return { pacienteId, status: 'planejado', atualizadoEm: new Date().toISOString() }
}

export type OrthoInput = Omit<OrthoTreatment, 'pacienteId' | 'atualizadoEm'>

export const orthoService = {
  get(pacienteId: string): OrthoTreatment {
    return load()[pacienteId] ?? empty(pacienteId)
  },
  save(pacienteId: string, input: OrthoInput): OrthoTreatment {
    const store = load()
    const updated: OrthoTreatment = {
      ...input,
      pacienteId,
      atualizadoEm: new Date().toISOString(),
    }
    store[pacienteId] = updated
    persist(store)
    return updated
  },
}
