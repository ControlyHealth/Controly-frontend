import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { userService } from '@/services/user'

/**
 * Protege rotas privadas em duas camadas:
 *  1. sem sessão válida   → /login
 *  2. sem assinatura ativa → /planos (concluir o fluxo de assinatura)
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  if (!userService.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  if (!userService.hasActiveSubscription()) {
    return <Navigate to="/planos" replace />
  }
  return <>{children}</>
}
