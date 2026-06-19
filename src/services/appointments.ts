import type { Appointment } from '@/types'
import { readStore, writeStore } from '@/lib/storage'
import { uid } from '@/lib/id'

const KEY = 'appointments'

function load(): Appointment[] {
  return readStore<Appointment[]>(KEY, [])
}

function persist(list: Appointment[]): void {
  writeStore(KEY, list)
}

function byTime(a: Appointment, b: Appointment): number {
  return a.inicio.localeCompare(b.inicio)
}

export type AppointmentInput = Omit<Appointment, 'id' | 'criadoEm' | 'atualizadoEm'>

export const appointmentsService = {
  list(): Appointment[] {
    return load()
  },
  listByDate(data: string): Appointment[] {
    return load()
      .filter((a) => a.data === data)
      .sort(byTime)
  },
  countByDate(data: string): number {
    return load().filter((a) => a.data === data).length
  },
  /** Contagem por data para um intervalo (mapa data -> total). */
  countsBetween(inicio: string, fim: string): Record<string, number> {
    const map: Record<string, number> = {}
    for (const a of load()) {
      if (a.data >= inicio && a.data <= fim) map[a.data] = (map[a.data] ?? 0) + 1
    }
    return map
  },
  create(input: AppointmentInput): Appointment {
    const now = new Date().toISOString()
    const appt: Appointment = { ...input, id: uid(), criadoEm: now, atualizadoEm: now }
    persist([...load(), appt])
    return appt
  },
  update(id: string, input: AppointmentInput): Appointment | undefined {
    const list = load()
    const idx = list.findIndex((a) => a.id === id)
    if (idx === -1) return undefined
    const updated: Appointment = { ...list[idx], ...input, atualizadoEm: new Date().toISOString() }
    list[idx] = updated
    persist(list)
    return updated
  },
  remove(id: string): void {
    persist(load().filter((a) => a.id !== id))
  },
}
