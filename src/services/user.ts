/**
 * Serviço de autenticação e conta.
 *
 * ⚠️ CAMADA MOCK (protótipo). Simula o backend no cliente para destravar o
 * fluxo de UX (cadastro → validação → planos → assinatura → dashboard).
 *
 * O contrato público (register / login / logout / subscribe / current) foi
 * desenhado para espelhar o futuro backend FastAPI. Quando a API existir,
 * basta trocar o corpo destes métodos por chamadas ao `lib/api.ts` — as telas
 * não precisam mudar. Os tokens já são espelhados em `lib/session`, que é o
 * que o `api.ts` lê para montar o header Authorization.
 *
 * NADA aqui é seguro de verdade: o "hash" é simbólico e a validação roda no
 * cliente. Segurança real (argon2/bcrypt, JWT assinado, rate limit) é
 * responsabilidade do backend.
 */
import type { User } from '@/types'
import { readStore, writeStore } from '@/lib/storage'
import { session } from '@/lib/session'
import { uid } from '@/lib/id'
import { planHasFeature, type Feature } from '@/lib/entitlements'

// ---------------------------------------------------------------- tipos

export type AccountType = 'dentist' | 'clinic'
export type BillingCycle = 'mensal' | 'anual'
export type SubscriptionStatus = 'active' | 'pending' | 'canceled' | 'expired'
export type DentistQuantity = '1' | '2-5' | '6-10' | '11-20' | '20+'

export interface Subscription {
  id: string
  planId: string
  planName: string
  cycle: BillingCycle
  status: SubscriptionStatus
  renewsAt: string // ISO
}

export interface Account {
  id: string
  accountType: AccountType
  name: string // nome do dentista ou nome da clínica
  email: string
  passwordHash: string
  phone?: string
  active: boolean
  createdAt: string
  // dentista
  cpf?: string
  cro?: string
  croState?: string
  specialty?: string
  professionalName?: string
  // clínica
  cnpj?: string
  responsible?: string
  address?: string
  city?: string
  state?: string
  dentistQuantity?: DentistQuantity
  // conta demo (visitante) — acesso restrito, não pode editar perfil
  isGuest?: boolean
  // assinatura
  subscription?: Subscription
}

export interface DentistRegisterInput {
  accountType: 'dentist'
  name: string
  email: string
  password: string
  cpf: string
  cro: string
  croState: string
  specialty: string
  phone: string
  professionalName?: string
}

export interface ClinicRegisterInput {
  accountType: 'clinic'
  clinicName: string
  cnpj: string
  responsible: string
  email: string
  password: string
  phone: string
  address: string
  city: string
  state: string
  dentistQuantity: DentistQuantity
}

export type RegisterInput = DentistRegisterInput | ClinicRegisterInput

/** Erro de auth com código estável (espelha o envelope do backend). */
export class AuthError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

// ---------------------------------------------------------------- "banco"

const DB_KEY = 'auth:accounts'
const REASON_KEY = 'controly:auth:reason'

function loadAccounts(): Account[] {
  return readStore<Account[]>(DB_KEY, [])
}
function saveAccounts(list: Account[]): void {
  writeStore(DB_KEY, list)
}
function findByEmail(email: string): Account | undefined {
  const norm = email.trim().toLowerCase()
  return loadAccounts().find((a) => a.email.toLowerCase() === norm)
}
function findById(id: string): Account | undefined {
  return loadAccounts().find((a) => a.id === id)
}
function upsert(acc: Account): void {
  const list = loadAccounts()
  const i = list.findIndex((a) => a.id === acc.id)
  if (i >= 0) list[i] = acc
  else list.push(acc)
  saveAccounts(list)
}

// -------------------------------------------------- hash + token (MOCK)

/** "Hash" simbólico (djb2). NÃO é seguro — só evita texto puro no protótipo. */
function mockHash(plain: string): string {
  let h = 5381
  for (let i = 0; i < plain.length; i++) h = (h * 33) ^ plain.charCodeAt(i)
  return 'mock$' + (h >>> 0).toString(16)
}
function verifyHash(plain: string, hash: string): boolean {
  return mockHash(plain) === hash
}

