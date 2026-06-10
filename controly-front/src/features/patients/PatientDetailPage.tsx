import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, Calendar, IdCard, MessageCircle } from 'lucide-react'
import { patientsService } from '@/services/patients'
import { odontogramService } from '@/services/odontogram'
import { STATUS_META } from '@/data/teeth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Odontogram } from '@/features/odontogram/Odontogram'
import { formatDate, initials } from '@/lib/format'

export function PatientDetailPage() {
  const { id = '' } = useParams()
  const patient = patientsService.get(id)
  const [tab, setTab] = useState<'odontograma' | 'observacoes'>('odontograma')

  // observações marcadas no odontograma (recalculado a cada render para refletir edições)
  const notas = Object.values(odontogramService.get(id).dentes)
    .filter((d) => d.observacao?.trim() || d.status !== 'saudavel')
    .sort((a, b) => a.numero - b.numero)

  if (!patient) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600">Paciente não encontrado.</p>
        <Link to="/pacientes" className="mt-3 inline-block text-sm font-medium text-brand-600">
          Voltar para a lista
        </Link>
      </Card>
    )
  }

  const waLink = patient.telefone
    ? `https://wa.me/55${patient.telefone.replace(/\D/g, '')}`
    : undefined

  return (
    <div className="space-y-5">
      <Link to="/pacientes" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Pacientes
      </Link>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
              {initials(patient.nome)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{patient.nome}</h2>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                {patient.cpf && (
                  <span className="flex items-center gap-1.5"><IdCard size={14} /> {patient.cpf}</span>
                )}
                {patient.dataNascimento && (
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(patient.dataNascimento)}</span>
                )}
                {patient.telefone && (
                  <span className="flex items-center gap-1.5"><Phone size={14} /> {patient.telefone}</span>
                )}
                {patient.email && (
                  <span className="flex items-center gap-1.5"><Mail size={14} /> {patient.email}</span>
                )}
              </div>
            </div>
          </div>
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer">
              <Button variant="secondary">
                <MessageCircle size={16} className="text-green-600" /> WhatsApp
              </Button>
            </a>
          )}
        </div>
        {patient.observacoes && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <strong>Obs. clínica:</strong> {patient.observacoes}
          </p>
        )}
      </Card>

      <div className="flex gap-1 border-b border-slate-200">
        {(['odontograma', 'observacoes'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              'border-b-2 px-4 py-2 text-sm font-medium transition cursor-pointer ' +
              (tab === t
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700')
            }
          >
            {t === 'odontograma' ? 'Odontograma' : `Registros (${notas.length})`}
          </button>
        ))}
      </div>

      {tab === 'odontograma' ? (
        <Odontogram pacienteId={id} />
      ) : (
        <Card className="divide-y divide-slate-100">
          {notas.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">
              Nenhum registro ainda. Marque dentes no odontograma para gerar o histórico.
            </p>
          ) : (
            notas.map((n) => {
              const meta = STATUS_META[n.status]
              return (
                <div key={n.numero} className="flex items-start gap-3 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold tabular-nums text-slate-600">
                    {n.numero}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: meta.fill, color: meta.stroke }}
                    >
                      {meta.label}
                    </span>
                    {n.observacao && <p className="mt-1 text-sm text-slate-600">{n.observacao}</p>}
                  </div>
                </div>
              )
            })
          )}
        </Card>
      )}
    </div>
  )
}
