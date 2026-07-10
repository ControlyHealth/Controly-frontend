import type { Automation } from '@/types'
import { readStore, writeStore } from '@/lib/storage'
import { uid } from '@/lib/id'
import { RegraDeNegocioError, chaveTexto } from '@/lib/dedupe'

const KEY = 'automations'

function load(): Automation[] {
  return readStore<Automation[]>(KEY, [])
}

function persist(list: Automation[]): void {
  writeStore(KEY, list)
}

export type AutomationInput = Omit<Automation, 'id' | 'criadoEm' | 'atualizadoEm'>

/** Regra de negócio: uma automação por nome. `ignorarId` exclui o próprio registro em edições. */
function validarDuplicidade(nome: string | undefined, ignorarId?: string): void {
  const chave = chaveTexto(nome)
  if (!chave) return
  for (const a of load()) {
    if (a.id === ignorarId) continue
    if (chaveTexto(a.nome) === chave) {
      throw new RegraDeNegocioError(`Já existe uma automação chamada "${a.nome}".`)
    }
  }
}

export const automationsService = {
  list(): Automation[] {
    return load()
  },
  create(input: AutomationInput): Automation {
    validarDuplicidade(input.nome)
    const now = new Date().toISOString()
    const item: Automation = { ...input, id: uid(), criadoEm: now, atualizadoEm: now }
    persist([item, ...load()])
    return item
  },
  update(id: string, input: Partial<AutomationInput>): Automation | undefined {
    const list = load()
    const idx = list.findIndex((a) => a.id === id)
    if (idx === -1) return undefined
    if (input.nome !== undefined) validarDuplicidade(input.nome, id)
    list[idx] = { ...list[idx], ...input, atualizadoEm: new Date().toISOString() }
    persist(list)
    return list[idx]
  },
  toggle(id: string): void {
    const list = load()
    const idx = list.findIndex((a) => a.id === id)
    if (idx === -1) return
    list[idx] = { ...list[idx], ativo: !list[idx].ativo, atualizadoEm: new Date().toISOString() }
    persist(list)
  },
  remove(id: string): void {
    persist(load().filter((a) => a.id !== id))
  },
}
