import type { Patient } from '@/types'
import { readStore, writeStore } from '@/lib/storage'
import { uid } from '@/lib/id'
import { RegraDeNegocioError, chaveTexto, chaveEmail, soDigitos } from '@/lib/dedupe'

const KEY = 'patients'

function load(): Patient[] {
  return readStore<Patient[]>(KEY, [])
}

function persist(list: Patient[]): void {
  writeStore(KEY, list)
}

export type PatientInput = Omit<Patient, 'id' | 'criadoEm' | 'atualizadoEm'>

/**
 * Regra de negócio: não permitir dois cadastros do mesmo paciente.
 * Bloqueia se CPF, e-mail, telefone OU nome (normalizado) já existirem
 * em outro paciente. `ignorarId` exclui o próprio registro em edições.
 */
function validarDuplicidade(input: PatientInput, ignorarId?: string): void {
  const nome = chaveTexto(input.nome)
  const cpf = soDigitos(input.cpf)
  const telefone = soDigitos(input.telefone)
  const email = chaveEmail(input.email)

  for (const p of load()) {
    if (p.id === ignorarId) continue
    if (cpf && soDigitos(p.cpf) === cpf) {
      throw new RegraDeNegocioError(`Já existe um paciente com este CPF (${p.nome}).`)
    }
    if (email && chaveEmail(p.email) === email) {
      throw new RegraDeNegocioError(`Já existe um paciente com este e-mail (${p.nome}).`)
    }
    if (telefone && soDigitos(p.telefone) === telefone) {
      throw new RegraDeNegocioError(`Já existe um paciente com este telefone (${p.nome}).`)
    }
    if (nome && chaveTexto(p.nome) === nome) {
      throw new RegraDeNegocioError('Já existe um paciente com este nome. Se for um homônimo, diferencie o nome (ex.: sobrenome adicional).')
    }
  }
}

export const patientsService = {
  list(): Patient[] {
    return load().sort((a, b) => a.nome.localeCompare(b.nome))
  },
  get(id: string): Patient | undefined {
    return load().find((p) => p.id === id)
  },
  create(input: PatientInput): Patient {
    validarDuplicidade(input)
    const now = new Date().toISOString()
    const patient: Patient = { ...input, id: uid(), criadoEm: now, atualizadoEm: now }
    persist([patient, ...load()])
    return patient
  },
  update(id: string, input: PatientInput): Patient | undefined {
    const list = load()
    const idx = list.findIndex((p) => p.id === id)
    if (idx === -1) return undefined
    validarDuplicidade(input, id)
    const updated: Patient = { ...list[idx], ...input, atualizadoEm: new Date().toISOString() }
    list[idx] = updated
    persist(list)
    return updated
  },
  remove(id: string): void {
    persist(load().filter((p) => p.id !== id))
  },
}
