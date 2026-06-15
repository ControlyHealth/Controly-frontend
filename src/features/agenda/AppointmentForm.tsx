import { useState } from 'react'
import type { Appointment, AppointmentStatus } from '@/types'
import type { AppointmentInput } from '@/services/appointments'
import { patientsService } from '@/services/patients'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const APPT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  atendido: 'Atendido',
  faltou: 'Faltou',
  cancelado: 'Cancelado',
}

const STATUSES = Object.keys(APPT_STATUS_LABEL) as AppointmentStatus[]

export function AppointmentForm({
  initial,
  defaultDate,
  onSubmit,
  onCancel,
}: {
  initial?: Appointment
  defaultDate?: string
  onSubmit: (data: AppointmentInput) => void
  onCancel: () => void
}) {
  const patients = patientsService.list()
  const [form, setForm] = useState<AppointmentInput>({
    pacienteId: initial?.pacienteId ?? patients[0]?.id ?? '',
    data: initial?.data ?? defaultDate ?? new Date().toISOString().slice(0, 10),
    inicio: initial?.inicio ?? '09:00',
    fim: initial?.fim ?? '09:30',
    procedimento: initial?.procedimento ?? '',
    status: initial?.status ?? 'agendado',
    observacao: initial?.observacao ?? '',
  })
  const [erro, setErro] = useState<string | null>(null)

  function set<K extends keyof AppointmentInput>(key: K, value: AppointmentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.pacienteId) {
      setErro('Selecione um paciente.')
      return
    }
    if (form.fim <= form.inicio) {
      setErro('O horário final deve ser depois do inicial.')
      return
    }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Paciente *">
        {patients.length === 0 ? (
          <p className="text-sm text-slate-400">Cadastre um paciente primeiro.</p>
        ) : (
          <Select value={form.pacienteId} onChange={(e) => set('pacienteId', e.target.value)}>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Data">
        <Input type="date" value={form.data} onChange={(e) => set('data', e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Início">
          <Input type="time" value={form.inicio} onChange={(e) => set('inicio', e.target.value)} />
        </Field>
        <Field label="Fim">
          <Input type="time" value={form.fim} onChange={(e) => set('fim', e.target.value)} />
        </Field>
      </div>

      <Field label="Procedimento">
        <Input
          value={form.procedimento}
          onChange={(e) => set('procedimento', e.target.value)}
          placeholder="Ex.: Limpeza, restauração, ajuste de aparelho…"
        />
      </Field>

      <Field label="Status">
        <Select value={form.status} onChange={(e) => set('status', e.target.value as AppointmentStatus)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {APPT_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Observação">
        <Textarea
          value={form.observacao}
          onChange={(e) => set('observacao', e.target.value)}
          placeholder="Anotações da consulta…"
        />
      </Field>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={patients.length === 0}>
          {initial ? 'Salvar alterações' : 'Agendar consulta'}
        </Button>
      </div>
    </form>
  )
}
