/**
 * Cliente HTTP da API do Controly.
 *
 * - Base URL vem de `VITE_API_URL` (deve incluir o prefixo da API, ex.:
 *   `http://localhost:8000/api/v1`).
 * - Anexa `Authorization: Bearer <access>` automaticamente.
 * - Em 401, tenta renovar o token uma vez via `/auth/refresh` e repete a request.
 * - Erros viram `ApiError` com `status`, `code`, `message` e `details`,
 *   seguindo o envelope padrão do backend: `{ error: { code, message, details } }`.
 */
import { session } from '@/lib/session'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type Query = Record<string, string | number | boolean | null | undefined>

interface RequestOptions {
  /** Querystring — valores nulos/undefined são omitidos. */
  query?: Query
  /** Corpo: objeto (vira JSON) ou FormData (multipart, sem content-type manual). */
  body?: unknown
  /** Se false, não envia o header Authorization (ex.: login). Default: true. */
  auth?: boolean
  /** Sinal de abort opcional. */
  signal?: AbortSignal
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(BASE_URL + (path.startsWith('/') ? path : `/${path}`))
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

let refreshing: Promise<boolean> | null = null

/** Tenta renovar o access token usando o refresh token. Dedup concorrente. */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = session.getRefreshToken()
  if (!refreshToken) return false
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
        if (!res.ok) return false
        const data = (await res.json()) as { access_token?: string; refresh_token?: string }
        if (!data.access_token) return false
        session.setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token })
        return true
      } catch {
        return false
      } finally {
        refreshing = null
      }
    })()
  }
  return refreshing
}

async function parseError(res: Response): Promise<ApiError> {
  let code = 'http_error'
  let message = `Erro ${res.status}`
  let details: Record<string, unknown> = {}
  try {
    const data = await res.json()
    const err = (data as { error?: { code?: string; message?: string; details?: Record<string, unknown> } }).error
    if (err) {
      code = err.code ?? code
      message = err.message ?? message
      details = err.details ?? {}
    } else if (typeof (data as { detail?: unknown }).detail === 'string') {
      message = (data as { detail: string }).detail
    }
  } catch {
    /* corpo não-JSON */
  }
  return new ApiError(res.status, code, message, details)
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const { query, body, auth = true, signal } = opts
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
    if (auth) {
      const token = session.getAccessToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }
    return fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal,
    })
  }

  let res = await doFetch()

  if (res.status === 401 && auth) {
    const ok = await tryRefresh()
    if (ok) {
      res = await doFetch()
    } else {
      session.clear()
    }
  }

  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return undefined as T

  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
}
