export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

/** Formata um número como moeda brasileira (R$). */
export function formatBRL(valor: number): string {
  return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Mantém a palavra no singular se a quantidade for 1; senão concatena "s". */
export function pluralizar(qtd: number, palavra: string): string {
  return qtd === 1 ? palavra : palavra + 's'
}

/** Tempo relativo curto em pt-BR: "agora", "há 5 min", "há 2 h", "ontem", ou data. */
export function tempoRelativo(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diffMs = Date.now() - d.getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const dias = Math.floor(h / 24)
  if (dias === 1) return 'ontem'
  if (dias < 7) return `há ${dias} dias`
  return d.toLocaleDateString('pt-BR')
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
