import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <p className="text-[7rem] font-extrabold leading-none tracking-tight text-brand-600 sm:text-[11rem]">
        404
      </p>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Página não encontrada
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
      >
        <ArrowLeft size={17} /> Página anterior
      </button>
    </div>
  )
}
