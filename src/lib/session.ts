/**
 * Sessão do usuário no cliente: tokens JWT + usuário autenticado.
 *
 * Centraliza o que antes ficava espalhado no localStorage. O cliente HTTP
 * (lib/api.ts) lê o access token daqui para montar o header Authorization.
 */
import type { User } from '@/types'

const PREFIX = 'controly:'
const ACCESS_KEY = PREFIX + 'auth:access'
const REFRESH_KEY = PREFIX + 'auth:refresh'
const USER_KEY = PREFIX + 'auth:user'

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

/** Listeners notificados quando a sessão muda (login/logout/refresh). */
const listeners = new Set<() => void>()

function notify(): void {
  for (const fn of listeners) fn()
}

export const session = {
  /** Inscreve um callback para mudanças de sessão. Retorna função de cleanup. */
  subscribe(fn: () => void): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_KEY)
    } catch {
      return null
    }
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY)
    } catch {
      return null
    }
  },

  setTokens({ accessToken, refreshToken }: AuthTokens): void {
    try {
      localStorage.setItem(ACCESS_KEY, accessToken)
      if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
    } catch {
      /* ignore */
    }
    notify()
  },

  getUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  },

  setUser(user: User | null): void {
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
      else localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
    notify()
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  },

  clear(): void {
    try {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
      localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
    notify()
  },
}
