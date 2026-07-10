import type { Appointment } from '@/types'
import { readStore, writeStore } from '@/lib/storage'
import { uid } from '@/lib/id'
import { RegraDeNegocioError } from '@/lib/dedupe'

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

/**
 * Regra de negócio: agenda única — dois atendimentos não podem se sobrepor
 * no mesmo dia. Consultas canceladas não ocupam horário. `ignorarId` exclui
 * o próprio registro em edições.
 */
function validarConflito(input: AppointmentInput, ignorarId?: string): void {
  if (input.status === 'cancelado') return
  for (const a of load()) {
    if (a.id === ignorarId) continue
    if (a.data !== input.data || a.status === 'cancelado') continue
    // sobreposição de intervalos [inicio, fim)
    if (input.inicio < a.fim && input.fim > a.inicio) {
      throw new RegraDeNegocioError(
        `Conflito de horário: já existe uma consulta das ${a.inicio} às ${a.fim} neste dia.`,
      )
    }
  }
}

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
    validarConflito(input)
    const now = new Date().toISOString()
    const appt: Appointment = { ...input, id: uid(), criadoEm: now, atualizadoEm: now }
    persist([...load(), appt])
    return appt
  },
  update(id: string, input: AppointmentInput): Appointment | undefined {
    const list = load()
    const idx = list.findIndex((a) => a.id === id)
    if (idx === -1) return undefined
    const atual = list[idx]
    // só revalida o conflito se dia/horário mudaram — assim uma simples troca
    // de status em dados antigos (anteriores à regra) nunca fica bloqueada
    const horarioMudou =
      atual.data !== input.data || atual.inicio !== input.inicio || atual.fim !== input.fim
    if (horarioMudou || atual.status === 'cancelado') validarConflito(input, id)
    const updated: Appointment = { ...atual, ...input, atualizadoEm: new Date().toISOString() }
    list[idx] = updated
    persist(list)
    return updated
  },
  remove(id: string): void {
    persist(load().filter((a) => a.id !== id))
  },
}
