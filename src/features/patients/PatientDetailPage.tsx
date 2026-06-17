import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, Calendar, IdCard, MessageCircle } from 'lucide-react'
import { patientsService } from '@/services/patients'
import { odontogramService } from '@/services/odontogram'
import { STATUS_META, ORTO_META } from '@/data/teeth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Odontogram } from '@/features/odontogram/Odontogram'
import { OrthoPanel } from '@/features/ortho/OrthoPanel'
import { RadiografiasPanel } from '@/features/radiografias/RadiografiasPanel'
import { PatientOverview } from './PatientOverview'
import { formatDate, initials } from '@/lib/format'

type Tab = 'panorama' | 'odontograma' | 'ortodontia' | 'radiografias' | 'observacoes'

const TAB_LABEL: Record<Tab, string> = {
  panorama: 'Panorama',
  odontograma: 'Odontograma',
  ortodontia: 'Ortodontia',
  radiografias: 'Radiografias',
  observacoes: 'Registros',
}

export function PatientDetailPage() {
  const { id = '' } = useParams()
  const patient = patientsService.get(id)
  const [tab, setTab] = useState<Tab>('panorama')

  // observações marcadas no odontograma (recalculado a cada render para refletir edições)
  const notas = Object.values(odontogramService.get(id).dentes)
    .filter((d) => d.observacao?.trim() || d.status !== 'saudavel' || (d.orto && d.orto !== 'nenhum'))
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

  const tabs: Tab[] = ['panorama', 'odontograma', 'ortodontia', 'radiografias', 'observacoes']

  return (
    <div className="space-y-4">
      <Link to="/pacientes" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Pacientes
      </Link>

      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-base font-semibold text-brand-700">
              {initials(patient.nome)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{patient.nome}</h2>
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
      </Card>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              'whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition cursor-pointer ' +
              (tab === t
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700')
            }
          >
            {t === 'observacoes' ? `${TAB_LABEL[t]} (${notas.length})` : TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === 'panorama' && <PatientOverview patient={patient} onGoto={(t) => setTab(t)} />}

      {tab === 'odontograma' && <Odontogram pacienteId={id} />}

      {tab === 'ortodontia' && <OrthoPanel pacienteId={id} />}

      {tab === 'radiografias' && <RadiografiasPanel pacienteId={id} />}

      {tab === 'observacoes' && (
        <Card className="divide-y divide-slate-100">
          {notas.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">
              Nenhum registro ainda. Marque dentes no odontograma para gerar o histórico.
            </p>
          ) : (
            notas.map((n) => {
              const meta = STATUS_META[n.status]
              const orto = n.orto && n.orto !== 'nenhum' ? ORTO_META[n.orto] : null
              return (
                <div key={n.numero} className="flex items-start gap-3 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold tabular-nums text-slate-600">
                    {n.numero}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: meta.fill, color: meta.stroke }}
                      >
                        {meta.label}
                      </span>
                      {orto && (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: orto.color }}
                        >
                          {orto.label}
                        </span>
                      )}
                    </div>
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
