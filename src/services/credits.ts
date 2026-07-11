/**
 * Créditos de mensagem (saldo consumível) — mock localStorage.
 *
 * Modela o padrão de mercado: além da assinatura, envios de campanha
 * consomem créditos por categoria. No backend real, o débito acontece
 * a cada disparo confirmado pelo provedor (Meta/Twilio).
 */
import { readStore, writeStore } from '@/lib/storage'

export interface CreditBalance {
  marketing: number
  confirmacoes: number
  sms: number
}

export interface CreditPack {
  id: string
  label: string
  tipo: keyof CreditBalance
  quantidade: number
  preco: number
}

const KEY = 'credits'

const SALDO_INICIAL: CreditBalance = { marketing: 30, confirmacoes: 100, sms: 30 }

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'conf100', label: '100 confirmações WhatsApp', tipo: 'confirmacoes', quantidade: 100, preco: 49 },
  { id: 'mkt50', label: '50 mensagens de marketing', tipo: 'marketing', quantidade: 50, preco: 39 },
  { id: 'sms50', label: '50 SMS', tipo: 'sms', quantidade: 50, preco: 29 },
]

export const creditsService = {
  balance(): CreditBalance {
    return readStore<CreditBalance>(KEY, SALDO_INICIAL)
  },
  add(tipo: keyof CreditBalance, quantidade: number): CreditBalance {
    const b = this.balance()
    const novo = { ...b, [tipo]: b[tipo] + quantidade }
    writeStore(KEY, novo)
    return novo
  },
}
