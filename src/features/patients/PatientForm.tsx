import { useState } from 'react'
import type { Patient } from '@/types'
import type { PatientInput } from '@/services/patients'
import { Field, Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function PatientForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Patient
  onSubmit: (data: PatientInput) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<PatientInput>({
    nome: initial?.nome ?? '',
    cpf: initial?.cpf ?? '',
    telefone: initial?.telefone ?? '',
    email: initial?.email ?? '',
    dataNascimento: initial?.dataNascimento ?? '',
    observacoes: initial?.observacoes ?? '',
  })

  function set<K extends keyof PatientInput>(key: K, value: PatientInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    onSubmit({ ...form, nome: form.nome.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nome completo *">
        <Input
          value={form.nome}
          onChange={(e) => set('nome', e.target.value)}
          placeholder="Ex.: Maria da Silva"
          autoFocus
          required
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="CPF">
          <Input value={form.cpf} onChange={(e) => set('cpf', e.target.value)} placeholder="000.000.000-00" />
        </Field>
        <Field label="Data de nascimento">
          <Input
            type="date"
            value={form.dataNascimento}
            onChange={(e) => set('dataNascimento', e.target.value)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Telefone / WhatsApp">
          <Input
            value={form.telefone}
            onChange={(e) => set('telefone', e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </Field>
        <Field label="E-mail">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="email@exemplo.com"
          />
        </Field>
      </div>
      <Field label="Observações clínicas">
        <Textarea
          value={form.observacoes}
          onChange={(e) => set('observacoes', e.target.value)}
          placeholder="Alergias, condições, histórico relevante..."
        />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{initial ? 'Salvar alterações' : 'Cadastrar paciente'}</Button>
      </div>
    </form>
  )
}
