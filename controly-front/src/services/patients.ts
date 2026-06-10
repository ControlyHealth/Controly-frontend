import type { Patient } from '@/types'
import { readStore, writeStore } from '@/lib/storage'
import { uid } from '@/lib/id'
import { SEED_PATIENTS } from '@/data/seed'

const KEY = 'patients'

function load(): Patient[] {
  return readStore<Patient[]>(KEY, SEED_PATIENTS)
}

function persist(list: Patient[]): void {
  writeStore(KEY, list)
}

export type PatientInput = Omit<Patient, 'id' | 'criadoEm' | 'atualizadoEm'>

export const patientsService = {
  list(): Patient[] {
    return load().sort((a, b) => a.nome.localeCompare(b.nome))
  },
  get(id: string): Patient | undefined {
    return load().find((p) => p.id === id)
  },
  create(input: PatientInput): Patient {
    const now = new Date().toISOString()
    const patient: Patient = { ...input, id: uid(), criadoEm: now, atualizadoEm: now }
    persist([patient, ...load()])
    return patient
  },
  update(id: string, input: PatientInput): Patient | undefined {
    const list = load()
    const idx = list.findIndex((p) => p.id === id)
    if (idx === -1) return undefined
    const updated: Patient = { ...list[idx], ...input, atualizadoEm: new Date().toISOString() }
    list[idx] = updated
    persist(list)
    return updated
  },
  remove(id: string): void {
    persist(load().filter((p) => p.id !== id))
  },
}
