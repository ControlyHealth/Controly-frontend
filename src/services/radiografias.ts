import type { Radiografia } from '@/types'
import { readStore, writeStore } from '@/lib/storage'
import { uid } from '@/lib/id'

const KEY = 'radiografias'

type Store = Record<string, Radiografia[]>

function load(): Store {
  return readStore<Store>(KEY, {})
}

function persist(store: Store): void {
  writeStore(KEY, store)
}

export type RadiografiaInput = Omit<Radiografia, 'id' | 'criadoEm'>

export const radiografiasService = {
  list(pacienteId: string): Radiografia[] {
    return (load()[pacienteId] ?? []).sort((a, b) => b.data.localeCompare(a.data))
  },
  count(pacienteId: string): number {
    return load()[pacienteId]?.length ?? 0
  },
  create(input: RadiografiaInput): Radiografia {
    const store = load()
    const radiografia: Radiografia = { ...input, id: uid(), criadoEm: new Date().toISOString() }
    store[input.pacienteId] = [radiografia, ...(store[input.pacienteId] ?? [])]
    persist(store)
    return radiografia
  },
  remove(pacienteId: string, id: string): void {
    const store = load()
    store[pacienteId] = (store[pacienteId] ?? []).filter((r) => r.id !== id)
    persist(store)
  },
}
