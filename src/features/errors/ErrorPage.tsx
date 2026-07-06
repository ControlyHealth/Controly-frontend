import { useRouteError, isRouteErrorResponse, useNavigate, Link } from 'react-router-dom'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { userService } from '@/services/user'
import { NotFoundPage } from './NotFoundPage'

function homePath(): string {
  if (!userService.isAuthenticated()) return '/login'
  return userService.hasActiveSubscription() ? '/' : '/planos'
}

/** Extrai título/descrição/detalhe técnico de qualquer erro capturado pela rota. */
function describe(error: unknown): { title: string; description: string; detail?: string } {
  if (isRouteErrorResponse(error)) {
    return {
      title: `Erro ${error.status}`,
      description: error.statusText || 'A requisição não pôde ser concluída.',
      detail: typeof error.data === 'string' ? error.data : undefined,
    }
  }
  if (error instanceof Error) {
    return {
      title: 'Algo deu errado',
      description: 'Encontramos um problema inesperado ao carregar esta página.',
      detail: error.message,
    }
  }
  return { title: 'Algo deu errado', description: 'Ocorreu um erro inesperado.' }
}

/**
 * Boundary de erro das rotas (react-router `errorElement`).
 * Captura exceções de renderização/loaders e mostra uma tela amigável.
 * Se for um 404, delega para a página personalizada de "não encontrado".
 */
export function ErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  const { title, description, detail } = describe(error)
  const isDev = import.meta.env.DEV

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="w-full max-w-md">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <AlertTriangle size={26} />
        </span>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>

        {isDev && detail && (
          <pre className="mt-5 max-h-40 overflow-auto rounded-xl bg-slate-900 px-4 py-3 text-left text-xs text-slate-200">
            {detail}
          </pre>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate(0)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 active:scale-[0.99] cursor-pointer"
          >
            <RotateCcw size={17} /> Tentar novamente
          </button>
          <Link
            to={homePath()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Home size={17} /> Voltar ao início
          </Link>
        </div>

        <p className="mt-10 text-xs text-slate-400">
          Se o problema continuar,{' '}
          <a href="mailto:contato@controly.app" className="font-medium text-brand-600 hover:text-brand-700">
            avise o suporte
          </a>
          .
        </p>
      </div>
    </div>
  )
}
