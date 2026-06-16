import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { userService } from '@/services/user'

/** Protege rotas: redireciona para /login se não houver usuário autenticado. */
export function RequireAuth({ children }: { children: ReactNode }) {
  if (!userService.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
