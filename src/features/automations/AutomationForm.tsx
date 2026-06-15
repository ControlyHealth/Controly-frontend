import { useState } from 'react'
import type { Automation, AutomationTrigger } from '@/types'
import type { AutomationInput } from '@/services/automations'
import { Field, Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TRIGGER_LABELS } from './triggers'

export function AutomationForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Automation
  onSubmit: (data: AutomationInput) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<AutomationInput>({
    nome: initial?.nome ?? '',
    gatilho: initial?.gatilho ?? 'lembrete_24h',
    canal: 'whatsapp',
    mensagem: initial?.mensagem ?? '',
    ativo: initial?.ativo ?? true,
  })

  function set<K extends keyof AutomationInput>(key: K, value: AutomationInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim() || !form.mensagem.trim()) return
    onSubmit({ ...form, nome: form.nome.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nome da automação *">
        <Input value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex.: Lembrete de consulta" autoFocus required />
      </Field>
      <Field label="Gatilho *">
        <Select value={form.gatilho} onChange={(e) => set('gatilho', e.target.value as AutomationTrigger)}>
          {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </Field>
      <Field label="Mensagem (WhatsApp) *" hint="Use {{nome}} e {{horario}} para personalizar.">
        <Textarea
          value={form.mensagem}
          onChange={(e) => set('mensagem', e.target.value)}
          placeholder="Olá {{nome}}! Passando para lembrar da sua consulta..."
          className="min-h-32"
          required
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={form.ativo} onChange={(e) => set('ativo', e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
        Ativar imediatamente
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{initial ? 'Salvar' : 'Criar automação'}</Button>
      </div>
    </form>
  )
}
