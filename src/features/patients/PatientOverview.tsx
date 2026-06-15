import { useMemo } from 'react'
import {
  Phone,
  Mail,
  Calendar,
  IdCard,
  Stethoscope,
  ImageIcon,
  Braces,
  CircleAlert,
} from 'lucide-react'
import type { Patient, ToothStatus, OrtoMarker } from '@/types'
import { odontogramService } from '@/services/odontogram'
import { radiografiasService } from '@/services/radiografias'
import { orthoService } from '@/services/ortho'
import { STATUS_META, STATUS_ORDER, ORTO_META, ORTO_ORDER } from '@/data/teeth'
import { ORTHO_STATUS_LABEL, APPLIANCE_LABEL } from '@/features/ortho/OrthoPanel'
import { Card } from '@/components/ui/Card'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'

function idade(dataNascimento?: string): number | null {
  if (!dataNascimento) return null
  const nasc = new Date(dataNascimento)
  if (Number.isNaN(nasc.getTime())) return null
  const hoje = new Date()
  let anos = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--
  return anos
}

export function PatientOverview({
  patient,
  onGoto,
}: {
  patient: Patient
  onGoto: (tab: 'odontograma' | 'ortodontia' | 'radiografias') => void
}) {
  const resumo = useMemo(() => {
    const chart = odontogramService.get(patient.id)
    const dentes = Object.values(chart.dentes)
    const porStatus: Record<ToothStatus, number> = {
      saudavel: 0,
      carie: 0,
      lesao_nao_cariosa: 0,
      restaurado: 0,
      tratamento: 0,
      ausente: 0,
      implante: 0,
    }
    const porOrto: Record<OrtoMarker, number> = {
      nenhum: 0,
      bracket: 0,
      banda: 0,
      contencao: 0,
      extracao: 0,
      alinhador: 0,
    }
    for (const d of dentes) {
      porStatus[d.status]++
      porOrto[d.orto ?? 'nenhum']++
    }
    const comOrto = dentes.length - porOrto.nenhum
    return { porStatus, porOrto, comOrto }
  }, [patient.id])

  const radiografias = radiografiasService.count(patient.id)
  const ortho = orthoService.get(patient.id)
  const anos = idade(patient.dataNascimento)

  const condicoes = STATUS_ORDER.filter((s) => s !== 'saudavel' && resumo.porStatus[s] > 0)
  const marcacoes = ORTO_ORDER.filter((m) => resumo.porOrto[m] > 0)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Dados cadastrais */}
      <Card className="p-5 lg:col-span-1">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Dados do paciente</h3>
        <dl className="space-y-2.5 text-sm">
          {anos !== null && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={15} className="text-slate-400" />
              {anos} anos{patient.dataNascimento ? ` · ${formatDate(patient.dataNascimento)}` : ''}
            </div>
          )}
          {patient.cpf && (
            <div className="flex items-center gap-2 text-slate-600">
              <IdCard size={15} className="text-slate-400" /> {patient.cpf}
            </div>
          )}
          {patient.telefone && (
            <div className="flex items-center gap-2 text-slate-600">
              <Phone size={15} className="text-slate-400" /> {patient.telefone}
            </div>
          )}
          {patient.email && (
            <div className="flex items-center gap-2 break-all text-slate-600">
              <Mail size={15} className="text-slate-400" /> {patient.email}
            </div>
          )}
        </dl>
        {patient.observacoes && (
          <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <CircleAlert size={15} className="mt-0.5 shrink-0" />
            <span>{patient.observacoes}</span>
          </p>
        )}
      </Card>

      {/* Resumo clínico */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
        {/* Odontograma */}
        <Card className="p-5">
          <button
            type="button"
            onClick={() => onGoto('odontograma')}
            className="mb-3 flex w-full items-center gap-2 text-left cursor-pointer"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Stethoscope size={16} />
            </span>
            <h3 className="text-sm font-semibold text-slate-800">Odontograma</h3>
          </button>
          {condicoes.length === 0 ? (
            <p className="text-sm text-slate-400">Sem condições registradas — arcada saudável.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {condicoes.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: STATUS_META[s].fill, color: STATUS_META[s].stroke }}
                >
                  <span className={cn('h-2 w-2 rounded-full', STATUS_META[s].dot)} />
                  {STATUS_META[s].label}: {resumo.porStatus[s]}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Ortodontia */}
        <Card className="p-5">
          <button
            type="button"
            onClick={() => onGoto('ortodontia')}
            className="mb-3 flex w-full items-center gap-2 text-left cursor-pointer"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Braces size={16} />
            </span>
            <h3 className="text-sm font-semibold text-slate-800">Ortodontia</h3>
          </button>
          <p className="text-sm text-slate-600">
            <span className="font-medium">{ORTHO_STATUS_LABEL[ortho.status]}</span>
            {ortho.aparelho ? ` · ${APPLIANCE_LABEL[ortho.aparelho]}` : ''}
          </p>
          {marcacoes.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {marcacoes.map((m) => (
                <span key={m} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={cn('h-2 w-2 rounded-full', ORTO_META[m].dot)} />
                  {ORTO_META[m].label}: {resumo.porOrto[m]}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-400">Nenhuma marcação no odontograma.</p>
          )}
        </Card>

        {/* Radiografias */}
        <Card className="p-5 sm:col-span-2">
          <button
            type="button"
            onClick={() => onGoto('radiografias')}
            className="flex w-full items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <ImageIcon size={16} />
              </span>
              <h3 className="text-sm font-semibold text-slate-800">Radiografias</h3>
            </div>
            <span className="text-sm text-slate-500">
              {radiografias} {radiografias === 1 ? 'exame' : 'exames'}
            </span>
          </button>
        </Card>
      </div>
    </div>
  )
}