const ACCESS_TTL_MS = 12 * 60 * 60 * 1000 // 12h

/** Token mock com expiração embutida: base64(JSON{ sub, exp }). */
function makeToken(sub: string): string {
  const payload = { sub, exp: Date.now() + ACCESS_TTL_MS }
  return btoa(JSON.stringify(payload))
}
function readToken(token: string | null): { sub: string; exp: number } | null {
  if (!token) return null
  try {
    return JSON.parse(atob(token)) as { sub: string; exp: number }
  } catch {
    return null
  }
}

function accountToUser(acc: Account): User {
  return {
    id: acc.id,
    nome: acc.professionalName?.trim() || acc.name,
    email: acc.email,
    clinica: acc.accountType === 'clinic' ? acc.name : 'Controly Odontologia',
    cargo: acc.accountType === 'dentist' ? acc.specialty || 'Cirurgião-dentista' : 'Clínica',
  }
}

function startSession(acc: Account): void {
  session.setTokens({ accessToken: makeToken(acc.id), refreshToken: makeToken(acc.id) })
  session.setUser(accountToUser(acc))
  try {
    localStorage.removeItem(REASON_KEY)
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------- service

export const userService = {
  // -------- sessão / usuário atual (compat. Sidebar/Dashboard) --------

  /** Usuário autenticado (shape enxuto para a UI), ou null. */
  current(): User | null {
    if (!this.isAuthenticated()) return null
    return session.getUser()
  },

  currentName(): string | null {
    return this.current()?.nome ?? null
  },

  /** Conta completa do usuário logado (dados de cadastro + assinatura). */
  currentAccount(): Account | null {
    const token = readToken(session.getAccessToken())
    if (!token) return null
    return findById(token.sub) ?? null
  },

  /** Sessão válida = token presente e não expirado. */
  isAuthenticated(): boolean {
    const token = readToken(session.getAccessToken())
    if (!token) return false
    if (Date.now() > token.exp) {
      // expirou: limpa e registra o motivo para a tela de login
      try {
        localStorage.setItem(REASON_KEY, 'expired')
      } catch {
        /* ignore */
      }
      session.clear()
      return false
    }
    return true
  },

  hasActiveSubscription(): boolean {
    return this.currentAccount()?.subscription?.status === 'active'
  },

  /** Id do plano da assinatura ativa (ou undefined). */
  currentPlanId(): string | undefined {
    const sub = this.currentAccount()?.subscription
    return sub?.status === 'active' ? sub.planId : undefined
  },

  /**
   * O plano do usuário libera este recurso?
   * Visitante (demo) enxerga tudo — a demo existe para mostrar o produto.
   * Sem assinatura ativa, nada é liberado (o RequireAuth já barra antes).
   */
  hasFeature(feature: Feature): boolean {
    if (this.isGuest()) return true
    return planHasFeature(this.currentPlanId(), feature)
  },

  /** Conta demo/visitante (acesso restrito). */
  isGuest(): boolean {
    return this.currentAccount()?.isGuest === true
  },

  /** Usuário real autenticado (não visitante). Requisito para editar perfil. */
  isVerified(): boolean {
    return this.isAuthenticated() && !this.isGuest()
  },

  /** Motivo do último logout involuntário (ex.: 'expired'), consumido 1x. */
  takeAuthReason(): string | null {
    try {
      const r = localStorage.getItem(REASON_KEY)
      if (r) localStorage.removeItem(REASON_KEY)
      return r
    } catch {
      return null
    }
  },

  // ------------------------------ login --------------------------------

  /**
   * Autentica por e-mail + senha. Lança `AuthError` com código estável:
   *  - EMAIL_NOT_FOUND, INVALID_PASSWORD, ACCOUNT_DISABLED.
   */
  login(email: string, password: string): User {
    const acc = findByEmail(email)
    if (!acc) throw new AuthError('EMAIL_NOT_FOUND', 'E-mail não encontrado.')
    if (!acc.active) throw new AuthError('ACCOUNT_DISABLED', 'Esta conta está desativada.')
    if (!verifyHash(password, acc.passwordHash))
      throw new AuthError('INVALID_PASSWORD', 'Senha incorreta.')
    startSession(acc)
    return accountToUser(acc)
  },

  // ---------------------------- cadastro -------------------------------

  /**
   * Cria a conta (dentista ou clínica) e já inicia a sessão — mas SEM
   * assinatura. O acesso ao dashboard fica bloqueado até assinar um plano.
   * Lança `AuthError('EMAIL_IN_USE')` se o e-mail já existir.
   */
  register(input: RegisterInput): Account {
    if (findByEmail(input.email))
      throw new AuthError('EMAIL_IN_USE', 'Já existe uma conta com este e-mail.')

    const base = {
      id: uid(),
      email: input.email.trim(),
      passwordHash: mockHash(input.password),
      phone: input.phone.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    }

    const acc: Account =
      input.accountType === 'dentist'
        ? {
            ...base,
            accountType: 'dentist',
            name: input.name.trim(),
            cpf: input.cpf,
            cro: input.cro,
            croState: input.croState,
            specialty: input.specialty,
            professionalName: input.professionalName?.trim() || undefined,
          }
        : {
            ...base,
            accountType: 'clinic',
            name: input.clinicName.trim(),
            cnpj: input.cnpj,
            responsible: input.responsible.trim(),
            address: input.address.trim(),
            city: input.city.trim(),
            state: input.state,
            dentistQuantity: input.dentistQuantity,
          }

    upsert(acc)
    startSession(acc)
    return acc
  },

  // --------------------------- assinatura ------------------------------

  /**
   * Cria/ativa a assinatura da conta logada (chamado após o "pagamento" mock).
   * Só depois disso o RequireAuth libera o dashboard.
   */
  subscribe(input: { planId: string; planName: string; cycle: BillingCycle }): Subscription {
    const acc = this.currentAccount()
    if (!acc) throw new AuthError('NOT_AUTHENTICATED', 'Faça login para assinar.')
    const now = new Date()
    const renews = new Date(now)
    if (input.cycle === 'anual') renews.setFullYear(renews.getFullYear() + 1)
    else renews.setMonth(renews.getMonth() + 1)

    const subscription: Subscription = {
      id: uid(),
      planId: input.planId,
      planName: input.planName,
      cycle: input.cycle,
      status: 'active',
      renewsAt: renews.toISOString(),
    }
    upsert({ ...acc, subscription })
    // renova a sessão para refletir o novo estado
    session.setUser(accountToUser({ ...acc, subscription }))
    return subscription
  },

  // ------------------------------ logout -------------------------------

  logout(): void {
    session.clear()
  },

  /** Atualiza dados da conta logada (usado por telas de perfil). */
  save(patch: Partial<Account>): Account | null {
    const acc = this.currentAccount()
    if (!acc) return null
    const updated = { ...acc, ...patch, id: acc.id }
    upsert(updated)
    session.setUser(accountToUser(updated))
    return updated
  },

  // ------------------------- demo / visitante --------------------------

  /** Cria (uma vez) e loga uma conta demo já com assinatura ativa. */
  loginAsGuest(): User {
    const email = 'visitante@controly.app'
    const existing = findByEmail(email)
    const acc: Account = existing
      ? { ...existing, isGuest: true }
      : {
          id: uid(),
          accountType: 'dentist',
          name: 'Visitante',
          email,
          passwordHash: mockHash('demo'),
          phone: '',
          active: true,
          isGuest: true,
          createdAt: new Date().toISOString(),
          specialty: 'Cirurgião-dentista',
          subscription: {
            id: uid(),
            planId: 'individual',
            planName: 'Individual (demo)',
            cycle: 'mensal',
            status: 'active',
            renewsAt: new Date(Date.now() + 30 * 864e5).toISOString(),
          },
        }
    upsert(acc)
    startSession(acc)
    return accountToUser(acc)
  },
}
