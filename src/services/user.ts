import type { User } from '@/types'
import { readStore, writeStore, removeStore } from '@/lib/storage'

const KEY = 'user'

/** Coleta o usuário salvo no "banco" (localStorage), ou null se não houver. */
function load(): User | null {
  return readStore<User | null>(KEY, null)
}

/** Deriva um nome amigável a partir do e-mail (parte antes do @). */
function nomeFromEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  if (!local) return 'Usuário'
  return local
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export const userService = {
  /** Retorna o usuário atual, ou null se não existir. */
  current(): User | null {
    return load()
  },
  /** Se o usuário existir, retorna o nome; senão retorna null. */
  currentName(): string | null {
    const user = load()
    if (user) {
      return user.nome
    } else {
      return null
    }
  },
  /** Indica se há um usuário autenticado. */
  isAuthenticated(): boolean {
    return load() !== null
  },
  /** Autentica o usuário e persiste no banco (localStorage). */
  login(input: { email: string; nome?: string }): User {
    const email = input.email.trim()
    const user: User = {
      id: 'me',
      nome: input.nome?.trim() || nomeFromEmail(email),
      email: email || undefined,
      clinica: 'Controly Odontologia',
      cargo: 'Cirurgião-dentista',
    }
    writeStore(KEY, user)
    return user
  },
  /** Encerra a sessão removendo o usuário do banco. */
  logout(): void {
    removeStore(KEY)
  },
  /** Atualiza/salva os dados do usuário no banco. */
  save(input: Partial<User>): User {
    const updated: User = { ...(load() ?? { id: 'me', nome: '' }), ...input }
    writeStore(KEY, updated)
    return updated
  },
}
